import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.pocketbase.io",
      },
    ],
  },
};

export default nextConfig;
