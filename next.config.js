/** @type {import('next').NextConfig} */
const nextConfig = {
  serverActions: {
    // Editor.js contentJson can exceed 1MB.
    bodySizeLimit: "10mb",
  },
};

module.exports = nextConfig;

