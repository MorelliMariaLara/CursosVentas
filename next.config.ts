import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "512mb",
    },
  },
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
