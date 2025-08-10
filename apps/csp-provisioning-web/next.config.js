/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    // Docker環境ではサービス名、ローカル開発では localhost を使用
    const apiUrl =
      process.env.NODE_ENV === 'development' && process.env.DOCKER_ENV
        ? 'http://web:3000'
        : 'http://localhost:3000'

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`, // メインWebアプリのAPIにプロキシ
      },
    ]
  },
}

module.exports = nextConfig
