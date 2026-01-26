/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Skip database checks during build
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // This is the important part - skip API route prerendering
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
  }),
}

module.exports = nextConfig
