import {
  withAuth,
  sendApiResponse,
  sendError,
} from '../../../lib/auth-middleware'

export default withAuth(async (req, res, apiCall) => {
  const { method, query, body } = req
  const { params } = query

  // paramsから ID を取得 (配列の最初の要素)
  const id = Array.isArray(params) && params.length > 0 ? params[0] : undefined

  console.log(
    'CSP Account Members API Proxy - Method:',
    method,
    'Query:',
    query,
    'ID:',
    id
  )

  try {
    // APIエンドポイントを構築
    let endpoint = '/csp-account-members'
    if (id) {
      endpoint += `/${id}`
    }

    // クエリパラメータを処理
    const queryParams = new URLSearchParams()
    if (query.csp_account_id) {
      queryParams.append('csp_account_id', query.csp_account_id as string)
    }
    if (query.project_id) {
      queryParams.append('project_id', query.project_id as string)
    }
    if (query.user_id) {
      queryParams.append('user_id', query.user_id as string)
    }

    if (queryParams.toString()) {
      endpoint += `?${queryParams.toString()}`
    }

    console.log('Proxying to endpoint:', endpoint)

    let response

    switch (method) {
      case 'GET':
        response = await apiCall(endpoint)
        break
      case 'POST':
        response = await apiCall(endpoint, {
          method: 'POST',
          body: JSON.stringify(body),
        })
        break
      case 'PUT':
        response = await apiCall(endpoint, {
          method: 'PUT',
          body: JSON.stringify(body),
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
    console.error('API proxy error:', error)
    sendError(res, 500, 'Internal server error')
  }
})
