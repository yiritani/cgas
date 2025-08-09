import { NextRequest, NextResponse } from 'next/server'
import { callCSPProvisioningAPI } from '../../../lib/auth'

const COOKIE_NAME = 'admin_auth_token'

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookie
    const token = request.cookies.get(COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()

    const endpoint = `/csp-requests${queryString ? `?${queryString}` : ''}`

    const response = await callCSPProvisioningAPI(endpoint, token, {
      method: 'GET',
    })

    if (!response.ok) {
      console.error(
        `CSP Provisioning API request failed: ${response.status} ${response.statusText}`
      )
      console.error(`Endpoint: ${endpoint}`)

      const errorText = await response.text()
      console.error(`Response: ${errorText}`)

      return NextResponse.json(
        { error: `API request failed: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('CSP requests proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
