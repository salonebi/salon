/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... your other configs might be here

  // Add this block to disable ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;