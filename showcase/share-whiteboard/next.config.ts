import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["react-rich-painter"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      react: require.resolve('react'),
      'react-dom': require.resolve('react-dom'),
    };
    return config;
  },
};

export default nextConfig;
