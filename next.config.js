/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    // Frontend should only call relative paths (no http://)
    NEXT_PUBLIC_API_URL: '/api',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://3.235.168.161:8000/api/v1/:path*', // backend over HTTP
      },
    ];
  },
};

module.exports = nextConfig;


// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   swcMinify: true,
//   env: {
//     NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://3.235.168.161:8000',
//     NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://3.235.168.161:8000',
//     NEXT_PUBLIC_RT_GATEWAY_URL: process.env.NEXT_PUBLIC_RT_GATEWAY_URL || 'http://3.235.168.161:8000',
//   },
//   async rewrites() {
//           const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://3.235.168.161:8000';
//     return [
//       {
//         source: '/api/:path*',
//         destination: `${apiUrl}/api/v1/:path*`,
//       },
//     ]
//   },
// }

// module.exports = nextConfig
