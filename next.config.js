/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  eslint: {
    dirs: ['pages', 'components', 'context', 'hooks', 'services', 'utils'],
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during build (both for local and Vercel)
    ignoreBuildErrors: true,
  },
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
};

// Special Vercel-specific configuration
if (process.env.BUILDING_FOR_VERCEL === 'true') {
  console.log('Building for Vercel - applying special configuration');
  nextConfig.webpack = (config, { isServer }) => {
    // Exclude functions directory from build
    config.externals = [...(config.externals || []), 'firebase-functions', 'firebase-admin'];
    
    // Ignore functions directory
    if (config.module && config.module.rules) {
      config.module.rules.push({
        test: /functions\//,
        use: 'null-loader',
      });
    }
    
    return config;
  };
}

module.exports = nextConfig;