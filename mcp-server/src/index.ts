#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { searchInventory, checkAvailability, findPartsForProject } from './tools/search.js';
import { getPartDetails, getPartByName, getLowStockReport, listCategories, getInventoryStats } from './tools/inventory.js';

const server = new Server(
  {
    name: 'homelab-inventory',
    version: '1.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'search_inventory',
      description: 'Search the inventory for parts by query, category, location, or tags. Returns matching items with quantities and locations.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Full-text search query (searches name, description, tags, and specifications)',
          },
          category: {
            type: 'string',
            description: 'Filter by category name (e.g., "Microcontrollers", "Sensors")',
          },
          location: {
            type: 'string',
            description: 'Filter by location (partial match)',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by tags (any match)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results (default: 50)',
          },
        },
      },
    },
    {
      name: 'check_availability',
      description: 'Check if specific parts are available in the inventory. Returns availability status, quantities, and locations for each requested part.',
      inputSchema: {
        type: 'object',
        properties: {
          parts: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of part names to check availability for',
          },
        },
        required: ['parts'],
      },
    },
    {
      name: 'find_parts_for_project',
      description: 'Given a project description, find relevant parts from the inventory that might be useful. Extracts keywords from the description and searches for matching components.',
      inputSchema: {
        type: 'object',
        properties: {
          project_description: {
            type: 'string',
            description: 'Description of the project you want to build (e.g., "I want to build a weather station with temperature and humidity sensors")',
          },
        },
        required: ['project_description'],
      },
    },
    {
      name: 'get_part_details',
      description: 'Get detailed information about a specific part, including specifications, purchase info, and notes.',
      inputSchema: {
        type: 'object',
        properties: {
          item_id: {
            type: 'string',
            description: 'The UUID of the item to get details for',
          },
          name: {
            type: 'string',
            description: 'The name of the item to search for (use if item_id is not known)',
          },
        },
      },
    },
    {
      name: 'low_stock_report',
      description: 'Get a report of all items that are at or below their minimum stock level. Useful for reordering.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'list_categories',
      description: 'List all inventory categories with their item counts.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ],
}));

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'search_inventory': {
        const results = searchInventory({
          query: args?.query as string | undefined,
          category: args?.category as string | undefined,
          location: args?.location as string | undefined,
          tags: args?.tags as string[] | undefined,
          limit: args?.limit as number | undefined,
        });

        const formatted = results.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          location: item.location,
          category: item.category_name,
          condition: item.condition,
          tags: item.tags ? JSON.parse(item.tags) : [],
        }));

        return {
          content: [
            {
              type: 'text',
              text: `Found ${results.length} items:\n\n${JSON.stringify(formatted, null, 2)}`,
            },
          ],
        };
      }

      case 'check_availability': {
        const parts = args?.parts as string[];
        if (!parts || !Array.isArray(parts)) {
          throw new Error('parts array is required');
        }

        const results = checkAvailability(parts);

        const available = results.filter((r) => r.found);
        const missing = results.filter((r) => !r.found);

        let text = `Availability check for ${parts.length} parts:\n\n`;

        if (available.length > 0) {
          text += `AVAILABLE (${available.length}):\n`;
          for (const item of available) {
            text += `  - ${item.name}: ${item.quantity} available`;
            if (item.location) text += ` at ${item.location}`;
            text += '\n';
          }
        }

        if (missing.length > 0) {
          text += `\nNOT FOUND (${missing.length}):\n`;
          for (const item of missing) {
            text += `  - ${item.name}\n`;
          }
        }

        return { content: [{ type: 'text', text }] };
      }

      case 'find_parts_for_project': {
        const description = args?.project_description as string;
        if (!description) {
          throw new Error('project_description is required');
        }

        const { suggestions, keywords } = findPartsForProject(description);

        let text = `Searching for parts matching: "${description}"\n`;
        text += `Keywords extracted: ${keywords.join(', ')}\n\n`;

        if (suggestions.length === 0) {
          text += 'No matching parts found in inventory.';
        } else {
          text += `Found ${suggestions.length} potentially useful parts:\n\n`;
          for (const item of suggestions) {
            text += `- ${item.name}`;
            if (item.quantity > 0) text += ` (${item.quantity} ${item.unit})`;
            if (item.location) text += ` - ${item.location}`;
            if (item.category_name) text += ` [${item.category_name}]`;
            text += '\n';
            if (item.description) text += `  ${item.description}\n`;
          }
        }

        return { content: [{ type: 'text', text }] };
      }

      case 'get_part_details': {
        let item = null;

        if (args?.item_id) {
          item = getPartDetails(args.item_id as string);
        } else if (args?.name) {
          item = getPartByName(args.name as string);
        } else {
          throw new Error('Either item_id or name is required');
        }

        if (!item) {
          return { content: [{ type: 'text', text: 'Item not found.' }] };
        }

        const specs = item.specifications ? JSON.parse(item.specifications) : {};
        const tags = item.tags ? JSON.parse(item.tags) : [];

        let text = `# ${item.name}\n\n`;
        text += `**ID:** ${item.id}\n`;
        if (item.description) text += `**Description:** ${item.description}\n`;
        text += `**Tracking Mode:** ${item.tracking_mode}\n`;

        if (item.tracking_mode === 'quantity') {
          text += `**Quantity:** ${item.quantity} ${item.unit}\n`;
          if (item.min_quantity > 0) text += `**Min Stock:** ${item.min_quantity}\n`;
        } else {
          if (item.serial_number) text += `**Serial Number:** ${item.serial_number}\n`;
          if (item.asset_tag) text += `**Asset Tag:** ${item.asset_tag}\n`;
          if (item.condition) text += `**Condition:** ${item.condition}\n`;
        }

        if (item.location) text += `**Location:** ${item.location}\n`;
        if (item.category_name) text += `**Category:** ${item.category_name}\n`;
        if (item.vendor_name) text += `**Vendor:** ${item.vendor_name}\n`;

        if (item.purchase_price) {
          text += `**Price:** ${item.purchase_price} ${item.purchase_currency}\n`;
        }
        if (item.purchase_date) text += `**Purchase Date:** ${item.purchase_date}\n`;
        if (item.warranty_expiry) text += `**Warranty Expires:** ${item.warranty_expiry}\n`;

        if (Object.keys(specs).length > 0) {
          text += `\n**Specifications:**\n`;
          for (const [key, value] of Object.entries(specs)) {
            text += `  - ${key}: ${value}\n`;
          }
        }

        if (tags.length > 0) {
          text += `\n**Tags:** ${tags.join(', ')}\n`;
        }

        if (item.notes) text += `\n**Notes:** ${item.notes}\n`;

        if (item.purchase_url) text += `\n**Purchase URL:** ${item.purchase_url}\n`;
        if (item.datasheet_url) text += `**Datasheet:** ${item.datasheet_url}\n`;

        return { content: [{ type: 'text', text }] };
      }

      case 'low_stock_report': {
        const items = getLowStockReport();

        if (items.length === 0) {
          return { content: [{ type: 'text', text: 'No items are currently low on stock.' }] };
        }

        let text = `# Low Stock Report\n\n`;
        text += `${items.length} items are at or below minimum stock:\n\n`;

        for (const item of items) {
          const percentage = Math.round((item.quantity / item.min_quantity) * 100);
          text += `- **${item.name}**: ${item.quantity}/${item.min_quantity} ${item.unit} (${percentage}%)`;
          if (item.location) text += ` - ${item.location}`;
          if (item.category_name) text += ` [${item.category_name}]`;
          text += '\n';
        }

        return { content: [{ type: 'text', text }] };
      }

      case 'list_categories': {
        const categories = listCategories();

        let text = `# Inventory Categories\n\n`;

        if (categories.length === 0) {
          text += 'No categories defined.';
        } else {
          for (const cat of categories) {
            text += `- **${cat.name}**: ${cat.item_count} items`;
            if (cat.description) text += ` - ${cat.description}`;
            text += '\n';
          }
        }

        return { content: [{ type: 'text', text }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
});

// Resource definitions
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'inventory://stats',
      name: 'Inventory Statistics',
      description: 'Current inventory statistics including total items, quantities, and values',
      mimeType: 'application/json',
    },
    {
      uri: 'inventory://low-stock',
      name: 'Low Stock Items',
      description: 'Items that are at or below their minimum stock level',
      mimeType: 'application/json',
    },
    {
      uri: 'inventory://categories',
      name: 'Categories',
      description: 'All inventory categories with item counts',
      mimeType: 'application/json',
    },
  ],
}));

// Resource reading
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case 'inventory://stats': {
      const stats = getInventoryStats();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(stats, null, 2),
          },
        ],
      };
    }

    case 'inventory://low-stock': {
      const items = getLowStockReport();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(items, null, 2),
          },
        ],
      };
    }

    case 'inventory://categories': {
      const categories = listCategories();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(categories, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Homelab Inventory MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
