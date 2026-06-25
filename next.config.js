/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const repo = 'PMOS-AIAgent';

const nextConfig = {
  output: 'export',
  distDir: 'out',
  basePath: isProd ? `/${repo}` : '',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
