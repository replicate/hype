/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = {
  reactStrictMode: true,

  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
}
