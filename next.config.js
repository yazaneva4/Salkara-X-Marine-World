/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep the Node Ably SDK external to Next's server bundle. The browser
    // realtime hook loads the browser SDK separately at runtime.
    serverComponentsExternalPackages: ["ably"],
  },
};

module.exports = nextConfig;
