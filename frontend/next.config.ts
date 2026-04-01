import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // output: 'standalone', // Enable for Docker deployment
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    return [
      { source: '/swagger-ui', destination: `${apiUrl}/swagger-ui` },
      { source: '/swagger-ui/:path*', destination: `${apiUrl}/swagger-ui/:path*` },
      { source: '/api-docs/:path*', destination: `${apiUrl}/api-docs/:path*` },
    ];
  },
  env: {
    NEXT_PUBLIC_FACTORY_ADDRESS: process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
    NEXT_PUBLIC_ROUTER_ADDRESS: process.env.NEXT_PUBLIC_ROUTER_ADDRESS,
    NEXT_PUBLIC_WETH_ADDRESS: process.env.NEXT_PUBLIC_WETH_ADDRESS,
    NEXT_PUBLIC_TAIKO_RPC: process.env.NEXT_PUBLIC_TAIKO_RPC,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
};

export default nextConfig;
