import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Skip ESLint errors during production build to avoid blocking deployments
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Danger: allow production builds to successfully complete even if
    // your project has type errors. Use with caution.
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Handle PDF.js worker and canvas issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        net: false,
        tls: false,
        buffer: require.resolve('buffer'),
        crypto: false,
        stream: false,
        util: false,
        events: false,
      };
    }

    // Handle pdfjs-dist canvas requirement
    config.externals = config.externals || [];
    config.externals.push({
      canvas: 'canvas',
    });

    // Properly resolve safe-buffer to the actual package
    config.resolve.alias = {
      ...config.resolve.alias,
      'safe-buffer': require.resolve('safe-buffer'),
    };

    // Add buffer polyfill to entry points
    if (!isServer) {
      const originalEntry = config.entry;
      config.entry = async () => {
        const entries = await originalEntry();
        if (entries['main.js'] && !entries['main.js'].includes(require.resolve('buffer'))) {
          entries['main.js'].unshift(require.resolve('buffer'));
        }
        return entries;
      };
    }

    // Add plugins to provide Buffer globally
    if (!isServer) {
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.DefinePlugin({
          'global.Buffer': 'Buffer',
        })
      );
    }

    return config;
  },
};

export default nextConfig;
