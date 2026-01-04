#!/bin/sh
set -e

echo "=== Homelab Inventory Container Starting ==="

# Check for required environment variables
if [ -z "$TS_AUTHKEY" ]; then
    echo "Warning: TS_AUTHKEY not set. Tailscale will not auto-authenticate."
    echo "You can set it later with: tailscale up --authkey=<key>"
fi

# Set default hostname for Tailscale
TS_HOSTNAME="${TS_HOSTNAME:-homelab-inventory}"

# Initialize the database directory
mkdir -p /app/data/images/compressed /app/data/images/thumbnails

# Check if database exists, if not it will be created on first run
if [ ! -f /app/data/inventory.db ]; then
    echo "Database will be initialized on first request..."
fi

echo "Starting Tailscale daemon..."
tailscaled --state=/var/lib/tailscale/tailscaled.state --socket=/var/run/tailscale/tailscaled.sock &

# Wait for tailscaled to be ready
sleep 2

# Authenticate with Tailscale if auth key provided
if [ -n "$TS_AUTHKEY" ]; then
    echo "Authenticating with Tailscale..."
    tailscale up --authkey="$TS_AUTHKEY" --hostname="$TS_HOSTNAME" --accept-routes --accept-dns

    # Wait for Tailscale to be connected
    echo "Waiting for Tailscale connection..."
    until tailscale status --json | grep -q '"BackendState": "Running"'; do
        sleep 1
    done

    echo "Tailscale connected!"

    # Configure Tailscale Serve to expose the app
    echo "Configuring Tailscale Serve..."
    tailscale serve --bg --https=443 http://localhost:3000

    # Show the Tailscale URL
    echo ""
    echo "=== Access Information ==="
    TAILSCALE_IP=$(tailscale ip -4)
    TAILSCALE_HOSTNAME=$(tailscale status --json | grep -o '"Self":{"ID":"[^"]*","PublicKey":"[^"]*","HostName":"[^"]*"' | grep -o '"HostName":"[^"]*"' | cut -d'"' -f4)
    TAILNET=$(tailscale status --json | grep -o '"MagicDNSSuffix":"[^"]*"' | cut -d'"' -f4)

    echo "Tailscale IP: $TAILSCALE_IP"
    echo "Local URL: http://localhost:3000"
    if [ -n "$TAILNET" ]; then
        echo "Tailscale URL: https://${TAILSCALE_HOSTNAME}.${TAILNET}"
    fi
    echo "=========================="
    echo ""
else
    echo "Tailscale not configured (no TS_AUTHKEY). App available at http://localhost:3000"
fi

# Start supervisor to manage the Next.js app
echo "Starting application..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
