import { withAuth } from '../../../../../lib/auth-middleware'

export default withAuth(async (req, res, apiCall) => {
  const { id, relationId } = req.query

  if (!id || Array.isArray(id) || !relationId || Array.isArray(relationId)) {
    return res.status(400).json({ error: 'Invalid project ID or relation ID' })
  }

  if (req.method === 'DELETE') {
    try {
      const response = await apiCall(
        `/projects/${id}/vendor-relations/${relationId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const data = await response.json()
        return res.status(response.status).json(data)
      }

      res.status(204).end()
    } catch (error) {
      console.error('Vendor relations deletion proxy error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' })
  }
})
