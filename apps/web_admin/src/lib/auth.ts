import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.API_URL || 'http://localhost:8080'
const CSP_PROVISIONING_URL =
  process.env.CSP_PROVISIONING_URL || 'http://localhost:8081'
const COOKIE_NAME = 'admin_auth_token'

export interface User {
  id: number
  name: string
  email: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  token?: string
  error?: string
}

// Go APIにログインリクエストを送信
export async function loginToAPI(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      return {
        success: false,
        error: 'ログインに失敗しました',
      }
    }

    const data = await response.json()

    return {
      success: true,
      user: data.user,
      token: data.token,
    }
  } catch (error) {
    console.error('Login API error:', error)
    return {
      success: false,
      error: 'サーバーエラーが発生しました',
    }
  }
}

// Go APIからプロフィール情報を取得
export async function getProfileFromAPI(token: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_URL}/api/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    // Go APIは user オブジェクトを直接返すので、data.userではなくdataを返す
    return data
  } catch (error) {
    console.error('Profile API error:', error)
    return null
  }
}

// Cookieからトークンを取得
export async function getTokenFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)
    return token?.value || null
  } catch (error) {
    console.error('Error getting token from cookies:', error)
    return null
  }
}

// レスポンスにCookieを設定
export function setAuthCookie(response: NextResponse, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production'

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24時間
    path: '/',
  })
}

// 認証Cookieを削除
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.delete(COOKIE_NAME)
}

// 現在のユーザー情報を取得（サーバーサイド）
export async function getCurrentUser(): Promise<User | null> {
  const token = await getTokenFromCookies()
  if (!token) {
    return null
  }

  return await getProfileFromAPI(token)
}

// リクエストから認証情報を検証
export async function authenticateRequest(
  request: NextRequest
): Promise<User | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  const user = await getProfileFromAPI(token)
  return user
}

// CSP Provisioning Service向けのAPIコール関数
export async function callCSPProvisioningAPI(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${CSP_PROVISIONING_URL}/api${endpoint}`

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
}

// メインAPI向けのAPIコール関数（CSP Account用）
export async function callMainAPI(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_URL}/api${endpoint}`

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
}
