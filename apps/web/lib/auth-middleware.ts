import type { NextApiRequest, NextApiResponse } from 'next'
import { parse, serialize } from 'cookie'

// 認証済みリクエストの型定義
export interface AuthenticatedRequest extends NextApiRequest {
  token: string
  userId: number
}

// API コール用のヘルパー関数の型定義
export type ApiCall = (url: string, options?: RequestInit) => Promise<Response>

// 認証付きAPIハンドラーの型定義
export type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse,
  apiCall: ApiCall
) => Promise<void>

// HTTPメソッド制限付きハンドラーの型定義
export type AuthenticatedMethodHandler<T extends string = string> = (
  req: AuthenticatedRequest & { method: T },
  res: NextApiResponse,
  apiCall: ApiCall
) => Promise<void>

// APIレスポンスの共通型定義
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

// エラーレスポンス型
export interface ErrorResponse {
  error: string
  details?: any
}

// cookieを削除するヘルパー関数
const clearAuthCookieInternal = (res: NextApiResponse) => {
  const cookie = serialize('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1,
    path: '/',
  })
  res.setHeader('Set-Cookie', cookie)
}

// バックエンドAPIコール用のヘルパー関数を作成
const createApiCall = (token: string, res: NextApiResponse) => {
  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    const API_URL = process.env.API_URL || 'http://localhost:8080'
    const fullUrl = url.startsWith('/')
      ? `${API_URL}/api${url}`
      : `${API_URL}/api/${url}`

    // DELETEリクエストの場合はContent-Typeを設定しない
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    }

    // ボディがある場合のみContent-Typeを設定
    if (options.body && options.method !== 'DELETE') {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    })

    // 認証エラーの場合はcookieを削除
    if (response.status === 401) {
      clearAuthCookieInternal(res)
    }

    return response
  }
}

// JWTからユーザーIDを取得（簡易版）
const getUserIdFromToken = (token: string): number => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.user_id || payload.sub || 0
  } catch {
    return 0
  }
}

// 認証が必要なハンドラーをラップするHOF
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // cookieからトークンを取得
      const cookies = parse(req.headers.cookie || '')
      const token = cookies['auth-token']

      if (!token) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      // トークンからユーザーIDを取得
      const userId = getUserIdFromToken(token)

      // リクエストオブジェクトを拡張
      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.token = token
      authenticatedReq.userId = userId

      // APIコール用のヘルパー関数を作成
      const apiCall = createApiCall(token, res)

      // 認証済みハンドラーを実行
      await handler(authenticatedReq, res, apiCall)
    } catch (error) {
      console.error('Auth middleware error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}

// 認証不要だがcookieベース認証を試行するハンドラー（ログイン・登録用）
export type UnauthenticatedHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void>

export function withAuthOptional(handler: UnauthenticatedHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res)
    } catch (error) {
      console.error('Handler error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}

// cookieを設定するヘルパー関数
export const setAuthCookie = (res: NextApiResponse, token: string) => {
  const cookie = serialize('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7日間
    path: '/',
  })
  res.setHeader('Set-Cookie', cookie)
}

// cookieを削除するヘルパー関数（外部公開用）
export const clearAuthCookie = (res: NextApiResponse) => {
  clearAuthCookieInternal(res)
}

// バックエンドAPIコール用のヘルパー関数（認証不要版）
export const apiCall = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const API_URL = process.env.API_URL || 'http://localhost:8080'
  const fullUrl = url.startsWith('/')
    ? `${API_URL}/api${url}`
    : `${API_URL}/api/${url}`

  return fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

// HTTPメソッド別のヘルパー関数
export const createMethodHandler = <T extends string>(
  allowedMethods: T[],
  handler: AuthenticatedMethodHandler<T>
): AuthenticatedHandler => {
  return async (req, res, apiCall) => {
    if (!allowedMethods.includes(req.method as T)) {
      return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }

    await handler(req as AuthenticatedRequest & { method: T }, res, apiCall)
  }
}

// よく使用されるHTTPメソッドのショートハンド
export const withGetAuth = (handler: AuthenticatedMethodHandler<'GET'>) =>
  createMethodHandler(['GET'], handler)

export const withPostAuth = (handler: AuthenticatedMethodHandler<'POST'>) =>
  createMethodHandler(['POST'], handler)

export const withPutAuth = (handler: AuthenticatedMethodHandler<'PUT'>) =>
  createMethodHandler(['PUT'], handler)

export const withDeleteAuth = (handler: AuthenticatedMethodHandler<'DELETE'>) =>
  createMethodHandler(['DELETE'], handler)

// 複数メソッドのショートハンド
export const withCrudAuth = (
  handler: AuthenticatedMethodHandler<'GET' | 'POST' | 'PUT' | 'DELETE'>
) => createMethodHandler(['GET', 'POST', 'PUT', 'DELETE'], handler)

// レスポンス送信のヘルパー関数
export const sendApiResponse = async (
  res: NextApiResponse,
  apiResponse: Response,
  successStatus?: number
): Promise<void> => {
  let responseText = ''

  try {
    // まずレスポンスをテキストとして取得
    responseText = await apiResponse.text()

    if (!responseText) {
      console.error('Empty response from API server')
      return res.status(500).json({ error: 'Empty response from API server' })
    }

    console.log('API Response text:', responseText.substring(0, 300)) // デバッグ用

    // JSONとしてパース
    const data = JSON.parse(responseText)

    if (!apiResponse.ok) {
      res.status(apiResponse.status).json(data)
      return
    }

    res.status(successStatus || apiResponse.status).json(data)
  } catch (error) {
    console.error('JSON parse error in sendApiResponse:', error)
    console.error('Response status:', apiResponse.status)
    console.error('Response text:', responseText.substring(0, 500)) // エラー時により多くのテキストを表示
    console.error(
      'Response headers:',
      Object.fromEntries(apiResponse.headers.entries())
    )

    res.status(500).json({
      error: 'Invalid JSON response from API server',
      status: apiResponse.status,
      statusText: apiResponse.statusText,
      responsePreview: responseText.substring(0, 100),
    })
  }
}

// エラーレスポンス送信のヘルパー関数
export const sendError = (
  res: NextApiResponse,
  status: number,
  error: string,
  details?: any
): void => {
  const errorResponse: ErrorResponse = { error }
  if (details) errorResponse.details = details

  res.status(status).json(errorResponse)
}
