import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import Layout from './Layout'
import Link from 'next/link'
import { Button, Card } from '@sakura-ui/core'

interface AuthGuardProps {
  children: ReactNode
  redirectTo?: string
  showPrompt?: boolean
  promptTitle?: string
  promptMessage?: string
}

export default function AuthGuard({
  children,
  redirectTo = '/auth/login',
  showPrompt = true,
  promptTitle = 'ログインが必要です',
  promptMessage = 'このページをご利用いただくには\nログインが必要です',
}: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // ローディング中は何もしない
    if (loading) return

    // 未認証の場合
    if (!user) {
      // プロンプト表示なしの場合は即座にリダイレクト
      if (!showPrompt) {
        router.push(redirectTo)
        return
      }

      // プロンプト表示ありの場合は3秒後にリダイレクト
      const timer = setTimeout(() => {
        router.push(redirectTo)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [user, loading, router, redirectTo, showPrompt])

  // ローディング中
  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </Layout>
    )
  }

  // 未認証の場合
  if (!user) {
    // プロンプト表示なしの場合は空を返す（リダイレクト処理中）
    if (!showPrompt) {
      return null
    }

    // プロンプト表示
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Card className="max-w-md w-full text-center p-8 border-2 border-dashed border-blue-200 bg-blue-50">
            <div className="bg-blue-100 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600 text-2xl">
                lock_person
              </span>
            </div>
            <div className="text-xl font-semibold text-gray-900 mb-4">
              {promptTitle}
            </div>
            <p className="text-gray-600 mb-6 whitespace-pre-line">
              {promptMessage}
            </p>

            {/* カウントダウン表示 */}
            <div className="mb-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-orange-600 mr-2 text-sm">
                    schedule
                  </span>
                  <span className="text-orange-700 text-sm font-medium">
                    3秒後にログインページに移動します
                  </span>
                </div>
                <div className="w-full bg-orange-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full animate-pulse"
                    style={{
                      width: '100%',
                      animation: 'shrink 3s linear forwards',
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Link href={redirectTo}>
                <Button
                  className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105"
                  size="lg"
                >
                  <span className="material-symbols-outlined mr-2 text-base">
                    login
                  </span>
                  今すぐログイン
                </Button>
              </Link>

              <Link href="/">
                <Button
                  variant="secondary"
                  className="w-full inline-flex items-center justify-center rounded-xl border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 font-medium shadow-sm transition-all duration-200 hover:shadow-md"
                  size="lg"
                >
                  <span className="material-symbols-outlined mr-2 text-base">
                    home
                  </span>
                  ホームに戻る
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* アニメーション用のCSS */}
        <style jsx>{`
          @keyframes shrink {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}</style>
      </Layout>
    )
  }

  // 認証済みの場合のみ子コンポーネントを表示
  // userが確実に存在する場合のみレンダリング
  if (!user) {
    return null
  }

  return <>{children}</>
}
