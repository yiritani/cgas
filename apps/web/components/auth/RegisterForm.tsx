import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { H1, H2, Button, Card } from '@sakura-ui/core'

export default function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上である必要があります')
      return
    }

    setLoading(true)

    try {
      await register(name, email, password)
      router.push('/')
    } catch (error) {
      setError(error instanceof Error ? error.message : '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <Card className="w-full max-w-md shadow-xl border-0">
        <div className="p-8">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <div className="bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-600 text-2xl">
                person_add
              </span>
            </div>
            <H1 className="text-2xl font-bold text-gray-900 mb-2">新規登録</H1>
            <p className="text-gray-600">新しいアカウントを作成してください</p>
          </div>

          {/* エラー表示 */}
          {error && (
            <Card className="mb-6 bg-red-50 border-l-4 border-l-red-500 border-red-200">
              <div className="flex items-start p-4">
                <div className="bg-red-100 rounded-full p-2 mr-3 flex-shrink-0">
                  <span className="material-symbols-outlined text-red-600 text-sm">
                    error
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {/* 登録フォーム */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                <span className="material-symbols-outlined mr-2 text-purple-600 text-sm align-middle">
                  person
                </span>
                お名前
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                placeholder="山田 太郎"
                className={`w-full px-4 py-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                  loading
                    ? 'bg-gray-100 cursor-not-allowed border-gray-200'
                    : 'border-gray-300 focus:border-purple-500'
                }`}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                <span className="material-symbols-outlined mr-2 text-blue-600 text-sm align-middle">
                  mail
                </span>
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="example@email.com"
                className={`w-full px-4 py-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                  loading
                    ? 'bg-gray-100 cursor-not-allowed border-gray-200'
                    : 'border-gray-300 focus:border-purple-500'
                }`}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                <span className="material-symbols-outlined mr-2 text-green-600 text-sm align-middle">
                  lock
                </span>
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                placeholder="6文字以上のパスワード"
                className={`w-full px-4 py-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                  loading
                    ? 'bg-gray-100 cursor-not-allowed border-gray-200'
                    : 'border-gray-300 focus:border-purple-500'
                }`}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-gray-900 mb-2"
              >
                <span className="material-symbols-outlined mr-2 text-orange-600 text-sm align-middle">
                  lock_check
                </span>
                パスワード（確認）
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                placeholder="パスワードを再入力"
                className={`w-full px-4 py-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                  loading
                    ? 'bg-gray-100 cursor-not-allowed border-gray-200'
                    : 'border-gray-300 focus:border-purple-500'
                }`}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              size="large"
              className="w-full bg-gradient-to-r from-purple-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  登録中...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined mr-2">
                    person_add
                  </span>
                  アカウントを作成
                </>
              )}
            </Button>
          </form>

          {/* ログインへの案内 */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              既にアカウントをお持ちの方は{' '}
              <Link
                href="/auth/login"
                className="text-purple-600 hover:text-purple-800 font-semibold transition-colors"
              >
                ログイン
              </Link>
            </p>
          </div>

          {/* 利用規約・プライバシーポリシーなど */}
          <Card className="mt-6 bg-gradient-to-r from-gray-50 to-purple-50 border-gray-200">
            <div className="p-4">
              <H2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <span className="material-symbols-outlined mr-2 text-indigo-600 text-sm">
                  info
                </span>
                登録について
              </H2>
              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex items-start">
                  <span className="material-symbols-outlined mr-2 text-green-600 text-sm mt-0.5 flex-shrink-0">
                    check_circle
                  </span>
                  <span>アカウント作成は無料です</span>
                </div>
                <div className="flex items-start">
                  <span className="material-symbols-outlined mr-2 text-blue-600 text-sm mt-0.5 flex-shrink-0">
                    security
                  </span>
                  <span>パスワードは安全に暗号化されます</span>
                </div>
                <div className="flex items-start">
                  <span className="material-symbols-outlined mr-2 text-purple-600 text-sm mt-0.5 flex-shrink-0">
                    rocket_launch
                  </span>
                  <span>登録後すぐにプロジェクト管理を開始できます</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  )
}
