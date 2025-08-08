import { withAuthOptional, apiCall, setAuthCookie } from '../../../lib/auth-middleware'

export default withAuthOptional(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await apiCall('/login', {
      method: 'POST',
      body: JSON.stringify(req.body),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    // トークンをhttpOnly cookieとして設定
    if (data.token) {
      setAuthCookie(res, data.token)

      // フロントエンドにはトークンを返さず、ユーザー情報のみ返す
      const { token, ...userInfo } = data
      res.status(200).json(userInfo)
    } else {
      res.status(200).json(data)
    }
  } catch (error) {
    console.error('Login proxy error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})