import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../../../contexts/AuthContext'
import { Layout, CSPProvisioningForm } from '../../../../../components'
import Link from 'next/link'
import { H1, H3, Button, Card } from '@sakura-ui/core'

interface CSPRequest {
  id: string
  project_id: number
  requested_by: string
  provider: 'aws' | 'gcp' | 'azure'
  account_name: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  project?: {
    id: number
    name: string
    description: string
  }
}

const EditCSPProvisioningPage = () => {
  const router = useRouter()
  const { projectId, id } = router.query
  const { user, authFetch } = useAuth()
  const [request, setRequest] = useState<CSPRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    provider: '',
    account_name: '',
    reason: '',
  })

  // Fetch CSP provisioning details
  const fetchData = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)

      // Fetch CSP provisioning details
      const requestResponse = await authFetch(`/api/csp-requests/${id}`)

      if (!requestResponse.ok) {
        if (requestResponse.status === 404) {
          throw new Error('CSP Provisioningが見つかりません')
        }
        throw new Error('CSP Provisioningの取得に失敗しました')
      }

      const requestData = await requestResponse.json()
      const cspRequest = requestData.data

      // Check if this request belongs to the specified project
      if (cspRequest.project_id !== parseInt(projectId as string)) {
        throw new Error(
          '指定されたプロジェクトのCSP Provisioningではありません'
        )
      }

      // Check if the request can be edited
      if (cspRequest.status !== 'pending') {
        throw new Error(
          'このプロビジョニングは編集できません（プロビジョニング中の状態でのみ編集可能です）'
        )
      }

      // 申請者本人または管理者のみ編集可能
      if (cspRequest.requested_by !== user?.email && user?.role !== 'admin') {
        throw new Error('このプロビジョニングを編集する権限がありません')
      }

      setRequest(cspRequest)
      setFormData({
        provider: cspRequest.provider,
        account_name: cspRequest.account_name,
        reason: cspRequest.reason,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [id, projectId, user, authFetch])

  useEffect(() => {
    if (id && projectId && user) {
      fetchData()
    }
  }, [id, projectId, user, fetchData])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.account_name || !formData.reason) {
      setError('全ての項目を入力してください')
      return
    }

    if (!request) return

    try {
      setSaving(true)
      setError(null)

      const response = await authFetch(`/api/csp-requests/${request.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_name: formData.account_name,
          reason: formData.reason,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.error || 'CSP Provisioningの更新に失敗しました'
        )
      }

      // Success - redirect to request detail page
      router.push(`/projects/${projectId}/csp-provisioning/${request.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Card className="text-center p-8">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <H3 className="text-lg font-semibold text-gray-900 mb-2 mt-0">
                CSP Provisioningを読み込み中...
              </H3>
              <p className="text-gray-600 text-sm">しばらくお待ちください</p>
            </div>
          </Card>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Card className="max-w-md w-full text-center p-8 bg-red-50 border-l-4 border-l-red-500 border-red-200">
            <div className="bg-red-100 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-600 text-2xl">
                error
              </span>
            </div>
            <H3 className="text-xl font-semibold text-red-900 mb-3 mt-0">
              エラーが発生しました
            </H3>
            <p className="text-red-800 mb-6 leading-relaxed">{error}</p>
            <Link href={`/projects/${projectId}/csp-provisioning`}>
              <Button className="w-full">
                <span className="material-symbols-outlined mr-2 text-sm">
                  arrow_back
                </span>
                CSP Provisioning一覧に戻る
              </Button>
            </Link>
          </Card>
        </div>
      </Layout>
    )
  }

  if (!request) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Card className="max-w-md w-full text-center p-8 border-2 border-dashed border-gray-200 bg-gray-50">
            <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <span className="material-symbols-outlined text-gray-600 text-2xl">
                folder_off
              </span>
            </div>
            <H3 className="text-xl font-semibold text-gray-900 mb-3 mt-0">
              CSP Provisioningが見つかりません
            </H3>
            <p className="text-gray-600 mb-6">
              指定されたプロビジョニングは存在しないか、
              <br />
              アクセス権限がありません
            </p>
            <Link href={`/projects/${projectId}/csp-provisioning`}>
              <Button className="w-full" size="large">
                <span className="material-symbols-outlined mr-2">
                  arrow_back
                </span>
                CSP Provisioning一覧に戻る
              </Button>
            </Link>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* パンくずナビ */}
        <div className="mb-6">
          <nav
            className="flex items-center space-x-2 text-sm text-gray-600"
            aria-label="Breadcrumb"
          >
            <Link
              href="/projects"
              className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              プロジェクト
            </Link>
            <span className="material-symbols-outlined text-gray-400 text-sm">
              chevron_right
            </span>
            <Link
              href={`/projects/${projectId}`}
              className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              {request.project?.name || `Project ${projectId}`}
            </Link>
            <span className="material-symbols-outlined text-gray-400 text-sm">
              chevron_right
            </span>
            <Link
              href={`/projects/${projectId}/csp-provisioning`}
              className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              CSP Provisioning
            </Link>
            <span className="material-symbols-outlined text-gray-400 text-sm">
              chevron_right
            </span>
            <Link
              href={`/projects/${projectId}/csp-provisioning/${request.id}`}
              className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              詳細
            </Link>
            <span className="material-symbols-outlined text-gray-400 text-sm">
              chevron_right
            </span>
            <span className="text-gray-900 font-medium">編集</span>
          </nav>
        </div>

        {/* ヘッダー */}
        <Card className="mb-8 bg-gradient-to-r from-orange-50 via-yellow-50 to-amber-50 border-orange-200">
          <div className="p-6 sm:p-8">
            <div className="flex items-center mb-4">
              <div className="bg-orange-100 rounded-full p-3 mr-4">
                <span className="material-symbols-outlined text-orange-600 text-2xl">
                  edit
                </span>
              </div>
              <H1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-0">
                CSP Provisioning編集
              </H1>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">
              プロビジョニングID:{' '}
              <span className="font-semibold text-orange-600">
                {request.id}
              </span>
            </p>
          </div>
        </Card>

        {/* フォーム */}
        <CSPProvisioningForm
          projectId={projectId}
          project={request.project || null}
          formData={formData}
          loading={saving}
          error={error}
          isEdit={true}
          currentProvider={request.provider}
          onSubmit={handleSubmit}
          onChange={handleChange}
          submitButtonText="更新する"
          cancelHref={`/projects/${projectId}/csp-provisioning/${request.id}`}
        />

        {/* 編集についての警告 */}
        <Card className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="p-6 sm:p-8">
            <div className="flex items-start">
              <div className="bg-amber-100 rounded-full p-3 mr-4 flex-shrink-0">
                <span className="material-symbols-outlined text-amber-600 text-xl">
                  warning
                </span>
              </div>
              <div className="flex-1">
                <H3 className="text-lg font-semibold text-gray-900 mb-4 mt-0">
                  編集について
                </H3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="material-symbols-outlined text-blue-500 text-sm mr-3 mt-0.5">
                      check_circle
                    </span>
                    <p className="text-gray-700 text-sm">
                      プロビジョニング中の状態でのみ編集が可能です
                    </p>
                  </div>
                  <div className="flex items-start">
                    <span className="material-symbols-outlined text-green-500 text-sm mr-3 mt-0.5">
                      admin_panel_settings
                    </span>
                    <p className="text-gray-700 text-sm">
                      申請者本人または管理者が編集できます
                    </p>
                  </div>
                  <div className="flex items-start">
                    <span className="material-symbols-outlined text-orange-500 text-sm mr-3 mt-0.5">
                      lock
                    </span>
                    <p className="text-gray-700 text-sm">
                      プロバイダーとプロジェクトは変更できません
                    </p>
                  </div>
                  <div className="flex items-start">
                    <span className="material-symbols-outlined text-purple-500 text-sm mr-3 mt-0.5">
                      update
                    </span>
                    <p className="text-gray-700 text-sm">
                      編集すると更新日時が記録されます
                    </p>
                  </div>
                  <div className="flex items-start">
                    <span className="material-symbols-outlined text-green-500 text-sm mr-3 mt-0.5">
                      rate_review
                    </span>
                    <p className="text-gray-700 text-sm">
                      管理者に再度レビューが依頼されます
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}

export default EditCSPProvisioningPage
