/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during build
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  images: {
    domains: ['pbs.twimg.com', 'abs.twimg.com', 'www.google.com', 'lh3.googleusercontent.com'],
  },
  // Add a redirect for favicon.ico
  async redirects() {
    return [
      {
        source: '/favicon.ico',
        destination: '/favicon.svg',
        permanent: true,
      },
    ];
  },
};

export default nextConfig; 