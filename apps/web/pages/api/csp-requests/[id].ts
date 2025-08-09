import {
  withCSPProvisioningAuth,
  sendApiResponse,
  sendError,
} from '../../../lib/auth-middleware'

export default withCSPProvisioningAuth(async (req, res, apiCall) => {
  const { method, query } = req
  const { id } = query

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid ID parameter' })
  }

  try {
    const endpoint = `/csp-requests/${id}`
    let response

    switch (method) {
      case 'GET':
        response = await apiCall(endpoint)
        break
      case 'PUT':
        response = await apiCall(endpoint, {
          method: 'PUT',
          body: JSON.stringify(req.body),
        })
        break
      case 'DELETE':
        response = await apiCall(endpoint, {
          method: 'DELETE',
        })
        break
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }

    await sendApiResponse(res, response)
  } catch (error) {
    console.error('CSP request proxy error:', error)
    sendError(res, 500, 'Internal server error')
  }
})
