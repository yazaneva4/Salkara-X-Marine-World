/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Ably's Node bundle has dynamic requires that Next's App Router bundler
    // should leave to native Node.js resolution.
    serverComponentsExternalPackages: ["ably"],
  },
};

module.exports = nextConfig;
