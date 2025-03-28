/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'framerusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
      {
        protocol: 'https',
        hostname: '**.infura-ipfs.io',
      }
    ],
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false,
      net: false,
      tls: false
    };
    return config;
  },
  env: {
    NEXT_PUBLIC_IPFS_PROJECT_ID: process.env.NEXT_PUBLIC_IPFS_PROJECT_ID,
    NEXT_PUBLIC_IPFS_PROJECT_SECRET: process.env.NEXT_PUBLIC_IPFS_PROJECT_SECRET,
  }
};

module.exports = nextConfig; 