import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Handle PDF.js worker and canvas issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Handle pdfjs-dist canvas requirement
    config.externals = config.externals || [];
    config.externals.push({
      canvas: 'canvas',
    });

    return config;
  },
};

export default nextConfig;
