export interface User {
  id: number
  name: string
  email: string
  role: string
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

class AuthService {
  private baseURL = '/api/auth'

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include', // cookieを含める
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'ログインに失敗しました')
    }

    return response.json()
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      credentials: 'include', // cookieを含める
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '登録に失敗しました')
    }

    return response.json()
  }

  async getProfile(): Promise<User> {
    const response = await fetch(`${this.baseURL}/profile`, {
      credentials: 'include', // cookieを含める
    })

    if (!response.ok) {
      throw new Error('プロフィール取得に失敗しました')
    }

    return response.json()
  }

  async logout(): Promise<void> {
    const response = await fetch(`${this.baseURL}/logout`, {
      method: 'POST',
      credentials: 'include', // cookieを含める
    })

    if (!response.ok) {
      throw new Error('ログアウトに失敗しました')
    }
  }
}

export const authService = new AuthService()