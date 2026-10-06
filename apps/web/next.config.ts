import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @simpuru/core ships TypeScript source, not a build.
  transpilePackages: ["@simpuru/core"],
};

export default nextConfig;
