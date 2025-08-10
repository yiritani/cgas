import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import { Card } from '@sakura-ui/core'

interface AuthGuardProps {
  children: ReactNode
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      // 未認証の場合、メインアプリのログインページにリダイレクト
      const returnUrl = encodeURIComponent(window.location.href)
      window.location.href = `http://localhost:3000/auth/login?returnUrl=${returnUrl}`
    }
  }, [user, loading, router])

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            <h2 className="text-lg font-semibold text-gray-900">認証中...</h2>
            <p className="text-gray-600 text-sm">
              ユーザー情報を確認しています
            </p>
          </div>
        </Card>
      </div>
    )
  }

  // 未認証の場合
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md w-full text-center bg-red-50 border-l-4 border-l-red-500 border-red-200">
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-red-100 rounded-full p-3">
              <span className="material-symbols-outlined text-red-600 text-2xl">
                lock
              </span>
            </div>
            <h2 className="text-lg font-semibold text-red-900">
              認証が必要です
            </h2>
            <p className="text-red-800 text-sm">
              CSPプロビジョニングにアクセスするには、メインアプリでログインしてください。
            </p>
            <a
              href="http://localhost:3000/auth/login"
              className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined mr-2 text-sm">
                login
              </span>
              ログインページへ
            </a>
          </div>
        </Card>
      </div>
    )
  }

  // 認証済みの場合、子コンポーネントを表示
  return <>{children}</>
}

export default AuthGuard
