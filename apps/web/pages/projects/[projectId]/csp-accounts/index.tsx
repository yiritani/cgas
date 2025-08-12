import Head from 'next/head'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../../contexts/AuthContext'
import { Layout } from '../../../../components'
import Link from 'next/link'
import { Button, Card } from '@sakura-ui/core'

interface Project {
  id: number
  name: string
  description: string
  status: string
  user_role: string
  project_type: string
}

interface CSPAccount {
  id: number
  provider: 'aws' | 'gcp' | 'azure'
  account_name: string
  account_id: string
  access_key: string
  region: string
  status: string
  csp_request_id: number
  created_by: number
  created_at: string
  updated_at: string
}

interface ProjectCSPAccount {
  id: number
  project_id: number
  csp_account_id: number
  created_by: number
  created_at: string
  project?: Project
  csp_account?: CSPAccount
}

export default function ProjectCSPAccountsPage() {
  const router = useRouter()
  const { projectId } = router.query

  const [project, setProject] = useState<Project | null>(null)
  const [cspAccounts, setCSPAccounts] = useState<ProjectCSPAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // プロジェクト情報を取得
  const fetchProject = useCallback(async () => {
    if (!projectId) return

    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch project')
      }

      const data = await response.json()
      setProject(data)
    } catch (error) {
      console.error('Error fetching project:', error)
      setError('プロジェクト情報の取得に失敗しました')
    }
  }, [projectId])

  // CSPアカウント一覧を取得
  const fetchCSPAccounts = useCallback(async () => {
    if (!projectId) return

    try {
      const response = await fetch(
        `/api/project-csp-accounts?project_id=${projectId}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch CSP accounts')
      }

      const data = await response.json()
      setCSPAccounts(data.data || [])
    } catch (error) {
      console.error('Error fetching CSP accounts:', error)
      setError('CSPアカウント一覧の取得に失敗しました')
    }
  }, [projectId])

  useEffect(() => {
    if (projectId) {
      setLoading(true)
      Promise.all([fetchProject(), fetchCSPAccounts()]).finally(() =>
        setLoading(false)
      )
    }
  }, [projectId, fetchProject, fetchCSPAccounts])

  const getProviderDisplay = (provider: string) => {
    switch (provider) {
      case 'aws':
        return 'Amazon Web Services'
      case 'gcp':
        return 'Google Cloud Platform'
      case 'azure':
        return 'Microsoft Azure'
      default:
        return provider
    }
  }

  const getProviderBadge = (provider: string) => {
    const className =
      provider === 'aws'
        ? 'bg-orange-100 text-orange-800 border-orange-200'
        : provider === 'gcp'
          ? 'bg-blue-100 text-blue-800 border-blue-200'
          : provider === 'azure'
            ? 'bg-cyan-100 text-cyan-800 border-cyan-200'
            : 'bg-gray-100 text-gray-800 border-gray-200'

    const icon =
      provider === 'aws'
        ? 'cloud'
        : provider === 'gcp'
          ? 'cloud'
          : provider === 'azure'
            ? 'cloud'
            : 'cloud'

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${className}`}
      >
        <span className="material-symbols-outlined mr-1 text-xs">{icon}</span>
        {provider.toUpperCase()}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const className =
      status === 'active'
        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
        : status === 'provisioning'
          ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
          : status === 'inactive'
            ? 'bg-gray-100 text-gray-800 border-gray-200'
            : 'bg-red-100 text-red-800 border-red-200'

    const icon =
      status === 'active'
        ? 'check_circle'
        : status === 'provisioning'
          ? 'sync'
          : status === 'inactive'
            ? 'pause_circle'
            : 'error'

    const label =
      status === 'active'
        ? 'アクティブ'
        : status === 'provisioning'
          ? 'プロビジョニング中'
          : status === 'inactive'
            ? '非アクティブ'
            : 'エラー'

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${className}`}
      >
        <span className="material-symbols-outlined mr-1 text-sm">{icon}</span>
        {label}
      </span>
    )
  }

  // ベンダープロジェクトかどうかを判定
  const isVendorProject = project?.project_type === 'vendor'

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Card className="text-center p-8">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                CSPアカウント情報を読み込み中...
              </h2>
              <p className="text-gray-600 text-sm">しばらくお待ちください</p>
            </div>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <>
      <Head>
        <title>CSPアカウント一覧 - {project?.name || 'プロジェクト'}</title>
        <meta
          name="description"
          content={`${project?.name || 'プロジェクト'}のCSPアカウント一覧`}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* パンくずナビ・戻るボタン */}
          <div className="mb-6">
            <Link
              href={`/projects/${projectId}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              <span className="material-symbols-outlined mr-2 text-lg">
                arrow_back
              </span>
              プロジェクト詳細に戻る
            </Link>
          </div>

          {/* プロジェクト情報ヘッダー */}
          {project && (
            <Card className="mb-8 bg-gradient-to-r from-green-50 via-teal-50 to-blue-50 border-green-200">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 flex items-center">
                      <span className="material-symbols-outlined mr-3 text-green-600 text-3xl sm:text-4xl">
                        account_circle
                      </span>
                      {project.name} - CSPアカウント
                    </div>

                    <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                      {project.description || 'プロジェクトの説明がありません'}
                    </p>

                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border bg-blue-100 text-blue-800 border-blue-200">
                        <span className="material-symbols-outlined mr-1 text-sm">
                          {project.user_role === 'owner'
                            ? 'crown'
                            : project.user_role === 'admin'
                              ? 'admin_panel_settings'
                              : 'visibility'}
                        </span>
                        あなたの権限:{' '}
                        {project.user_role === 'owner'
                          ? 'オーナー'
                          : project.user_role === 'admin'
                            ? '管理者'
                            : project.user_role === 'viewer'
                              ? '閲覧者'
                              : project.user_role}
                      </span>
                    </div>
                  </div>

                  {/* アイコン */}
                  <div className="hidden lg:flex items-center justify-center">
                    <div className="bg-white bg-opacity-60 rounded-2xl p-6 shadow-sm border border-white border-opacity-60">
                      <span className="material-symbols-outlined text-green-600 text-6xl">
                        cloud_done
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* エラーメッセージ */}
          {error && (
            <Card className="mb-6 bg-red-50 border-l-4 border-l-red-500 border-red-200 shadow-md">
              <div className="flex items-start p-4">
                <div className="bg-red-100 rounded-full p-2 mr-3 flex-shrink-0">
                  <span className="material-symbols-outlined text-red-600 text-sm">
                    error
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {/* CSPアカウント一覧 */}
          {cspAccounts.length === 0 ? (
            <Card className="text-center py-16 border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
              <div className="max-w-md mx-auto">
                <div className="bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 text-3xl">
                    cloud_off
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  CSPアカウントがありません
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  このプロジェクトではまだCSP Provisioningが承認されていません。
                  <br />
                  新規申請を行うか、履歴を確認してください。
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {isVendorProject ? (
                    <Button
                      size="lg"
                      disabled
                      className="w-full sm:w-auto py-3 px-6 flex items-center justify-center rounded-lg opacity-50 cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined mr-2 leading-none no-underline">
                        cloud_off
                      </span>
                      <span className="leading-none">
                        ベンダープロジェクトでは利用不可
                      </span>
                    </Button>
                  ) : (
                    <Link
                      href={`/projects/${projectId}/csp-provisioning/new`}
                      className="no-underline hover:no-underline"
                    >
                      <Button
                        size="lg"
                        className="w-full sm:w-auto py-3 px-6 flex items-center justify-center rounded-lg"
                      >
                        <span className="material-symbols-outlined mr-2 leading-none no-underline">
                          add_circle
                        </span>
                        <span className="leading-none">
                          新規プロビジョニング申請
                        </span>
                      </Button>
                    </Link>
                  )}
                  <Link
                    href={`/projects/${projectId}/csp-provisioning`}
                    className="no-underline hover:no-underline"
                  >
                    {isVendorProject ? (
                      <Button
                        variant="secondary"
                        size="lg"
                        className="w-full sm:w-auto py-3 px-6 flex items-center justify-center rounded-lg"
                        disabled
                      >
                        <span className="material-symbols-outlined mr-2 leading-none no-underline">
                          history
                        </span>
                        <span className="leading-none">
                          ベンダープロジェクトでは利用不可
                        </span>
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="lg"
                        className="w-full sm:w-auto py-3 px-6 flex items-center justify-center rounded-lg"
                      >
                        <span className="material-symbols-outlined mr-2 leading-none no-underline">
                          history
                        </span>
                        <span className="leading-none">
                          プロビジョニング履歴を見る
                        </span>
                      </Button>
                    )}
                  </Link>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  承認されたプロビジョニングがここに表示されます
                </p>
              </div>
            </Card>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                  <span className="material-symbols-outlined mr-3 text-green-600">
                    cloud_done
                  </span>
                  CSPアカウント一覧
                  <span className="ml-3 bg-green-50 px-3 py-1 rounded-full text-sm font-medium text-green-800 border border-green-200">
                    {cspAccounts.length}件
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {cspAccounts.map((relation) => {
                  const account = relation.csp_account
                  if (!account) return null

                  return (
                    <Card
                      key={relation.id}
                      className="hover:shadow-lg transition-all duration-300 border border-gray-200 bg-gradient-to-br from-white via-blue-50 to-indigo-50"
                    >
                      <div className="p-6">
                        {/* ヘッダー */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-0">
                              {account.account_name}
                            </h3>
                            <div className="flex items-center gap-2">
                              {getProviderBadge(account.provider)}
                              {getStatusBadge(account.status)}
                            </div>
                          </div>
                          <div className="bg-green-100 rounded-full p-2 ml-4">
                            <span className="material-symbols-outlined text-green-600 text-lg">
                              cloud
                            </span>
                          </div>
                        </div>

                        {/* 詳細情報 */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              プロバイダー
                            </span>
                            <span className="text-sm text-gray-900">
                              {getProviderDisplay(account.provider)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              アカウントID
                            </span>
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {account.account_id}
                            </code>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              アクセスキー
                            </span>
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {account.access_key.slice(0, 8)}...
                            </code>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              リージョン
                            </span>
                            <span className="text-sm text-gray-900">
                              {account.region}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                              作成日
                            </span>
                            <span className="text-sm text-gray-900">
                              {new Date(account.created_at).toLocaleDateString(
                                'ja-JP'
                              )}
                            </span>
                          </div>
                        </div>

                        {/* アクション */}
                        <div className="pt-4 border-t border-gray-100">
                          <Link
                            href={`/projects/${projectId}/csp-accounts/${account.id}/members`}
                            className="no-underline hover:no-underline"
                          >
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-full justify-center py-3 px-6 flex items-center rounded-lg"
                            >
                              <span className="material-symbols-outlined mr-2 text-sm leading-none no-underline">
                                group
                              </span>
                              <span className="leading-none">
                                SSOユーザー管理
                              </span>
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {/* アクションボタン */}
              <Card className="bg-gradient-to-br from-white via-green-50 to-teal-50 border-gray-200 shadow-md">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="material-symbols-outlined mr-2 text-blue-600">
                      add_circle
                    </span>
                    新規申請・履歴確認
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {isVendorProject ? (
                      <Button
                        size="lg"
                        disabled
                        className="w-full sm:w-auto py-3 px-6 flex items-center justify-center rounded-lg opacity-50 cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined mr-2 leading-none no-underline">
                          cloud_off
                        </span>
                        <span className="leading-none">
                          ベンダープロジェクトでは利用不可
                        </span>
                      </Button>
                    ) : (
                      <Link
                        href={`/projects/${projectId}/csp-provisioning/new`}
                        className="no-underline hover:no-underline"
                      >
                        <Button className="w-full sm:w-auto h-12 rounded-lg font-medium flex items-center justify-center px-6" size="lg">
                          <span className="material-symbols-outlined mr-2 text-lg leading-none no-underline">
                            add_circle
                          </span>
                          <span className="leading-none">
                            新規プロビジョニング申請
                          </span>
                        </Button>
                      </Link>
                    )}
                    <Link
                      href={`/projects/${projectId}/csp-provisioning`}
                      className="no-underline hover:no-underline"
                    >
                      <Button
                        variant="secondary"
                        className="w-full sm:w-auto h-12 rounded-lg font-medium flex items-center justify-center px-6"
                      >
                        <span className="material-symbols-outlined mr-2 text-lg leading-none no-underline">
                          history
                        </span>
                        <span className="leading-none">
                          プロビジョニング履歴を見る
                        </span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </Layout>
    </>
  )
}
