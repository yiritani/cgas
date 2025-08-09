import {
  withCSPProvisioningAuth,
  sendApiResponse,
  sendError,
} from '../../lib/auth-middleware'

export default withCSPProvisioningAuth(async (req, res, apiCall) => {
  const { method, query } = req
  let endpoint = '/csp-requests'

  try {
    // URLクエリパラメータがある場合は追加
    const queryString = new URLSearchParams()
    if (query.status) queryString.append('status', query.status as string)
    if (query.project_id)
      queryString.append('project_id', query.project_id as string)
    if (query.user_id) queryString.append('user_id', query.user_id as string)
    if (query.page) queryString.append('page', query.page as string)
    if (query.limit) queryString.append('limit', query.limit as string)

    if (queryString.toString()) {
      endpoint += `?${queryString.toString()}`
    }

    let response

    switch (method) {
      case 'GET':
        response = await apiCall(endpoint)
        break
      case 'POST':
        response = await apiCall(endpoint, {
          method: 'POST',
          body: JSON.stringify(req.body),
        })
        break
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }

    await sendApiResponse(res, response)
  } catch (error) {
    console.error('CSP requests proxy error:', error)
    console.error('Request method:', method)
    console.error('Request endpoint:', endpoint)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    sendError(res, 500, 'Internal server error')
  }
})
