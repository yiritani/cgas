import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../../contexts/AuthContext'
import Layout from '../../../../components/Layout'
import Link from 'next/link'
import { Button, Card } from '@sakura-ui/core'

interface CSPRequest {
  id: number
  project_id: number
  user_id: number
  provider: 'aws' | 'gcp' | 'azure'
  account_name: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: number
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
  const { user, authFetch } = useAuth()
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
    if (id && projectId && user) {
      fetchCSPRequest()
    }
  }, [id, projectId, user, fetchCSPRequest])

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
        const errorData = await response.json()
        throw new Error(errorData.error || '削除に失敗しました')
      }

      // Success - redirect to CSP provisioning list
      router.push(`/projects/${projectId}/csp-provisioning`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setDeleting(false)
    }
  }

  // Status display helper
  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: {
        label: 'プロビジョニング中',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: 'sync',
      },
      approved: {
        label: '承認済み',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: 'check_circle',
      },
      rejected: {
        label: '却下',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: 'cancel',
      },
    }

    const statusInfo = statusMap[status as keyof typeof statusMap] || {
      label: status,
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: 'help',
    }

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${statusInfo.className}`}
      >
        <span className="material-symbols-outlined mr-1 text-sm">
          {statusInfo.icon}
        </span>
        {statusInfo.label}
      </span>
    )
  }

  // Provider display helper
  const getProviderDisplay = (provider: string) => {
    const providerMap = {
      aws: 'Amazon Web Services (AWS)',
      gcp: 'Google Cloud Platform (GCP)',
      azure: 'Microsoft Azure',
    }
    return providerMap[provider as keyof typeof providerMap] || provider
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Card className="text-center p-8 bg-white">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                CSP Provisioning詳細を読み込み中...
              </h2>
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
            <h2 className="text-xl font-semibold text-red-900 mb-3">
              エラーが発生しました
            </h2>
            <p className="text-red-800 mb-6 leading-relaxed">{error}</p>
            <Link href={`/projects/${projectId}/csp-provisioning`}>
              <Button className="w-full">
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
            <div className="text-xl font-semibold text-gray-900 mb-3">
              CSP Provisioningが見つかりません
            </div>
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

  const canEdit = request.status === 'pending' && request.user_id === user?.id
  const canDelete = request.user_id === user?.id

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* パンくずナビ */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <Link
              href="/projects"
              className="hover:text-blue-600 transition-colors"
            >
              プロジェクト
            </Link>
            <span className="material-symbols-outlined text-gray-400 text-lg">
              chevron_right
            </span>
            <Link
              href={`/projects/${projectId}`}
              className="hover:text-blue-600 transition-colors"
            >
              {request.project?.name || `Project ${projectId}`}
            </Link>
            <span className="material-symbols-outlined text-gray-400 text-lg">
              chevron_right
            </span>
            <Link
              href={`/projects/${projectId}/csp-provisioning`}
              className="hover:text-blue-600 transition-colors"
            >
              CSP Provisioning
            </Link>
            <span className="material-symbols-outlined text-gray-400 text-lg">
              chevron_right
            </span>
            <span className="text-gray-900 font-medium">詳細</span>
          </nav>
        </div>

        {/* ヘッダー */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200 shadow-lg">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="material-symbols-outlined mr-3 text-blue-600 text-3xl sm:text-4xl">
                    cloud_queue
                  </span>
                  CSP Provisioning詳細
                </h1>

                <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                  プロビジョニングID:{' '}
                  <span className="font-semibold">#{request.id}</span>
                </p>

                <div className="flex items-center">
                  {getStatusBadge(request.status)}
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex flex-col sm:flex-row gap-3">
                {canEdit && (
                  <Link
                    href={`/projects/${projectId}/csp-provisioning/${request.id}/edit`}
                  >
                    <Button
                      variant="secondary"
                      className="w-full sm:w-auto h-12 rounded-lg font-medium flex items-center justify-center px-6"
                    >
                      <span className="material-symbols-outlined mr-2 text-lg">
                        edit
                      </span>
                      編集
                    </Button>
                  </Link>
                )}
                {canDelete && (
                  <Button
                    onClick={handleDelete}
                    disabled={deleting}
                    variant="secondary"
                    className="w-full sm:w-auto h-12 rounded-lg font-medium flex items-center justify-center px-6 bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300"
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-300 border-t-red-600 mr-2"></div>
                        削除中...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined mr-2 text-lg">
                          delete
                        </span>
                        削除
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* プロビジョニング詳細 */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white shadow-md">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                  <span className="material-symbols-outlined mr-3 text-blue-600">
                    cloud_queue
                  </span>
                  プロビジョニング内容
                </h2>

                <dl className="space-y-6">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <dt className="text-sm font-medium text-gray-600 flex items-center">
                      <span className="material-symbols-outlined mr-2 text-sm">
                        flag
                      </span>
                      ステータス
                    </dt>
                    <dd>{getStatusBadge(request.status)}</dd>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <dt className="text-sm font-medium text-gray-600 flex items-center">
                      <span className="material-symbols-outlined mr-2 text-sm">
                        cloud
                      </span>
                      クラウドプロバイダー
                    </dt>
                    <dd className="text-sm text-gray-900 font-medium">
                      {getProviderDisplay(request.provider)}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <dt className="text-sm font-medium text-gray-600 flex items-center">
                      <span className="material-symbols-outlined mr-2 text-sm">
                        account_circle
                      </span>
                      アカウント名
                    </dt>
                    <dd className="text-sm text-gray-900 font-medium">
                      {request.account_name}
                    </dd>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between py-3 border-b border-gray-100 gap-2">
                    <dt className="text-sm font-medium text-gray-600 flex items-center">
                      <span className="material-symbols-outlined mr-2 text-sm">
                        folder_managed
                      </span>
                      プロジェクト
                    </dt>
                    <dd className="text-sm text-right">
                      {request.project ? (
                        <div>
                          <div className="font-medium text-gray-900">
                            {request.project.name}
                          </div>
                          {request.project.description && (
                            <div className="text-gray-600 text-xs mt-1">
                              {request.project.description}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-900 font-medium">
                          Project {request.project_id}
                        </span>
                      )}
                    </dd>
                  </div>

                  <div className="py-3">
                    <dt className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                      <span className="material-symbols-outlined mr-2 text-sm">
                        description
                      </span>
                      プロビジョニング理由
                    </dt>
                    <dd className="text-sm text-gray-900 leading-relaxed bg-gray-50 p-4 rounded-lg">
                      {request.reason}
                    </dd>
                  </div>
                </dl>
              </div>
            </Card>

            {/* 却下理由 */}
            {request.status === 'rejected' && request.reject_reason && (
              <Card className="bg-red-50 border-l-4 border-l-red-500 border-red-200 shadow-md">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center mt-0">
                    <span className="material-symbols-outlined mr-2 text-red-600">
                      error
                    </span>
                    却下理由
                  </h3>
                  <p className="text-red-800 leading-relaxed">
                    {request.reject_reason}
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* プロビジョニング情報 */}
            <Card className="bg-white shadow-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center mt-0">
                  <span className="material-symbols-outlined mr-2 text-purple-600">
                    info
                  </span>
                  プロビジョニング情報
                </h3>

                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                      <span className="material-symbols-outlined mr-2 text-sm">
                        person
                      </span>
                      依頼者
                    </dt>
                    <dd className="text-sm">
                      {request.user ? (
                        <div>
                          <div className="font-medium text-gray-900">
                            {request.user.name}
                          </div>
                          <div className="text-gray-600 text-xs">
                            {request.user.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-900">
                          User {request.user_id}
                        </span>
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                      <span className="material-symbols-outlined mr-2 text-sm">
                        schedule
                      </span>
                      依頼日時
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(request.created_at).toLocaleString('ja-JP')}
                    </dd>
                  </div>

                  {request.updated_at !== request.created_at && (
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                        <span className="material-symbols-outlined mr-2 text-sm">
                          update
                        </span>
                        更新日時
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(request.updated_at).toLocaleString('ja-JP')}
                      </dd>
                    </div>
                  )}

                  {request.reviewed_at && (
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                        <span className="material-symbols-outlined mr-2 text-sm">
                          rate_review
                        </span>
                        レビュー日時
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(request.reviewed_at).toLocaleString('ja-JP')}
                      </dd>
                    </div>
                  )}

                  {request.reviewed_by_user && (
                    <div>
                      <dt className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                        <span className="material-symbols-outlined mr-2 text-sm">
                          admin_panel_settings
                        </span>
                        レビューワー
                      </dt>
                      <dd className="text-sm">
                        <div className="font-medium text-gray-900">
                          {request.reviewed_by_user.name}
                        </div>
                        <div className="text-gray-600 text-xs">
                          {request.reviewed_by_user.email}
                        </div>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </Card>

            {/* ステータスガイド */}
            <Card className="bg-gradient-to-br from-gray-50 to-blue-50 border-gray-200 shadow-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center mt-0">
                  <span className="material-symbols-outlined mr-2 text-blue-600">
                    help
                  </span>
                  ステータスについて
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="material-symbols-outlined text-yellow-600 mr-2 text-sm mt-0.5">
                      sync
                    </span>
                    <div>
                      <span className="font-medium text-gray-900">
                        プロビジョニング中:
                      </span>
                      <span className="text-gray-600 text-sm ml-1">
                        管理者のレビュー待ち
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="material-symbols-outlined text-emerald-600 mr-2 text-sm mt-0.5">
                      check_circle
                    </span>
                    <div>
                      <span className="font-medium text-gray-900">
                        承認済み:
                      </span>
                      <span className="text-gray-600 text-sm ml-1">
                        CSPアカウント作成予定
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="material-symbols-outlined text-red-600 mr-2 text-sm mt-0.5">
                      cancel
                    </span>
                    <div>
                      <span className="font-medium text-gray-900">却下:</span>
                      <span className="text-gray-600 text-sm ml-1">
                        プロビジョニングが承認されませんでした
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default CSPProvisioningDetailPage
