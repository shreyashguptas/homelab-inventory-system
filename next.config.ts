import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Output standalone for easier deployment on Raspberry Pi
  output: 'standalone',

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
