import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so the parent monorepo lockfiles don't confuse Turbopack.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
