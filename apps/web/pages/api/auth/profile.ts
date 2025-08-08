import { withAuth, sendApiResponse, sendError } from '../../../lib/auth-middleware'

export default withAuth(async (req, res, apiCall) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await apiCall('/profile')
    await sendApiResponse(res, response)
  } catch (error) {
    console.error('Profile proxy error:', error)
    sendError(res, 500, 'Internal server error')
  }
})