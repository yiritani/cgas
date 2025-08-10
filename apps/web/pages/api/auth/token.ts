import { withAuth, AuthenticatedRequest } from '../../../lib/auth-middleware'

export default withAuth(async (req, res, apiCall) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // AuthenticatedRequestからトークンを取得
    const authenticatedReq = req as AuthenticatedRequest
    const token = authenticatedReq.token

    if (!token) {
      return res.status(401).json({ error: 'No token found' })
    }

    // cookieから取得したトークンをレスポンスとして返す
    res.status(200).json({ token })
  } catch (error) {
    console.error('Token endpoint error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
