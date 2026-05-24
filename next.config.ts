import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["ckeditor5", "@ckeditor/ckeditor5-react"],
  experimental: {
    serverActions: {
      bodySizeLimit: "1000mb",
    },
    proxyClientMaxBodySize: "100mb",
  },
};

export default nextConfig;
