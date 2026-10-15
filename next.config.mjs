/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["ably"],
  eslint: {
    // Linting is run separately; don't block production builds on lint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
