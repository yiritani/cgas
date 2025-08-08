import { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, Card } from '@sakura-ui/core'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    )
  }

  const navigation = [
    { name: 'ホーム', href: '/' },
    { name: 'プロジェクト一覧', href: '/projects' },
    { name: '🌸 Sakura UI', href: '/sakura-test' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-8">
              <Link
                href="/"
                className="text-xl font-semibold text-white hover:text-blue-100 transition-colors"
              >
                <span className="material-symbols-outlined inline-block mr-2 text-2xl align-middle">
                  rocket_launch
                </span>
                Go + Next.js モノレポ
              </Link>

              {user && (
                <nav className="hidden md:flex gap-4">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                        router.pathname === item.href
                          ? 'bg-white bg-opacity-20 text-white'
                          : 'text-blue-100 hover:text-white hover:bg-white hover:bg-opacity-10'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                <span className="hidden sm:block text-blue-100">
                  ようこそ、
                  <span className="font-medium text-white">{user.name}</span>
                  さん
                </span>
                <Button
                  onClick={logout}
                  variant="secondary"
                  size="small"
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-30 rounded-xl inline-flex items-center justify-center"
                >
                  <span className="material-symbols-outlined mr-1 text-sm">
                    logout
                  </span>
                  ログアウト
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link href="/auth/login">
                  <Button
                    variant="secondary"
                    size="small"
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-30 rounded-xl inline-flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined mr-1 text-sm">
                      login
                    </span>
                    ログイン
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button
                    size="small"
                    className="bg-white text-blue-600 hover:bg-blue-50 rounded-xl inline-flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined mr-1 text-sm">
                      person_add
                    </span>
                    新規登録
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* モバイルナビゲーション */}
          {user && (
            <div className="md:hidden pb-4">
              <nav className="flex flex-wrap gap-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                      router.pathname === item.href
                        ? 'bg-white bg-opacity-20 text-white'
                        : 'text-blue-100 hover:text-white hover:bg-white hover:bg-opacity-10'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 pt-24 md:pt-20">{children}</main>

      {/* フッター */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p>TurboRepo、Docker Compose Watch、ホットリロード対応</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
