import { withAuth } from '../../../lib/auth-middleware'

export default withAuth(async (req, res, apiCall) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await apiCall('/projects/me')
    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    res.status(200).json(data)
  } catch (error) {
    console.error('Projects proxy error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})