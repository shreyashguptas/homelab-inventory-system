#!/bin/bash
set -e

# Homelab Inventory System - Raspberry Pi 5 Setup Script
# Run as root or with sudo

echo "=== Homelab Inventory System Setup ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo ./setup.sh)"
    exit 1
fi

# Variables
INSTALL_DIR="/opt/homelab-inventory"
LOG_DIR="/var/log/homelab-inventory"
USER="pi"  # Change this if using a different user

echo "1. Installing system dependencies..."
apt-get update
apt-get install -y \
    nginx \
    build-essential \
    python3 \
    curl

echo "2. Installing Node.js 22.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi

echo "3. Installing PM2..."
npm install -g pm2

echo "4. Creating directories..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "$INSTALL_DIR/data/images/compressed"
mkdir -p "$INSTALL_DIR/data/images/thumbnails"
chown -R "$USER:$USER" "$INSTALL_DIR"
chown -R "$USER:$USER" "$LOG_DIR"

echo "5. Copying application files..."
# Assuming script is run from the project root
if [ -d "./src" ]; then
    cp -r ./* "$INSTALL_DIR/"
else
    echo "Error: Run this script from the project root directory"
    exit 1
fi

echo "6. Installing dependencies..."
cd "$INSTALL_DIR"
sudo -u "$USER" npm install --production

echo "7. Building Next.js application..."
sudo -u "$USER" npm run build

echo "8. Building MCP server..."
cd "$INSTALL_DIR/mcp-server"
sudo -u "$USER" npm install
sudo -u "$USER" npm run build

echo "9. Initializing database..."
cd "$INSTALL_DIR"
sudo -u "$USER" node -e "require('./src/lib/db/index.js')"

echo "10. Setting up Nginx..."
cp "$INSTALL_DIR/deploy/nginx.conf" /etc/nginx/sites-available/homelab-inventory
ln -sf /etc/nginx/sites-available/homelab-inventory /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo "11. Setting up PM2..."
cd "$INSTALL_DIR"
sudo -u "$USER" pm2 start deploy/ecosystem.config.js --env production
sudo -u "$USER" pm2 save
pm2 startup systemd -u "$USER" --hp "/home/$USER"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "The application is now running at:"
echo "  http://localhost (via Nginx)"
echo "  http://localhost:3000 (direct)"
echo ""
echo "Useful commands:"
echo "  pm2 status           - Check application status"
echo "  pm2 logs             - View application logs"
echo "  pm2 restart all      - Restart all applications"
echo ""
echo "MCP Server configuration:"
echo "  Path: $INSTALL_DIR/mcp-server/dist/index.js"
echo "  Database: $INSTALL_DIR/data/inventory.db"
echo ""
echo "For Tailscale HTTPS:"
echo "  1. Enable Tailscale HTTPS: tailscale cert inventory"
echo "  2. Update nginx.conf with your Tailscale domain"
echo "  3. Restart nginx: systemctl restart nginx"
