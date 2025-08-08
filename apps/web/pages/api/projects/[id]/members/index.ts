import { withAuth } from '../../../../../lib/auth-middleware'

export default withAuth(async (req, res, apiCall) => {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid project ID' })
  }

  try {
    let response: Response

    switch (req.method) {
      case 'GET':
        // メンバー一覧取得（クエリパラメータを透過的に渡す）
        const searchParams = new URLSearchParams()
        if (req.query.page) searchParams.set('page', req.query.page as string)
        if (req.query.limit) searchParams.set('limit', req.query.limit as string)
        
        const queryString = searchParams.toString()
        const endpoint = `/projects/${id}/members${queryString ? `?${queryString}` : ''}`
        
        response = await apiCall(endpoint)
        break

      case 'POST':
        // メンバー追加
        response = await apiCall(`/projects/${id}/members`, {
          method: 'POST',
          body: JSON.stringify(req.body),
        })
        break

      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    res.status(response.status).json(data)
  } catch (error) {
    console.error('Project members proxy error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})