import { withAuth, sendApiResponse, sendError } from '../../lib/auth-middleware'

interface User {
  id: number
  name: string
  email: string
  role: string
}

export default withAuth(async (req, res, apiCall) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await apiCall('/users')
    await sendApiResponse(res, response)
  } catch (error) {
    console.error('Users proxy error:', error)
    sendError(res, 500, 'Internal server error')
  }
})