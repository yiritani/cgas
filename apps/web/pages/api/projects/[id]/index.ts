import { withAuth } from '../../../../lib/auth-middleware'

export default withAuth(async (req, res, apiCall) => {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid project ID' })
  }

  try {
    let response: Response

    switch (req.method) {
      case 'GET':
        // プロジェクト詳細取得
        response = await apiCall(`/projects/${id}`)
        break

      case 'PUT':
        // プロジェクト更新
        response = await apiCall(`/projects/${id}`, {
          method: 'PUT',
          body: JSON.stringify(req.body),
        })
        break

      case 'DELETE':
        // プロジェクト削除
        response = await apiCall(`/projects/${id}`, {
          method: 'DELETE',
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
    console.error('Project proxy error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
