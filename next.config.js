/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  eslint: {
    dirs: ['pages', 'components', 'context', 'hooks', 'services', 'utils'],
  },
};

module.exports = nextConfig;