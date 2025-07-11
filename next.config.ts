// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... your other configs might be here

  // Add this block to disable ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add this block to disable TypeScript checking during builds
  typescript: {
    ignoreBuildErrors: true,
  },
};


module.exports = nextConfig;