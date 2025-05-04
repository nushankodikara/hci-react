/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add these options to ignore errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Add output: 'standalone' if you intend to use the default Dockerfile CMD
  // output: 'standalone',
};

module.exports = nextConfig; 