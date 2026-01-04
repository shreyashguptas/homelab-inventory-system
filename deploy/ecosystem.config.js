module.exports = {
  apps: [
    {
      name: 'homelab-inventory',
      script: 'npm',
      args: 'start',
      cwd: '/opt/homelab-inventory',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '/var/log/homelab-inventory/error.log',
      out_file: '/var/log/homelab-inventory/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'homelab-inventory-mcp',
      script: 'node',
      args: 'dist/index.js',
      cwd: '/opt/homelab-inventory/mcp-server',
      env: {
        NODE_ENV: 'production',
        DATABASE_PATH: '/opt/homelab-inventory/data/inventory.db',
      },
      instances: 1,
      autorestart: false, // MCP server should be started by client
      watch: false,
      error_file: '/var/log/homelab-inventory/mcp-error.log',
      out_file: '/var/log/homelab-inventory/mcp-out.log',
    },
  ],
};
