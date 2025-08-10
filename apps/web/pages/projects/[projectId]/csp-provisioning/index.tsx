import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../../contexts/AuthContext'
import { Layout } from '../../../../components'
import Link from 'next/link'
import { Button, Card } from '@sakura-ui/core'
import useSWR from 'swr'

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
  }
  user?: {
    id: number
    name: string
    email: string
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface Project {
  id: number
  name: string
  description: string
  project_type: string
}

const CSPProvisioningPage = () => {
  const router = useRouter()
  const { projectId } = router.query
  const { user, authFetch } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  // SWRのfetcher関数
  const fetcher = async (url: string) => {
    const response = await authFetch(url)
    if (!response.ok) {
      throw new Error('データの取得に失敗しました')
    }
    return response.json()
  }

  // CSPリクエストをuseSWRで取得（リアルタイム更新）
  const {
    data: cspData,
    error: cspError,
    mutate,
  } = useSWR(
    projectId
      ? `/api/csp-requests?project_id=${projectId}&page=${page}&limit=10`
      : null,
    fetcher,
    {
      refreshInterval: 5000, // 5秒ごとに自動更新
      revalidateOnFocus: true, // フォーカス時に再取得
      revalidateOnReconnect: true, // 再接続時に再取得
    }
  )

  const requests = cspData?.data || []
  const pagination = cspData?.pagination || null
  const loading = !cspData && !cspError

  // Fetch project details
  const fetchProject = useCallback(async () => {
    if (!projectId) return

    try {
      const response = await authFetch(`/api/projects/${projectId}`)

      if (!response.ok) {
        throw new Error('プロジェクトの取得に失敗しました')
      }

      const data = await response.json()

      // ベンダープロジェクトの場合はアクセスを拒否
      if (data.project_type === 'vendor') {
        setError(
          'ベンダープロジェクトではCSPプロビジョニングはご利用いただけません'
        )
        return
      }

      setProject(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    }
  }, [projectId, authFetch])

  useEffect(() => {
    if (projectId && user) {
      fetchProject()
    }
  }, [projectId, user, fetchProject])

  // CSPエラーをerrorステートに反映
  useEffect(() => {
    if (cspError) {
      setError(cspError.message || 'データの取得に失敗しました')
    }
  }, [cspError])

  // Status display helper
  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: {
        label: 'プロビジョニング中',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: 'pending',
      },
      approved: {
        label: '承認済み',
        className: 'bg-green-100 text-green-800 border-green-200',
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
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border shadow-sm ${statusInfo.className}`}
      >
        <span className="material-symbols-outlined mr-1 text-xs">
          {statusInfo.icon}
        </span>
        {statusInfo.label}
      </span>
    )
  }

  // Provider display helper
  const getProviderDisplay = (provider: string) => {
    const providerMap = {
      aws: {
        name: 'AWS',
        icon: 'cloud',
        color: 'text-orange-600 bg-orange-100',
      },
      gcp: {
        name: 'Google Cloud',
        icon: 'cloud',
        color: 'text-blue-600 bg-blue-100',
      },
      azure: {
        name: 'Microsoft Azure',
        icon: 'cloud',
        color: 'text-indigo-600 bg-indigo-100',
      },
    }

    const providerInfo = providerMap[provider as keyof typeof providerMap] || {
      name: provider,
      icon: 'cloud',
      color: 'text-gray-600 bg-gray-100',
    }

    return (
      <div className="flex items-center">
        <div className={`rounded-full p-2 mr-3 ${providerInfo.color}`}>
          <span className={`material-symbols-outlined text-sm`}>
            {providerInfo.icon}
          </span>
        </div>
        <span className="font-medium text-gray-900">{providerInfo.name}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Card className="text-center p-8 bg-white">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <div className="text-lg font-semibold text-gray-900 mb-2">
                CSP Provisioningを読み込み中...
              </div>
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
            <div className="text-xl font-semibold text-red-900 mb-3">
              エラーが発生しました
            </div>
            <p className="text-red-800 mb-6 leading-relaxed">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => {
                  setError(null)
                  fetchProject()
                  mutate() // SWRでデータを再取得
                }}
                variant="secondary"
                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              >
                <span className="material-symbols-outlined mr-2 text-sm">
                  refresh
                </span>
                再試行
              </Button>
              <Link href="/projects">
                <Button className="w-full">
                  <span className="material-symbols-outlined mr-2 text-sm">
                    arrow_back
                  </span>
                  プロジェクト一覧に戻る
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              {project?.name || `Project ${projectId}`}
            </Link>
            <span className="material-symbols-outlined text-gray-400 text-sm">
              chevron_right
            </span>
            <span className="text-gray-900 font-medium">CSP Provisioning</span>
          </nav>
        </div>

        {/* ヘッダー */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200 shadow-lg">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="material-symbols-outlined mr-3 text-blue-600 text-3xl sm:text-4xl">
                    cloud
                  </span>
                  CSP Provisioning
                </div>
                <p className="text-gray-700 text-lg leading-relaxed">
                  <span className="font-semibold text-blue-600">
                    {project?.name}
                  </span>
                  プロジェクトのクラウドサービス
                  プロビジョニングを管理できます。
                </p>
              </div>

              <div className="flex-shrink-0">
                <Link href={`/projects/${projectId}/csp-provisioning/new`}>
                  <Button className="w-full sm:w-auto h-12 rounded-lg font-medium flex items-center justify-center px-6">
                    <span className="material-symbols-outlined mr-2 text-lg">
                      add_circle
                    </span>
                    新規プロビジョニング
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        {/* CSP Provisioning一覧 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <span className="material-symbols-outlined mr-3 text-blue-600">
                list
              </span>
              プロビジョニング一覧
            </h2>
            {requests.length > 0 && (
              <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                <span className="text-blue-800 font-medium text-sm">
                  <span className="material-symbols-outlined mr-1 text-sm align-middle">
                    cloud
                  </span>
                  {requests.length}件
                </span>
              </div>
            )}
          </div>

          {requests.length === 0 ? (
            <Card className="text-center py-16 border-2 border-dashed border-gray-200 bg-white">
              <div className="max-w-sm mx-auto">
                <div className="bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 text-3xl">
                    cloud_off
                  </span>
                </div>
                <div className="text-xl font-semibold text-gray-900 mb-3">
                  CSP Provisioningがありません
                </div>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  クラウドサービス プロビジョニングを開始するには、
                  <br />
                  新規プロビジョニングを作成してください。
                </p>
                <Link href={`/projects/${projectId}/csp-provisioning/new`}>
                  <Button className="mx-auto h-12 rounded-lg font-medium flex items-center justify-center px-6">
                    <span className="material-symbols-outlined mr-2 text-lg">
                      add_circle
                    </span>
                    新規プロビジョニング
                  </Button>
                </Link>
                <p className="text-xs text-gray-500 mt-4">
                  数分で設定完了します
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {requests.map((request: CSPRequest) => (
                <Card
                  key={request.id}
                  className="hover:shadow-lg transition-all duration-300 border border-gray-200 group bg-white"
                >
                  <div className="p-6">
                    {/* プロバイダー情報 */}
                    <div className="flex items-center justify-between mb-4">
                      {getProviderDisplay(request.provider)}
                      <div className="text-right">
                        {getStatusBadge(request.status)}
                      </div>
                    </div>

                    {/* アカウント名 */}
                    <div className="mb-4">
                      <div className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {request.account_name}
                      </div>
                    </div>

                    {/* 依頼日・理由 */}
                    <div className="mb-6 space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="material-symbols-outlined mr-2 text-sm text-blue-500">
                          event
                        </span>
                        依頼日:{' '}
                        {new Date(request.created_at).toLocaleDateString(
                          'ja-JP'
                        )}
                      </div>
                      {request.reason && (
                        <div className="text-sm text-gray-600">
                          <span className="material-symbols-outlined mr-2 text-sm text-gray-400 align-top">
                            description
                          </span>
                          <span className="line-clamp-2">{request.reason}</span>
                        </div>
                      )}
                    </div>

                    {/* アクションボタン */}
                    <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
                      <Link
                        href={`/projects/${projectId}/csp-provisioning/${request.id}`}
                      >
                        <Button
                          variant="secondary"
                          className="w-full justify-center"
                        >
                          <span className="material-symbols-outlined mr-2 text-sm">
                            visibility
                          </span>
                          詳細を見る
                        </Button>
                      </Link>
                      {request.status === 'pending' &&
                        (request.requested_by === user?.email ||
                          user?.role === 'admin') && (
                          <Link
                            href={`/projects/${projectId}/csp-provisioning/${request.id}/edit`}
                          >
                            <Button className="w-full justify-center">
                              <span className="material-symbols-outlined mr-2 text-sm">
                                edit
                              </span>
                              編集
                            </Button>
                          </Link>
                        )}
                      {request.status === 'approved' && (
                        <div className="text-center text-xs text-green-600 font-medium">
                          承認済み・編集不可
                        </div>
                      )}
                      {request.status === 'rejected' &&
                        request.reject_reason && (
                          <div className="text-center text-xs text-red-600 font-medium">
                            却下理由: {request.reject_reason}
                          </div>
                        )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* ページネーション */}
          {pagination && pagination.totalPages > 1 && (
            <Card className="mt-6 p-4 bg-white">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* ページ情報 */}
                <div className="flex items-center text-sm text-gray-600">
                  <span className="material-symbols-outlined mr-2 text-sm text-blue-500">
                    description
                  </span>
                  <span className="font-medium text-gray-900">
                    {pagination.total}
                  </span>
                  件中{' '}
                  <span className="font-medium text-gray-900">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>
                  -
                  <span className="font-medium text-gray-900">
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}
                  </span>
                  件を表示
                </div>

                {/* ページネーションボタン */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      if (pagination.hasPrev) {
                        setPage(pagination.page - 1)
                      }
                    }}
                    disabled={!pagination.hasPrev}
                    variant="secondary"
                    size="small"
                  >
                    <span className="material-symbols-outlined mr-1 text-sm">
                      chevron_left
                    </span>
                    前へ
                  </Button>

                  {/* ページ番号ボタン */}
                  <div className="hidden md:flex items-center gap-1">
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    )
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === pagination.totalPages ||
                          Math.abs(page - pagination.page) <= 1
                      )
                      .map((page, index, array) => {
                        if (index > 0 && page - array[index - 1] > 1) {
                          return [
                            <span
                              key={`gap-${page}`}
                              className="text-gray-400 px-2"
                            >
                              ...
                            </span>,
                            <button
                              key={page}
                              onClick={() => setPage(page)}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                page === pagination.page
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {page}
                            </button>,
                          ]
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => setPage(page)}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              page === pagination.page
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                  </div>

                  <Button
                    onClick={() => {
                      if (pagination.hasNext) {
                        setPage(pagination.page + 1)
                      }
                    }}
                    disabled={!pagination.hasNext}
                    variant="secondary"
                    size="small"
                  >
                    次へ
                    <span className="material-symbols-outlined ml-1 text-sm">
                      chevron_right
                    </span>
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default CSPProvisioningPage
