import { withAuthOptional, clearAuthCookie } from '../../../lib/auth-middleware'

export default withAuthOptional(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // cookieを削除
    clearAuthCookie(res)
    res.status(200).json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})