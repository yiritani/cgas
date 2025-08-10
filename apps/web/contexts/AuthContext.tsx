import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, authService } from '../lib/auth'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        // cookie認証なので、直接プロフィールを取得
        const userProfile = await authService.getProfile()
        setUser(userProfile)
      } catch (error) {
        console.error('Failed to get user profile:', error)
        // 認証エラーの場合はユーザーをnullのまま
      }
      
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password })
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await authService.register({ name, email, password })
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('本当にログアウトしますか？');
      if (!confirmed) {
        return;
      }
    }

    try {
      await authService.logout()
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      // エラーが発生してもユーザー状態はクリアする
      setUser(null)
    }
  }

  const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const defaultOptions: RequestInit = {
      credentials: 'include', // cookieを含める
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    return fetch(url, defaultOptions)
  }

  const value = {
    user,
    login,
    register,
    logout,
    authFetch,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}