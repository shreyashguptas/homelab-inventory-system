# Homelab Inventory MCP Server

An MCP (Model Context Protocol) server that provides AI assistants with access to your homelab inventory data.

## Features

### Tools

1. **search_inventory** - Search the inventory by query, category, location, or tags
2. **check_availability** - Check if specific parts are available and get quantities
3. **find_parts_for_project** - Given a project description, find relevant parts
4. **get_part_details** - Get full details for a specific item
5. **low_stock_report** - Get items at or below minimum stock
6. **list_categories** - List all categories with item counts

### Resources

- `inventory://stats` - Current inventory statistics
- `inventory://low-stock` - Low stock items
- `inventory://categories` - Categories with counts

## Installation

```bash
cd mcp-server
npm install
npm run build
```

## Configuration

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "homelab-inventory": {
      "command": "node",
      "args": ["/path/to/homelab-inventory-system/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_PATH": "/path/to/homelab-inventory-system/data/inventory.db"
      }
    }
  }
}
```

### Claude Code

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "homelab-inventory": {
      "command": "node",
      "args": ["/path/to/homelab-inventory-system/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_PATH": "/path/to/homelab-inventory-system/data/inventory.db"
      }
    }
  }
}
```

### Other MCP Clients

This server uses standard MCP stdio transport and is compatible with any MCP client. Configure your client to run:

```bash
node /path/to/homelab-inventory-system/mcp-server/dist/index.js
```

Set the `DATABASE_PATH` environment variable to point to your inventory database.

## Usage Examples

### Search inventory
```
"Search for Arduino boards"
"Find all sensors in drawer 3"
"What resistors do I have?"
```

### Check availability
```
"Do I have ESP32 modules and DHT22 sensors?"
"Check if I have 10k resistors, capacitors, and LEDs"
```

### Find parts for a project
```
"I want to build a weather station with temperature and humidity monitoring"
"Find parts for an LED matrix display project"
```

### Get details
```
"Show me details for my Raspberry Pi 4"
"What are the specs of my oscilloscope?"
```

## Development

```bash
npm run dev  # Run with tsx for development
npm run build  # Build for production
npm start  # Run production build
```
