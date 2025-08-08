import { withAuth } from '../../../../lib/auth-middleware'

export default withAuth(async (req, res, apiCall) => {
  const { id } = req.query

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid project ID' })
  }

  if (req.method === 'GET') {
    try {
      const response = await apiCall(`/projects/${id}/vendor-relations`, {
        method: 'GET',
      })

      const data = await response.json()

      if (!response.ok) {
        return res.status(response.status).json(data)
      }

      res.status(200).json(data)
    } catch (error) {
      console.error('Vendor relations list proxy error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      const response = await apiCall(`/projects/${id}/vendor-relations`, {
        method: 'POST',
        body: JSON.stringify(req.body),
      })

      const data = await response.json()

      if (!response.ok) {
        return res.status(response.status).json(data)
      }

      res.status(201).json(data)
    } catch (error) {
      console.error('Vendor relations creation proxy error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
})
