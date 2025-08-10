import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import AuthGuard from '../../../components/AuthGuard'
import Link from 'next/link'
import { Button, Card } from '@sakura-ui/core'
import { useAuth } from '../../../contexts/AuthContext'

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
  user?: {
    id: number
    name: string
    email: string
  }
  reviewed_by_user?: {
    id: number
    name: string
    email: string
  }
}

const CSPProvisioningDetailPage = () => {
  const router = useRouter()
  const { projectId, id } = router.query
  const { authFetch } = useAuth()
  const [request, setRequest] = useState<CSPRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch CSP provisioning details
  const fetchCSPRequest = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      const response = await authFetch(`/api/csp-requests/${id}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('CSP Provisioningが見つかりません')
        }
        throw new Error('CSP Provisioningの取得に失敗しました')
      }

      const data = await response.json()
      const cspRequest = data.data

      // Check if this request belongs to the specified project
      if (cspRequest.project_id !== parseInt(projectId as string)) {
        throw new Error(
          '指定されたプロジェクトのCSP Provisioningではありません'
        )
      }

      setRequest(cspRequest)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [id, projectId, authFetch])

  useEffect(() => {
    if (id && projectId) {
      fetchCSPRequest()
    }
  }, [id, projectId, fetchCSPRequest])

  // Handle delete request
  const handleDelete = async () => {
    if (
      !request ||
      !confirm('このプロビジョニングを削除してもよろしいですか？')
    ) {
      return
    }

    try {
      setDeleting(true)
      const response = await authFetch(`/api/csp-requests/${request.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('削除に失敗しました')
      }

      router.push(`/projects/${projectId}`)
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'プロビジョニングの削除に失敗しました'
      )
    } finally {
      setDeleting(false)
    }
  }

  // Provider display helper
  const getProviderDisplay = (provider: string) => {
    const providerMap = {
      aws: {
        name: 'Amazon Web Services (AWS)',
        icon: 'cloud',
        color: 'text-orange-600 bg-orange-100',
        fullColor: 'bg-orange-50 border-orange-200',
      },
      gcp: {
        name: 'Google Cloud Platform (GCP)',
        icon: 'cloud',
        color: 'text-blue-600 bg-blue-100',
        fullColor: 'bg-blue-50 border-blue-200',
      },
      azure: {
        name: 'Microsoft Azure',
        icon: 'cloud',
        color: 'text-indigo-600 bg-indigo-100',
        fullColor: 'bg-indigo-50 border-indigo-200',
      },
    }

    return (
      providerMap[provider as keyof typeof providerMap] || {
        name: provider,
        icon: 'cloud',
        color: 'text-gray-600 bg-gray-100',
        fullColor: 'bg-gray-50 border-gray-200',
      }
    )
  }

  // Status display helper
  const getStatusDisplay = (status: string) => {
    const statusMap = {
      pending: {
        text: '承認待ち',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: 'schedule',
        description: 'この申請は管理者による承認を待っています。',
      },
      approved: {
        text: '承認済み',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: 'check_circle',
        description: 'この申請は承認され、CSPアカウントが作成されました。',
      },
      rejected: {
        text: '却下',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: 'cancel',
        description: 'この申請は却下されました。',
      },
    }

    return (
      statusMap[status as keyof typeof statusMap] || {
        text: status,
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: 'help',
        description: '',
      }
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  if (loading) {
    return (
      <Layout title="CSP Provisioning詳細">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">読み込み中...</span>
        </div>
      </Layout>
    )
  }

  if (error || !request) {
    return (
      <Layout title="エラー">
        <Card className="bg-red-50 border-l-4 border-l-red-500 border-red-200 rounded-lg">
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
              <p className="text-red-800 mb-4">
                {error || 'CSP Provisioningが見つかりませんでした。'}
              </p>
              <Link href={`/projects/${projectId}`}>
                <Button variant="secondary">
                  <span className="material-symbols-outlined mr-2 text-sm">
                    arrow_back
                  </span>
                  一覧に戻る
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </Layout>
    )
  }

  const providerInfo = getProviderDisplay(request.provider)
  const statusInfo = getStatusDisplay(request.status)

  return (
    <AuthGuard>
      <Layout title={`CSP Provisioning - ${request.account_name}`}>
        <div className="space-y-6">
          {/* ヘッダー */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center mb-2">
                    <span className="material-symbols-outlined mr-3 text-blue-600">
                      cloud
                    </span>
                    {request.account_name}
                  </h1>
                  {request.project && (
                    <p className="text-gray-700 flex items-center text-lg">
                      <span className="material-symbols-outlined mr-2 text-sm">
                        folder_managed
                      </span>
                      {request.project.name}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link href={`/projects/${projectId}`}>
                    <Button
                      variant="secondary"
                      className="bg-white hover:bg-gray-50 px-4 py-2 inline-flex items-center"
                    >
                      <span className="material-symbols-outlined mr-2 text-sm leading-none">
                        arrow_back
                      </span>
                      <span className="leading-none">一覧に戻る</span>
                    </Button>
                  </Link>
                  {request.status === 'pending' && (
                    <Link href={`/projects/${projectId}/${request.id}/edit`}>
                      <Button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 inline-flex items-center">
                        <span className="material-symbols-outlined mr-2 text-sm leading-none">
                          edit
                        </span>
                        <span className="leading-none">編集</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ステータス */}
          <Card
            className={`border-l-4 rounded-lg ${statusInfo.color.replace('text-', 'border-l-').replace('bg-', '').replace('border-', '')}`}
          >
            <div className="p-6">
              <div className="flex items-start">
                <div
                  className={`rounded-full p-3 mr-4 flex-shrink-0 ${statusInfo.color}`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {statusInfo.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold mb-2">
                    {statusInfo.text}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {statusInfo.description}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* プロバイダー情報 */}
          <Card className={`${providerInfo.fullColor} rounded-lg`}>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="material-symbols-outlined mr-2 text-blue-600">
                  cloud
                </span>
                クラウドプロバイダー
              </h2>
              <div className="flex items-center">
                <div className={`rounded-full p-3 mr-4 ${providerInfo.color}`}>
                  <span className="material-symbols-outlined text-xl">
                    {providerInfo.icon}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {providerInfo.name}
                  </h3>
                  <p className="text-gray-600">
                    アカウント名: {request.account_name}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* 申請詳細 */}
          <Card className="rounded-lg">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="material-symbols-outlined mr-2 text-blue-600">
                  description
                </span>
                申請詳細
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      申請者
                    </label>
                    <p className="text-gray-900">{request.requested_by}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      申請日時
                    </label>
                    <p className="text-gray-900">
                      {formatDate(request.created_at)}
                    </p>
                  </div>
                  {request.reviewed_by && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          承認者
                        </label>
                        <p className="text-gray-900">{request.reviewed_by}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          承認日時
                        </label>
                        <p className="text-gray-900">
                          {request.reviewed_at &&
                            formatDate(request.reviewed_at)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    プロビジョニング理由
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {request.reason}
                    </p>
                  </div>
                </div>
                {request.reject_reason && (
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-2">
                      却下理由
                    </label>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-900 whitespace-pre-wrap">
                        {request.reject_reason}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* アクションボタン */}
          <Card className="rounded-lg">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="material-symbols-outlined mr-2 text-blue-600">
                  settings
                </span>
                アクション
              </h2>
              <div className="flex flex-col sm:flex-row gap-4">
                {request.status === 'pending' && (
                  <>
                    <Link
                      href={`/projects/${projectId}/${request.id}/edit`}
                      className="flex-1"
                    >
                      <Button className="w-full justify-center py-2 inline-flex items-center">
                        <span className="material-symbols-outlined mr-2 text-sm leading-none">
                          edit
                        </span>
                        <span className="leading-none">編集</span>
                      </Button>
                    </Link>
                    <Button
                      variant="secondary"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 justify-center text-red-600 hover:text-red-700 hover:bg-red-50 py-2 inline-flex items-center"
                    >
                      {deleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent mr-2"></div>
                          <span className="leading-none">削除中...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined mr-2 text-sm leading-none">
                            delete
                          </span>
                          <span className="leading-none">削除</span>
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    </AuthGuard>
  )
}

export default CSPProvisioningDetailPage
