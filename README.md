# Homelab Inventory System

A lightweight, self-hosted inventory management system for home lab and maker parts. Built for Raspberry Pi 5 with AI integration via MCP (Model Context Protocol).

## Features

- **Dual Tracking Modes**: Track items by quantity (e.g., "50 resistors") or individually (e.g., specific Raspberry Pi with serial number)
- **Full-Text Search**: Fast search across names, descriptions, tags, and specifications
- **Categories & Vendors**: Organize items by category and track purchase sources
- **Image Management**: Upload and compress images to WebP format
- **QR Code Labels**: Generate QR codes for easy item identification
- **CSV Import/Export**: Bulk import/export your inventory data
- **Low Stock Alerts**: Get notified when items fall below minimum quantities
- **Dark Mode**: Toggle between light and dark themes
- **MCP Server**: AI integration for natural language inventory queries

## Tech Stack

- **Frontend**: Next.js 16.1 with React 19 and Tailwind CSS 4
- **Database**: SQLite with better-sqlite3 (FTS5 full-text search)
- **Image Processing**: Sharp (WebP compression)
- **MCP Server**: @modelcontextprotocol/sdk (TypeScript)

## Quick Start

### Prerequisites

- Node.js 22.x or later
- npm 10.x or later

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd homelab-inventory-system

# Install dependencies
npm install

# Initialize the database
npm run db:init

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
homelab-inventory-system/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Dashboard
│   │   ├── items/              # Item CRUD pages
│   │   ├── categories/         # Category management
│   │   ├── vendors/            # Vendor management
│   │   ├── import/             # CSV import
│   │   └── api/                # API routes
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI components
│   │   ├── items/              # Item-related components
│   │   ├── images/             # Image components
│   │   └── search/             # Search components
│   └── lib/
│       ├── db/                 # Database setup
│       ├── repositories/       # Data access layer
│       ├── services/           # Business logic
│       └── types/              # TypeScript types
├── mcp-server/                 # MCP server for AI integration
├── data/                       # SQLite DB + images
└── deploy/                     # Deployment configs
```

## MCP Server

The included MCP server allows AI assistants to query your inventory using natural language.

### Available Tools

| Tool | Description |
|------|-------------|
| `search_inventory` | Search by query, category, location, or tags |
| `check_availability` | Check if specific parts are available |
| `find_parts_for_project` | Find parts matching a project description |
| `get_part_details` | Get full details for an item |
| `low_stock_report` | Get items below minimum stock |
| `list_categories` | List all categories with counts |

### Setup

```bash
# Build MCP server
cd mcp-server
npm install
npm run build
```

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "homelab-inventory": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_PATH": "/path/to/data/inventory.db"
      }
    }
  }
}
```

## Docker Deployment (Recommended)

The easiest way to run the inventory system with Tailscale access.

### Quick Start with Docker Compose

1. **Get a Tailscale auth key** from [Tailscale Admin Console](https://login.tailscale.com/admin/settings/keys)
   - Create a reusable, ephemeral key

2. **Create environment file:**
   ```bash
   cp .env.docker.example .env
   # Edit .env and add your TS_AUTHKEY
   ```

3. **Run with Docker Compose:**
   ```bash
   docker compose up -d
   ```

4. **Access your inventory:**
   - Local: http://localhost:3000
   - Tailscale: https://homelab-inventory.your-tailnet.ts.net

### Docker Run (Alternative)

```bash
docker build -t homelab-inventory .

docker run -d \
  --name homelab-inventory \
  --cap-add NET_ADMIN \
  --cap-add SYS_MODULE \
  --device /dev/net/tun:/dev/net/tun \
  -e TS_AUTHKEY=tskey-auth-xxxxx \
  -e TS_HOSTNAME=homelab-inventory \
  -v inventory-data:/app/data \
  -v tailscale-state:/var/lib/tailscale \
  -p 3000:3000 \
  homelab-inventory
```

### Persistent Storage

The container uses two volumes:
- `inventory-data` - SQLite database and uploaded images
- `tailscale-state` - Tailscale authentication state

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TS_AUTHKEY` | Tailscale auth key (required for Tailscale) | - |
| `TS_HOSTNAME` | Hostname on your Tailnet | `homelab-inventory` |

## Deployment on Raspberry Pi 5 (Without Docker)

### Automated Setup

```bash
sudo ./deploy/setup.sh
```

### Manual Setup

1. Install Node.js 22.x, Nginx, PM2
2. Copy application to `/opt/homelab-inventory`
3. Run `npm install && npm run build`
4. Configure Nginx with `deploy/nginx.conf`
5. Start with PM2: `pm2 start deploy/ecosystem.config.js`

### Tailscale HTTPS (Non-Docker)

1. Enable Tailscale: `tailscale up`
2. Get certificate: `tailscale cert inventory`
3. Update `nginx.conf` with your Tailscale domain
4. Restart Nginx

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/items` | GET | List items with filtering |
| `/api/items` | POST | Create item |
| `/api/items/[id]` | GET/PUT/DELETE | Single item CRUD |
| `/api/items/[id]` | PATCH | Adjust quantity |
| `/api/items/[id]/qr` | GET | Generate QR code |
| `/api/items/search` | GET | Full-text search |
| `/api/items/low-stock` | GET | Low stock report |
| `/api/categories` | GET/POST | Categories |
| `/api/vendors` | GET/POST | Vendors |
| `/api/images` | POST | Upload image |
| `/api/export` | GET | Export CSV |
| `/api/import` | POST | Import CSV |

## Backup

Create automated backups with the included script:

```bash
./deploy/backup.sh
```

Add to cron for daily backups:

```bash
0 2 * * * /opt/homelab-inventory/deploy/backup.sh
```

## License

MIT
