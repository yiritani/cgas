import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../../../components/Layout'
import AuthGuard from '../../../../components/AuthGuard'
import CSPProvisioningForm from '../../../../components/CSPProvisioningForm'
import { Card } from '@sakura-ui/core'
import { useAuth } from '../../../../contexts/AuthContext'

interface CSPRequest {
  id: string
  project_id: number
  requested_by: string
  provider: 'aws' | 'gcp' | 'azure'
  account_name: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: string
  reviewed_at?: string
  reject_reason?: string
  created_at: string
  updated_at: string
  project?: {
    id: number
    name: string
    description: string
  }
}

interface FormData {
  provider: string
  account_name: string
  reason: string
}

const EditCSPProvisioningPage = () => {
  const router = useRouter()
  const { projectId, id } = router.query
  const { authFetch } = useAuth()
  const [cspRequest, setCspRequest] = useState<CSPRequest | null>(null)
  const [formData, setFormData] = useState<FormData>({
    provider: '',
    account_name: '',
    reason: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // CSP申請を取得
  useEffect(() => {
    const fetchCSPRequest = async () => {
      if (!id) return

      try {
        const response = await authFetch(`/api/csp-requests/${id}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('CSP申請が見つかりません')
          }
          throw new Error('CSP申請の取得に失敗しました')
        }

        const data = await response.json()
        const request = data.data

        // プロジェクトIDの確認
        if (request.project_id !== parseInt(projectId as string)) {
          throw new Error('指定されたプロジェクトのCSP申請ではありません')
        }

        // 編集権限の確認（承認待ちのみ編集可能）
        if (request.status !== 'pending') {
          throw new Error('承認待ちの申請のみ編集できます')
        }

        setCspRequest(request)
        setFormData({
          provider: request.provider,
          account_name: request.account_name,
          reason: request.reason,
        })
      } catch (error) {
        console.error('CSP申請取得エラー:', error)
        setFetchError(
          error instanceof Error
            ? error.message
            : 'CSP申請を取得できませんでした'
        )
      }
    }

    if (id && projectId) {
      fetchCSPRequest()
    }
  }, [id, projectId])

  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value } = e.target
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    },
    []
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError(null)

      try {
        const response = await authFetch(`/api/csp-requests/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.text()
          throw new Error(errorData || 'CSP申請の更新に失敗しました')
        }

        router.push(`/projects/${projectId}/${id}`)
      } catch (error) {
        console.error('CSP申請更新エラー:', error)
        setError(
          error instanceof Error
            ? error.message
            : 'CSP申請の更新に失敗しました。もう一度お試しください。'
        )
      } finally {
        setLoading(false)
      }
    },
    [id, formData, router, projectId, authFetch]
  )

  if (fetchError) {
    return (
      <Layout title="エラー">
        <Card className="bg-red-50 border-l-4 border-l-red-500 border-red-200">
          <div className="flex items-start p-6">
            <div className="bg-red-100 rounded-full p-3 mr-4 flex-shrink-0">
              <span className="material-symbols-outlined text-red-600 text-xl">
                error
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                エラーが発生しました
              </h3>
              <p className="text-red-800 mb-4">{fetchError}</p>
            </div>
          </div>
        </Card>
      </Layout>
    )
  }

  if (!cspRequest) {
    return (
      <Layout title="CSP申請編集">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">読み込み中...</span>
        </div>
      </Layout>
    )
  }

  return (
    <AuthGuard>
      <Layout title={`CSP申請編集 - ${cspRequest.account_name}`}>
        <div className="space-y-6">
          {/* ヘッダー */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border-orange-200 rounded-xl p-6">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center mb-2">
                <span className="material-symbols-outlined mr-3 text-orange-600">
                  edit
                </span>
                CSP申請を編集
              </h1>
              {cspRequest.project && (
                <p className="text-gray-700 flex items-center text-lg">
                  <span className="material-symbols-outlined mr-2 text-sm">
                    folder_managed
                  </span>
                  {cspRequest.project.name}
                </p>
              )}
            </div>
          </div>

          {/* 編集権限の警告 */}
          <Card className="bg-orange-50 border-l-4 border-l-orange-500 border-orange-200 rounded-lg">
            <div className="flex items-center p-3">
              <div className="bg-orange-100 rounded-full flex-shrink-0">
                <span className="material-symbols-outlined text-orange-600 text-sm leading-none">
                  info
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-orange-800 text-sm leading-none">
                  承認待ちの申請のみ編集できます。承認または却下された申請は編集できません。
                </p>
              </div>
            </div>
          </Card>

          {/* フォーム */}
          <CSPProvisioningForm
            projectId={projectId}
            project={cspRequest.project || null}
            formData={formData}
            loading={loading}
            error={error}
            isEdit={true}
            currentProvider={cspRequest.provider}
            onSubmit={handleSubmit}
            onChange={handleInputChange}
            submitButtonText="変更を保存"
            cancelHref={`/projects/${projectId}/${id}`}
          />
        </div>
      </Layout>
    </AuthGuard>
  )
}

export default EditCSPProvisioningPage
