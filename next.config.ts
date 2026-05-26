import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  turbopack: {
    resolveAlias: {
      'next/dist/server/route-modules/app-route/vendored/contexts/app-router-context':
        'next/dist/server/route-modules/app-page/vendored/contexts/app-router-context',
    },
  },
};

export default nextConfig;
