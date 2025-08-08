/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  experimental: {
    // Docker開発環境でのホットリロード対応
    serverComponentsExternalPackages: []
  },
  // 本番用の設定
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // Docker環境でのホットリロード設定
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
  // BFFのAPI Routesを使用するため、rewritesを削除
}

module.exports = nextConfig