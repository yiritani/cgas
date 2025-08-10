import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import AuthGuard from '../../../components/AuthGuard'
import CSPRequestCard from '../../../components/CSPRequestCard'
import Link from 'next/link'
import { Button, Card } from '@sakura-ui/core'
import useSWR from 'swr'
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
  const { authFetch } = useAuth()
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [project, setProject] = useState<Project | null>(null)

  // SWR fetcher function
  const fetcher = async (url: string) => {
    const response = await authFetch(url)
    if (!response.ok) {
      throw new Error(
        'API request failed: ' +
          ((await response.text()) || 'Empty response from API server')
      )
    }
    return response.json()
  }

  // CSP requests data fetching with SWR
  const { data, error, mutate } = useSWR(
    projectId
      ? `/api/csp-requests?project_id=${projectId}&page=${page}&limit=${limit}`
      : null,
    fetcher,
    {
      refreshInterval: 5000, // 5秒ごとに更新
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  )

  const cspRequests: CSPRequest[] = data?.data || []
  const pagination: PaginationInfo = data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  }

  // プロジェクト情報を取得
  useEffect(() => {
    if (projectId) {
      authFetch(`/api/projects/${projectId}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error('Failed to fetch project')
          }
          return res.json()
        })
        .then((data) => setProject(data))
        .catch((error) => {
          console.error('プロジェクト情報の取得に失敗しました:', error)
        })
    }
  }, [projectId, authFetch])

  if (!projectId) {
    return <Layout title="CSP Provisioning">Loading...</Layout>
  }

  return (
    <AuthGuard>
      <Layout title={`CSP Provisioning - ${project?.name || 'Project'}`}>
        <div className="space-y-6">
          {/* ヘッダー */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200 rounded-xl p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center mb-2">
                    <span className="material-symbols-outlined mr-3 text-blue-600">
                      cloud
                    </span>
                    CSP プロビジョニング申請
                    <span className="ml-3 text-sm font-normal bg-green-100 text-green-800 px-3 py-1 rounded-full inline-flex items-center">
                      <span className="material-symbols-outlined mr-1 text-xs leading-none">
                        refresh
                      </span>
                      <span className="leading-none">リアルタイム更新</span>
                    </span>
                  </h1>
                  {project && (
                    <p className="text-gray-700 flex items-center text-lg">
                      <span className="material-symbols-outlined mr-2 text-sm">
                        folder_managed
                      </span>
                      {project.name}
                    </p>
                  )}
                </div>
                <Link href={`/projects/${projectId}/new`}>
                  <Button className="inline-flex items-center bg-blue-600 hover:bg-blue-700 px-4 py-2">
                    <span className="material-symbols-outlined mr-2 text-sm leading-none">
                      add_circle
                    </span>
                    <span className="leading-none">新規申請</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* エラー表示 */}
          {error && (
            <Card className="bg-red-50 border-l-4 border-l-red-500 border-red-200 rounded-lg">
              <div className="flex items-start p-4">
                <div className="bg-red-100 rounded-full p-2 mr-3 flex-shrink-0">
                  <span className="material-symbols-outlined text-red-600 text-sm">
                    error
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-red-900 mb-1">
                    データの取得に失敗しました
                  </h3>
                  <p className="text-red-800 text-sm">{error.message}</p>
                  <Button
                    variant="secondary"
                    onClick={() => mutate()}
                    className="mt-2"
                  >
                    <span className="material-symbols-outlined mr-1 text-sm">
                      refresh
                    </span>
                    再試行
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* 申請一覧 */}
          {cspRequests.length === 0 && !error ? (
            <Card
              className="text-center rounded-lg flex items-center justify-center"
              style={{ minHeight: '300px' }}
            >
              <div>
                <span className="material-symbols-outlined text-gray-400 text-6xl mb-4 block">
                  cloud_off
                </span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  申請がありません
                </h3>
                <p className="text-gray-600 mb-4">
                  まだCSPプロビジョニング申請が作成されていません。
                </p>
                <Link href={`/projects/${projectId}/new`}>
                  <Button>
                    <span className="material-symbols-outlined mr-2 text-sm">
                      add
                    </span>
                    最初の申請を作成
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {cspRequests.map((request) => (
                <CSPRequestCard
                  key={request.id}
                  request={request}
                  projectId={projectId}
                />
              ))}
            </div>
          )}

          {/* ページネーション */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4">
              <Button
                variant="secondary"
                disabled={!pagination.hasPrev}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 inline-flex items-center"
              >
                <span className="material-symbols-outlined mr-1 text-sm leading-none">
                  chevron_left
                </span>
                <span className="leading-none">前へ</span>
              </Button>
              <span className="text-sm text-gray-600 px-2">
                {pagination.page} / {pagination.totalPages} ページ （全{' '}
                {pagination.total} 件）
              </span>
              <Button
                variant="secondary"
                disabled={!pagination.hasNext}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 inline-flex items-center"
              >
                <span className="leading-none">次へ</span>
                <span className="material-symbols-outlined ml-1 text-sm leading-none">
                  chevron_right
                </span>
              </Button>
            </div>
          )}
        </div>
      </Layout>
    </AuthGuard>
  )
}

export default CSPProvisioningPage
