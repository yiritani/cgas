import { NextRequest, NextResponse } from 'next/server'
import { callCSPProvisioningAPI } from '../../../../lib/auth'

const COOKIE_NAME = 'admin_auth_token'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth token from cookie
    const token = request.cookies.get(COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const endpoint = `/csp-requests/${params.id}`

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
    console.error('CSP request detail proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth token from cookie
    const token = request.cookies.get(COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // 通常の更新リクエスト（レビューは別ルート）
    const endpoint = `/csp-requests/${params.id}`

    const response = await callCSPProvisioningAPI(endpoint, token, {
      method: 'PUT',
      body: JSON.stringify(body),
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
    console.error('CSP request update proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth token from cookie
    const token = request.cookies.get(COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const endpoint = `/csp-requests/${params.id}`

    const response = await callCSPProvisioningAPI(endpoint, token, {
      method: 'DELETE',
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

    // DELETE might return empty response
    if (response.status === 204) {
      return NextResponse.json({ success: true })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('CSP request delete proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
