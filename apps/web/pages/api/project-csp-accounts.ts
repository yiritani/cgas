import { withAuth, sendApiResponse, sendError } from '../../lib/auth-middleware'

export default withAuth(async (req, res, apiCall) => {
  const { method, query } = req
  let endpoint = '/project-csp-accounts'

  try {
    
    // URLクエリパラメータがある場合は追加
    const queryString = new URLSearchParams()
    if (query.project_id) queryString.append('project_id', query.project_id as string)
    if (query.csp_account_id) queryString.append('csp_account_id', query.csp_account_id as string)
    
    if (queryString.toString()) {
      endpoint += `?${queryString.toString()}`
    }

    let response
    
    switch (method) {
      case 'GET':
        response = await apiCall(endpoint)
        break
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }

    await sendApiResponse(res, response)
  } catch (error) {
    console.error('Project CSP accounts proxy error:', error)
    console.error('Request method:', method)
    console.error('Request endpoint:', endpoint)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    sendError(res, 500, 'Internal server error')
  }
})