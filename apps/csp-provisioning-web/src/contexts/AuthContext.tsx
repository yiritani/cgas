import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { useRouter } from 'next/router'

interface User {
  id: number
  name: string
  email: string
  role?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
  returnUrl: string | null
  goBack: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [returnUrl, setReturnUrl] = useState<string | null>(null)
  const router = useRouter()

  // トークンを取得（メインアプリと同じキーを使用）
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  // トークンを保存
  const setToken = (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  // トークンを削除
  const removeToken = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  // 認証付きfetch
  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = getToken()

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      return fetch(url, {
        ...options,
        headers,
      })
    },
    []
  )

  // ユーザー情報を取得
  const fetchUser = useCallback(async () => {
    const token = getToken()
    console.log('fetchUser: トークンチェック:', token ? 'あり' : 'なし')
    if (!token) {
      console.log('fetchUser: トークンがないため認証をスキップ')
      setLoading(false)
      return
    }

    try {
      console.log('fetchUser: ユーザー情報を取得中...')
      const response = await authFetch('/api/auth/profile')
      console.log('fetchUser: レスポンスステータス:', response.status)
      if (response.ok) {
        const userData = await response.json()
        console.log('fetchUser: ユーザー情報取得成功:', userData.email)
        setUser(userData)
      } else {
        console.log('fetchUser: 認証失敗、トークンを削除')
        // トークンが無効な場合は削除
        removeToken()
        setUser(null)
      }
    } catch (error) {
      console.error('認証エラー:', error)
      removeToken()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  // メインアプリに戻る
  const goBack = () => {
    if (returnUrl) {
      // タブを閉じてreturnUrlに戻る
      window.close()
      // window.closeが効かない場合のフォールバック
      setTimeout(() => {
        window.location.href = returnUrl
      }, 100)
    } else {
      // returnUrlがない場合はメインアプリのトップページに戻る
      window.location.href = 'http://localhost:3000'
    }
  }

  // 初期化時にユーザー情報を取得
  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // URLパラメータからトークンとreturnUrlを取得（メインアプリからの遷移時）
  useEffect(() => {
    const { token, returnUrl: returnUrlParam } = router.query

    // returnUrlを保存
    if (returnUrlParam && typeof returnUrlParam === 'string') {
      console.log('URLからreturnUrlを受信:', returnUrlParam)
      setReturnUrl(returnUrlParam)
    }

    if (token && typeof token === 'string') {
      console.log('URLからトークンを受信:', token.substring(0, 20) + '...')
      setToken(token)
      // URLからトークンとreturnUrlを削除してからユーザー情報を取得
      router
        .replace(router.asPath.split('?')[0], undefined, { shallow: true })
        .then(() => {
          fetchUser()
        })
    }
  }, [router.query, fetchUser, router])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authFetch,
        returnUrl,
        goBack,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
