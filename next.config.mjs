/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during build
    ignoreDuringBuilds: true,
    dirs: ['src', 'app', 'pages', 'components', 'lib', 'utils'], // Only run ESLint on these directories
  },
  typescript: {
    // Only type check these directories
    tsconfigPath: './tsconfig.json',
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
  // Exclude chrome extension from webpack compilation
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/chrome-extension-ts/**'],
    };
    return config;
  },
};

export default nextConfig;