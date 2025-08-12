import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { H1, H2, Button, Card } from '@sakura-ui/core'
import DemoAccountItem from './DemoAccountItem'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const demoAccounts = [
    {
      role: '参政オーナー',
      email: 'sansei_owner@example.com',
      password: 'user123',
    },
    {
      role: '参政管理者',
      email: 'sansei_admin@example.com',
      password: 'user123',
    },
    {
      role: '参政閲覧者',
      email: 'sansei_viewer@example.com',
      password: 'user123',
    },
    {
      role: '再生オーナー',
      email: 'shinsei_owner@example.com',
      password: 'user123',
    },
    {
      role: '再生管理者',
      email: 'shinsei_admin@example.com',
      password: 'user123',
    },
    {
      role: '再生閲覧者',
      email: 'shinsei_viewer@example.com',
      password: 'user123',
    },
    {
      role: 'ローカルオーナー',
      email: 'local_owner@example.com',
      password: 'user123',
    },
    {
      role: 'ローカル管理者',
      email: 'local_admin@example.com',
      password: 'user123',
    },
    {
      role: 'ローカル閲覧者',
      email: 'local_viewer@example.com',
      password: 'user123',
    },
    {
      role: '公共オーナー',
      email: 'public_owner@example.com',
      password: 'user123',
    },
    {
      role: '公共管理者',
      email: 'public_admin@example.com',
      password: 'user123',
    },
    {
      role: '公共閲覧者',
      email: 'public_viewer@example.com',
      password: 'user123',
    },
    {
      role: '独立オーナー',
      email: 'independent_owner@example.com',
      password: 'user123',
    },
    {
      role: '独立管理者',
      email: 'independent_admin@example.com',
      password: 'user123',
    },
    {
      role: '独立閲覧者',
      email: 'independent_viewer@example.com',
      password: 'user123',
    },
    {
      role: 'ベンダーオーナー',
      email: 'vendor_owner@example.com',
      password: 'user123',
    },
    {
      role: 'ベンダー管理者',
      email: 'vendor_admin@example.com',
      password: 'user123',
    },
    {
      role: 'ベンダー閲覧者',
      email: 'vendor_viewer@example.com',
      password: 'user123',
    },
  ]

  const handleSelectCredentials = (
    selectedEmail: string,
    selectedPassword: string
  ) => {
    setEmail(selectedEmail)
    setPassword(selectedPassword)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      router.push('/')
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'ログインに失敗しました'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Card className="w-full max-w-md shadow-xl border-0">
        <div className="p-8">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <div className="bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600 text-2xl">
                login
              </span>
            </div>
            <H1 className="text-2xl font-bold text-gray-900 mb-2">ログイン</H1>
            <p className="text-gray-600">アカウントにログインしてください</p>
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

          {/* ログインフォーム */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
                className={`w-full px-4 py-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  loading
                    ? 'bg-gray-100 cursor-not-allowed border-gray-200'
                    : 'border-gray-300 focus:border-blue-500'
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
                placeholder="パスワードを入力"
                className={`w-full px-4 py-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  loading
                    ? 'bg-gray-100 cursor-not-allowed border-gray-200'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full rounded-xl py-4 bg-gradient-to-r from-blue-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  <span className="leading-none">ログイン中...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined mr-2 text-base leading-none">
                    login
                  </span>
                  <span className="leading-none">ログイン</span>
                </>
              )}
            </Button>
          </form>

          {/* 新規登録への案内 */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              アカウントをお持ちでない方は{' '}
              <Link
                href="/auth/register"
                className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
              >
                新規登録
              </Link>
            </p>
          </div>

          {/* デモアカウント情報 */}
          <Card className="mt-6 bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
            <div className="p-4">
              <H2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <span className="material-symbols-outlined mr-2 text-purple-600 text-sm">
                  demo_mode
                </span>
                デモアカウント
              </H2>
              <div className="space-y-2 text-xs text-gray-700">
                {demoAccounts.map((account, index) => (
                  <DemoAccountItem
                    key={index}
                    role={account.role}
                    email={account.email}
                    password={account.password}
                    onSelect={handleSelectCredentials}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                ↑ クリックしてフォームに入力します
              </p>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  )
}
