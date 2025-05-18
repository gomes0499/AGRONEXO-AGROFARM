import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },

  // Desabilitar module sharing para evitar problemas TDZ
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
    serverComponentsExternalPackages: ['@supabase/ssr'],
  },

  // Ajustar configuração do webpack para evitar problemas TDZ
  webpack: (config, { isServer }) => {
    // Forçar hoisting de variáveis para evitar problemas TDZ
    config.optimization.concatenateModules = false;
    
    // Evitar funções flechas compactadas
    if (!isServer) {
      config.optimization.minimize = true;
      if (config.optimization.minimizer) {
        for (const minimizer of config.optimization.minimizer) {
          if (minimizer.constructor.name === 'TerserPlugin') {
            minimizer.options.terserOptions = {
              ...minimizer.options.terserOptions,
              ecma: 5,
              keep_classnames: true,
              keep_fnames: true,
              safari10: true,
            };
          }
        }
      }
    }
    
    return config;
  },
};

export default nextConfig;
