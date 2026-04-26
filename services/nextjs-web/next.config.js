/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produces .next/standalone for slim production Docker images (see Dockerfile)
  output: 'standalone',
}

module.exports = nextConfig
