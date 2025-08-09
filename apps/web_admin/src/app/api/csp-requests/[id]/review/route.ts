import { NextRequest, NextResponse } from 'next/server'
import { callCSPProvisioningAPI, callMainAPI } from '../../../../../lib/auth'

const COOKIE_NAME = 'admin_auth_token'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const resolvedParams = await params

    console.log(`[DEBUG REVIEW] Request body:`, body)
    console.log(`[DEBUG REVIEW] Params:`, resolvedParams)
    console.log(`[DEBUG REVIEW] Token:`, token)

    // JWTトークンのペイロードをデコードして権限確認
    try {
      const tokenPayload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      )
      console.log(`[DEBUG REVIEW] JWT Payload:`, tokenPayload)
    } catch (e) {
      console.log(`[DEBUG REVIEW] JWT decode error:`, e)
    }

    // レビューのリクエストは常に /csp-requests/:id/review エンドポイントに送信
    const endpoint = `/csp-requests/${resolvedParams.id}/review`

    console.log(`[DEBUG REVIEW] Endpoint: ${endpoint}`)

    // Step 1: CSP申請をレビュー（承認/却下）
    const response = await callCSPProvisioningAPI(endpoint, token, {
      method: 'PUT',
      body: JSON.stringify(body),
    })

    console.log(
      `[DEBUG REVIEW] CSP Provisioning response status: ${response.status}, ok: ${response.ok}`
    )

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

    const reviewData = await response.json()

    // Step 2: 承認の場合、CSPアカウントを自動作成
    if (body.status === 'approved' && reviewData.data) {
      console.log('[DEBUG REVIEW] Request approved, creating CSP account...')

      // JWTからユーザーIDを取得
      let creatorId = 1 // デフォルト値
      try {
        const tokenPayload = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64').toString()
        )
        creatorId = tokenPayload.user_id || 1
      } catch (e) {
        console.log(
          `[DEBUG REVIEW] Failed to extract user ID from token, using default: ${creatorId}`
        )
      }

      const cspAccountRequest = {
        csp_request_id: parseInt(resolvedParams.id),
        provider: reviewData.data.provider,
        account_name: reviewData.data.account_name,
        project_id: reviewData.data.project_id,
      }

      console.log(
        '[DEBUG REVIEW] Creating CSP account with:',
        cspAccountRequest
      )

      try {
        const cspAccountResponse = await callMainAPI(
          '/internal/csp-accounts/auto-create',
          token,
          {
            method: 'POST',
            body: JSON.stringify(cspAccountRequest),
            headers: {
              'X-Creator-ID': creatorId.toString(),
            },
          }
        )

        console.log(
          `[DEBUG REVIEW] CSP account creation response: ${cspAccountResponse.status}`
        )

        if (!cspAccountResponse.ok) {
          const errorText = await cspAccountResponse.text()
          console.error(
            `[ERROR REVIEW] CSP account creation failed: ${errorText}`
          )

          // CSPアカウント作成に失敗してもレビュー結果は返す（承認は完了している）
          return NextResponse.json({
            ...reviewData,
            warning: 'CSP request approved but CSP account creation failed',
            csp_account_error: errorText,
          })
        }

        const cspAccountData = await cspAccountResponse.json()
        console.log(
          '[DEBUG REVIEW] CSP account created successfully:',
          cspAccountData
        )

        // 両方成功した場合、統合されたレスポンスを返す
        return NextResponse.json({
          ...reviewData,
          csp_account: cspAccountData,
        })
      } catch (error) {
        console.error('[ERROR REVIEW] CSP account creation error:', error)

        // CSPアカウント作成エラーでもレビュー結果は返す
        return NextResponse.json({
          ...reviewData,
          warning: 'CSP request approved but CSP account creation failed',
          csp_account_error:
            error instanceof Error ? error.message : String(error),
        })
      }
    }

    // 却下の場合やその他の場合は、レビュー結果のみ返す
    return NextResponse.json(reviewData)
  } catch (error) {
    console.error('CSP request review proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
