#!/bin/sh
set -e

echo "=== Homelab Inventory Container Starting ==="

# Initialize the database directory
mkdir -p /app/data/images/compressed /app/data/images/thumbnails

# Check if database exists, if not it will be created on first run
if [ ! -f /app/data/inventory.db ]; then
    echo "Database will be initialized on first request..."
fi

# Function to sanitize hostname (remove spaces, special chars, lowercase)
sanitize_hostname() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//'
}

# Set default hostname for Tailscale and sanitize it
RAW_HOSTNAME="${TS_HOSTNAME:-homelab-inventory}"
TS_HOSTNAME=$(sanitize_hostname "$RAW_HOSTNAME")

if [ "$RAW_HOSTNAME" != "$TS_HOSTNAME" ]; then
    echo "Note: Hostname sanitized from '$RAW_HOSTNAME' to '$TS_HOSTNAME'"
fi

# Check for Tailscale auth key
if [ -z "$TS_AUTHKEY" ]; then
    echo ""
    echo "=== Tailscale Not Configured ==="
    echo "No TS_AUTHKEY provided. Skipping Tailscale setup."
    echo "App will be available at http://localhost:3000 only."
    echo "To enable Tailscale, set TS_AUTHKEY in your .env file."
    echo "================================"
    echo ""
else
    echo "Starting Tailscale daemon..."
    tailscaled --state=/var/lib/tailscale/tailscaled.state --socket=/var/run/tailscale/tailscaled.sock &

    # Wait for tailscaled to be ready
    echo "Waiting for Tailscale daemon..."
    for i in 1 2 3 4 5 6 7 8 9 10; do
        if [ -S /var/run/tailscale/tailscaled.sock ]; then
            break
        fi
        sleep 1
    done

    if [ ! -S /var/run/tailscale/tailscaled.sock ]; then
        echo "Warning: Tailscale daemon failed to start. Continuing without Tailscale."
    else
        echo "Authenticating with Tailscale as '$TS_HOSTNAME'..."

        # Try to authenticate - don't fail if it doesn't work
        if tailscale up --authkey="$TS_AUTHKEY" --hostname="$TS_HOSTNAME" --accept-routes --accept-dns 2>&1; then
            # Wait for Tailscale to be connected (max 30 seconds)
            echo "Waiting for Tailscale connection..."
            CONNECTED=false
            for i in $(seq 1 30); do
                if tailscale status --json 2>/dev/null | grep -q '"BackendState": "Running"'; then
                    CONNECTED=true
                    break
                fi
                sleep 1
            done

            if [ "$CONNECTED" = "true" ]; then
                echo "Tailscale connected!"

                # Configure Tailscale Serve to expose the app
                echo "Configuring Tailscale Serve..."
                if tailscale serve --bg --https=443 http://localhost:3000 2>&1; then
                    # Show the Tailscale URL
                    echo ""
                    echo "=== Access Information ==="
                    TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "unknown")
                    TAILNET=$(tailscale status --json 2>/dev/null | grep -o '"MagicDNSSuffix":"[^"]*"' | cut -d'"' -f4 || echo "")

                    echo "Tailscale IP: $TAILSCALE_IP"
                    echo "Local URL: http://localhost:3000"
                    if [ -n "$TAILNET" ]; then
                        echo "Tailscale URL: https://${TS_HOSTNAME}.${TAILNET}"
                    fi
                    echo "=========================="
                    echo ""
                else
                    echo "Warning: Failed to configure Tailscale Serve. App available at http://localhost:3000"
                fi
            else
                echo "Warning: Tailscale connection timed out. App available at http://localhost:3000"
            fi
        else
            echo "Warning: Tailscale authentication failed. App available at http://localhost:3000"
            echo "Check your TS_AUTHKEY and try again."
        fi
    fi
fi

# Start supervisor to manage the Next.js app
echo "Starting application..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
