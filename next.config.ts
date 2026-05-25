import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['next-auth', '@auth/core', '@auth/core/providers/google'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
