/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export', // ✅ enables static export for S3
  images: {
    unoptimized: true, // ✅ required for static export
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_RT_GATEWAY_URL: process.env.NEXT_PUBLIC_RT_GATEWAY_URL,
    NEXT_PUBLIC_API_ORIGIN: process.env.NEXT_PUBLIC_API_ORIGIN,
  },
};

module.exports = nextConfig;
