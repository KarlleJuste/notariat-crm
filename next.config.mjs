/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  // Réduit les recompilations en boucle (fichiers touchés par l’OS / l’IDE) et évite
  // que le serveur de dev paraisse « mort » ou instable en local.
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        aggregateTimeout: 500,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
