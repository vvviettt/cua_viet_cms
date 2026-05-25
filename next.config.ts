import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  transpilePackages: ["ckeditor5", "@ckeditor/ckeditor5-react"],
  experimental: {
    serverActions: {
      bodySizeLimit: "1000mb",
    },
    proxyClientMaxBodySize: "100mb",
  },
};

export default nextConfig;
