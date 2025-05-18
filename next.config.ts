import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },

  // Desabilita a minificação para debug
  // webpack(config, { dev, isServer }) {
  //   config.optimization.minimize = false;
  //   return config;
  // },
};

export default nextConfig;