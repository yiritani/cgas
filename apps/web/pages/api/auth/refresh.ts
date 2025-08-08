import { withAuth, sendApiResponse, sendError, setAuthCookie } from '../../../lib/auth-middleware'

export default withAuth(async (req, res, apiCall) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await apiCall('/refresh', {
      method: 'POST',
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    // 新しいトークンをcookieに設定
    if (data.token) {
      setAuthCookie(res, data.token)
      const { token, ...responseData } = data
      res.status(200).json(responseData)
    } else {
      res.status(200).json(data)
    }
  } catch (error) {
    console.error('Refresh proxy error:', error)
    sendError(res, 500, 'Internal server error')
  }
})