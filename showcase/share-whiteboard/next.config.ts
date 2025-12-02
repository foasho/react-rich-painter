import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["react-rich-painter"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
