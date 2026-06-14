/** @type {import('next').NextConfig} */
const nextConfig = {
  // nanoid v5 is ESM-only; Next.js 15 handles it, but transpile for safety
  transpilePackages: [],
}

export default nextConfig
