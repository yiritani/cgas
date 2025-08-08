import { withAuth } from '../../../lib/auth-middleware'

export default withAuth(async (req, res, apiCall) => {
  if (req.method === 'GET') {
    try {
      const { type } = req.query
      let url = '/projects'

      // type=vendorクエリパラメータがある場合はvendorプロジェクトのみ取得
      if (type === 'vendor') {
        url += '?type=vendor'
      }

      const response = await apiCall(url, {
        method: 'GET',
      })

      const data = await response.json()

      if (!response.ok) {
        return res.status(response.status).json(data)
      }

      res.status(200).json(data)
    } catch (error) {
      console.error('Project list proxy error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      const response = await apiCall('/projects', {
        method: 'POST',
        body: JSON.stringify(req.body),
      })

      const data = await response.json()

      if (!response.ok) {
        return res.status(response.status).json(data)
      }

      res.status(201).json(data)
    } catch (error) {
      console.error('Project creation proxy error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
})
