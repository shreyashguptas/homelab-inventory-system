import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Output standalone for easier deployment on Raspberry Pi
  output: 'standalone',

  // Native Node.js addons must be external for standalone builds
  // These packages contain compiled C++ code that can't be bundled
  serverExternalPackages: ['better-sqlite3', 'sharp'],

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Image configuration
  images: {
    // Allow local images
    remotePatterns: [],
    // Optimize images
    formats: ['image/webp'],
  },
};

export default nextConfig;
