/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/LG-Dashboard',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
