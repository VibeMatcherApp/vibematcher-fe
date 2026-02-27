/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_APP_KEY: process.env.NEXT_APP_KEY,
  },
}

export default nextConfig 