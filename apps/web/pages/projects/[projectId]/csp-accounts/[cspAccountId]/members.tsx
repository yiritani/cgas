import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../../../../../components/Layout'
import { Button, Card } from '@sakura-ui/core'

// TypeScript interfaces
interface User {
  id: number
  username: string
  email: string
  name: string
  role: string
  status: string
  created_at?: string
  vendor_project_name?: string
  is_vendor_member?: boolean
}

interface CSPAccount {
  id: number
  account_name: string
  provider: string
  account_id: string
  access_key: string
  region: string
  status: string
  created_at: string
}

interface CSPAccountMember {
  id: number
  csp_account_id: number
  project_id: number
  user_id: number
  sso_enabled: boolean
  sso_provider: string
  sso_email: string
  role: string
  status: string
  created_at: string
  updated_at: string
  csp_account?: CSPAccount
  user?: User
}

interface CSPAccountMemberCreateRequest {
  csp_account_id: number
  project_id: number
  user_id: number
  sso_enabled: boolean
  sso_provider: string
  role: string
}

export default function CSPAccountMembers() {
  const router = useRouter()
  const { projectId, cspAccountId } = router.query

  const [cspAccount, setCSPAccount] = useState<CSPAccount | null>(null)
  const [cspMembers, setCSPMembers] = useState<CSPAccountMember[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [projectMembers, setProjectMembers] = useState<User[]>([])
  const [vendorProjectMembers, setVendorProjectMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [membersLoading, setMembersLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ユーザー追加モーダル用の状態
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [newMember, setNewMember] = useState<CSPAccountMemberCreateRequest>({
    csp_account_id: 0,
    project_id: 0,
    user_id: 0,
    sso_enabled: true,
    sso_provider: 'default',
    role: 'user',
  })

  // CSPアカウント情報を取得
  const fetchCSPAccount = useCallback(async () => {
    if (!projectId || !cspAccountId) return

    try {
      const response = await fetch(
        `/api/project-csp-accounts?project_id=${projectId}`
      )
      if (!response.ok) throw new Error('Failed to fetch CSP accounts')

      const data = await response.json()
      const account = data.data?.find(
        (rel: any) => rel.csp_account?.id === Number(cspAccountId)
      )
      if (account?.csp_account) {
        setCSPAccount(account.csp_account)
      } else {
        setError('CSPアカウントが見つかりません')
      }
    } catch (error) {
      console.error('Error fetching CSP account:', error)
      setError('CSPアカウント情報の取得に失敗しました')
    }
  }, [projectId, cspAccountId])

  // CSPメンバー一覧を取得
  const fetchCSPMembers = useCallback(async () => {
    if (!cspAccountId) return

    try {
      setMembersLoading(true)

      const response = await fetch(
        `/api/csp-account-members?csp_account_id=${cspAccountId}`,
        {
          credentials: 'include',
        }
      )

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: `HTTP ${response.status}` }))
        throw new Error(
          errorData.error || `Failed to fetch CSP members (${response.status})`
        )
      }

      const data = await response.json()
      setCSPMembers(data.data || [])
      setError('')
    } catch (error) {
      console.error('Error fetching CSP members:', error)
      setError(
        `CSPメンバーの取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`
      )
    } finally {
      setMembersLoading(false)
    }
  }, [cspAccountId])

  // ユーザー一覧を取得
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch users')

      const data = await response.json()
      setUsers(data.data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  // ベンダープロジェクトの関連を取得
  const fetchVendorRelations = useCallback(async () => {
    if (!projectId) return []

    try {
      const response = await fetch(
        `/api/projects/${projectId}/vendor-relations`
      )
      if (!response.ok) {
        console.log('No vendor relations found or access denied')
        return []
      }

      const data = await response.json()
      return data || []
    } catch (error) {
      console.error('Error fetching vendor relations:', error)
      return []
    }
  }, [projectId])

  // ベンダープロジェクトメンバーを取得
  const fetchVendorProjectMembers = useCallback(async () => {
    if (!projectId) return

    try {
      const vendorRelations = await fetchVendorRelations()

      if (vendorRelations.length === 0) {
        setVendorProjectMembers([])
        return
      }

      const allVendorMembers = []

      for (const relation of vendorRelations) {
        const vendorProjectId =
          relation.vendor_project_id || relation.vendor_project?.id
        if (!vendorProjectId) continue

        try {
          const response = await fetch(
            `/api/projects/${vendorProjectId}/members`
          )

          if (response.ok) {
            const data = await response.json()

            const members =
              data.members
                ?.map((member: any) => {
                  return {
                    id: member.user_id,
                    full_name:
                      member.name ||
                      member.full_name ||
                      `User ${member.user_id}`,
                    username:
                      member.name || member.username || `user${member.user_id}`,
                    email: member.email || 'no-email@example.com',
                    role: member.role || 'viewer',
                    status: 'active',
                    vendor_project_name:
                      relation.vendor_project?.name ||
                      `Project ${vendorProjectId}`,
                    is_vendor_member: true,
                  }
                })
                .filter(
                  (user: any) => user && user.id && user.full_name && user.email
                ) || []

            allVendorMembers.push(...members)
          }
        } catch (error) {
          console.error(
            `Error fetching vendor project ${vendorProjectId} members:`,
            error
          )
        }
      }

      // 重複するユーザーIDを除去（同じユーザーが複数のベンダープロジェクトに属している場合）
      const uniqueVendorMembers = allVendorMembers.filter(
        (member, index, self) =>
          self.findIndex((m) => m.id === member.id) === index
      )

      setVendorProjectMembers(uniqueVendorMembers)
    } catch (error) {
      setVendorProjectMembers([])
    }
  }, [projectId, fetchVendorRelations])

  // プロジェクトメンバー一覧を取得
  const fetchProjectMembers = useCallback(async () => {
    if (!projectId) return

    try {
      const response = await fetch(`/api/projects/${projectId}/members`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Project members API error:', response.status, errorText)
        throw new Error('Failed to fetch project members')
      }

      const data = await response.json()

      // プロジェクトメンバーからユーザー情報を抽出（nullやundefinedを除外）
      const members =
        data.members
          ?.map((member: any) => {
            return {
              id: member.user_id,
              full_name:
                member.name || member.full_name || `User ${member.user_id}`,
              username:
                member.name || member.username || `user${member.user_id}`,
              email: member.email || 'no-email@example.com',
              role: member.role || 'viewer',
              status: 'active',
              is_vendor_member: false,
            }
          })
          .filter(
            (user: any) => user && user.id && user.full_name && user.email
          ) || []
      setProjectMembers(members)
    } catch (error) {
      console.error('Error fetching project members:', error)
      // プロジェクトメンバーが取得できない場合は全ユーザーを取得
      fetchUsers()
    }
  }, [projectId])

  // SSOユーザーを追加
  const addCSPMember = async () => {
    if (!newMember.user_id) {
      setError('ユーザーを選択してください')
      return
    }

    try {
      setError('')
      setSuccess('')

      const response = await fetch('/api/csp-account-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newMember),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add CSP member')
      }

      setSuccess('SSOユーザーを追加しました')
      setShowAddMemberModal(false)
      setNewMember({
        csp_account_id: Number(cspAccountId),
        project_id: Number(projectId),
        user_id: 0,
        sso_enabled: true,
        sso_provider: 'default',
        role: 'user',
      })
      fetchCSPMembers()
    } catch (error) {
      console.error('Error adding CSP member:', error)
      setError(
        `ユーザーの追加に失敗しました: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  // SSOユーザーを削除
  const removeCSPMember = async (memberId: number) => {
    if (!confirm('このSSOユーザーを削除しますか？')) return

    try {
      setError('')
      setSuccess('')

      const response = await fetch(`/api/csp-account-members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      // レスポンステキストを取得してログ出力
      const responseText = await response.text()

      if (!response.ok) {
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch (parseError) {
          console.error('Failed to parse error response as JSON:', parseError)
          throw new Error(
            `HTTP ${response.status}: ${responseText.substring(0, 100)}`
          )
        }
        throw new Error(errorData.error || 'Failed to remove CSP member')
      }

      // 成功レスポンスもJSONとしてパース
      let successData
      try {
        successData = JSON.parse(responseText)
      } catch (parseError) {
        console.error('Success response is not JSON, but request succeeded')
      }

      setSuccess('SSOユーザーを削除しました')
      fetchCSPMembers()
    } catch (error) {
      console.error('Error removing CSP member:', error)
      setError(
        `ユーザーの削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  // ユーザー追加モーダルを開く
  const openAddMemberModal = () => {
    setNewMember({
      csp_account_id: Number(cspAccountId),
      project_id: Number(projectId),
      user_id: 0,
      sso_enabled: true,
      sso_provider: 'default',
      role: 'user',
    })
    setShowAddMemberModal(true)
  }

  useEffect(() => {
    if (projectId && cspAccountId) {
      setLoading(true)
      Promise.all([
        fetchCSPAccount(),
        fetchCSPMembers(),
        fetchProjectMembers(),
        fetchVendorProjectMembers(),
      ]).finally(() => setLoading(false))
    }
  }, [
    projectId,
    cspAccountId,
    fetchCSPAccount,
    fetchCSPMembers,
    fetchProjectMembers,
    fetchVendorProjectMembers,
  ])

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Card className="text-center p-8 bg-white">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <div className="text-lg font-semibold text-gray-900 mb-2">
                データを読み込み中...
              </div>
              <p className="text-gray-600 text-sm">しばらくお待ちください</p>
            </div>
          </Card>
        </div>
      </Layout>
    )
  }

  if (!cspAccount) {
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
              CSPアカウントが見つかりません
            </div>
            <p className="text-red-800 mb-6">
              指定されたCSPアカウントは存在しないか、
              <br />
              アクセス権限がありません
            </p>
            <Link href={`/projects/${projectId}/csp-accounts`}>
              <Button className="w-full inline-flex items-center justify-center rounded-xl py-3 px-6">
                <span className="material-symbols-outlined mr-2">
                  arrow_back
                </span>
                CSPアカウント一覧に戻る
              </Button>
            </Link>
          </Card>
        </div>
      </Layout>
    )
  }

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

  const getRoleBadge = (role: string) => {
    const className =
      role === 'admin'
        ? 'bg-purple-100 text-purple-800 border-purple-200'
        : 'bg-blue-100 text-blue-800 border-blue-200'

    const icon = role === 'admin' ? 'admin_panel_settings' : 'person'

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${className}`}
      >
        <span className="material-symbols-outlined mr-1 text-sm">{icon}</span>
        {role === 'admin' ? '管理者' : 'ユーザー'}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const className =
      status === 'active'
        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
        : status === 'inactive'
          ? 'bg-gray-100 text-gray-800 border-gray-200'
          : 'bg-red-100 text-red-800 border-red-200'

    const icon =
      status === 'active'
        ? 'check_circle'
        : status === 'inactive'
          ? 'pause_circle'
          : 'block'

    const label =
      status === 'active'
        ? 'アクティブ'
        : status === 'inactive'
          ? '非アクティブ'
          : '停止中'

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${className}`}
      >
        <span className="material-symbols-outlined mr-1 text-sm">{icon}</span>
        {label}
      </span>
    )
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* パンくずナビ・戻るボタン */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <Link
              href={`/projects/${projectId}`}
              className="hover:text-blue-600 transition-colors"
            >
              プロジェクト詳細
            </Link>
            <span className="material-symbols-outlined text-gray-400 text-lg">
              chevron_right
            </span>
            <Link
              href={`/projects/${projectId}/csp-accounts`}
              className="hover:text-blue-600 transition-colors"
            >
              CSPアカウント
            </Link>
            <span className="material-symbols-outlined text-gray-400 text-lg">
              chevron_right
            </span>
            <span className="text-gray-900 font-medium">SSOユーザー管理</span>
          </nav>
        </div>

        {/* ページヘッダー */}
        <Card className="mb-8 bg-gradient-to-r from-green-50 via-teal-50 to-blue-50 border-green-200 shadow-lg">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 flex items-center">
                  <span className="material-symbols-outlined mr-3 text-green-600 text-3xl sm:text-4xl">
                    group
                  </span>
                  SSOユーザー管理
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                  <div className="text-xl font-semibold text-gray-800">
                    {cspAccount.account_name}
                  </div>
                  {getProviderBadge(cspAccount.provider)}
                </div>

                <p className="text-gray-700 text-lg leading-relaxed">
                  CSPアカウントのSingle Sign-On（SSO）ユーザーを管理します
                </p>
              </div>

              {/* アイコン */}
              <div className="hidden lg:flex items-center justify-center">
                <div className="bg-white bg-opacity-60 rounded-2xl p-6 shadow-sm border border-white border-opacity-60">
                  <span className="material-symbols-outlined text-green-600 text-6xl">
                    admin_panel_settings
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* エラー・成功メッセージ */}
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
        {success && (
          <Card className="mb-6 bg-green-50 border-l-4 border-l-green-500 border-green-200 shadow-md">
            <div className="flex items-start p-4">
              <div className="bg-green-100 rounded-full p-2 mr-3 flex-shrink-0">
                <span className="material-symbols-outlined text-green-600 text-sm">
                  check_circle
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-green-800 text-sm">{success}</p>
              </div>
            </div>
          </Card>
        )}

        {/* アクションボタン */}
        <div className="mb-8">
          <Button
            onClick={openAddMemberModal}
            size="large"
            className="inline-flex items-center justify-center rounded-xl py-3 px-6"
          >
            <span className="material-symbols-outlined mr-2">person_add</span>
            SSOユーザーを追加
          </Button>
        </div>

        {/* SSOユーザー一覧 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="text-2xl font-semibold text-gray-900 flex items-center">
              <span className="material-symbols-outlined mr-3 text-blue-600">
                group
              </span>
              SSOユーザー一覧
            </div>
            {!membersLoading && cspMembers.length > 0 && (
              <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                <span className="text-blue-800 font-medium text-sm">
                  <span className="material-symbols-outlined mr-1 text-sm align-middle">
                    people
                  </span>
                  {cspMembers.length}人のユーザー
                </span>
              </div>
            )}
          </div>

          {membersLoading ? (
            <Card className="text-center p-8 bg-white">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
                <p className="text-gray-600">メンバー情報を読み込み中...</p>
              </div>
            </Card>
          ) : cspMembers.length === 0 ? (
            <Card className="text-center py-16 border-2 border-dashed border-gray-200 bg-white">
              <div className="max-w-md mx-auto">
                <div className="bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <span className="material-symbols-outlined text-blue-600 text-3xl">
                    person_off
                  </span>
                </div>
                <div className="text-xl font-semibold text-gray-900 mb-3">
                  SSOユーザーが登録されていません
                </div>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  CSPアカウントにアクセスするユーザーを
                  <br />
                  追加してください
                </p>
                <Button
                  onClick={openAddMemberModal}
                  size="large"
                  className="inline-flex items-center justify-center rounded-xl py-3 px-6"
                >
                  <span className="material-symbols-outlined mr-2">
                    person_add
                  </span>
                  最初のSSOユーザーを追加
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {cspMembers.map((member) => (
                <Card
                  key={member.id}
                  className="hover:shadow-lg transition-all duration-300 border border-gray-200 bg-white"
                >
                  <div className="p-6">
                    {/* メンバーヘッダー */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center flex-1">
                        <div className="bg-blue-100 rounded-full p-3 mr-4 flex-shrink-0">
                          <span className="material-symbols-outlined text-blue-600 text-lg">
                            person
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-lg font-semibold text-gray-900 truncate">
                            {member.user?.name ||
                              member.user?.username ||
                              `User ${member.user_id}`}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {getRoleBadge(member.role)}
                            {getStatusBadge(member.status)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* メンバー詳細 */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          メールアドレス
                        </span>
                        <span className="text-sm text-gray-900">
                          {member.user?.email || '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          SSOメール
                        </span>
                        <span className="text-sm text-gray-900">
                          {member.sso_email || '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          SSOプロバイダー
                        </span>
                        <span className="text-sm text-gray-900">
                          {member.sso_provider}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          SSO有効
                        </span>
                        <span
                          className={`text-sm font-medium ${member.sso_enabled ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {member.sso_enabled ? 'はい' : 'いいえ'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">
                          登録日
                        </span>
                        <span className="text-sm text-gray-900">
                          {new Date(member.created_at).toLocaleDateString(
                            'ja-JP'
                          )}
                        </span>
                      </div>
                    </div>

                    {/* アクション */}
                    <div className="pt-4 border-t border-gray-100">
                      <Button
                        onClick={() => removeCSPMember(member.id)}
                        variant="secondary"
                        size="small"
                        className="w-full bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300 inline-flex items-center justify-center rounded-xl py-2 px-4"
                      >
                        <span className="material-symbols-outlined mr-2 text-sm">
                          person_remove
                        </span>
                        削除
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ユーザー追加モーダル */}
        {showAddMemberModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddMemberModal(false)}
          >
            <Card
              className="w-full max-w-md bg-white max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* モーダルヘッダー */}
                <div className="flex items-center justify-between mb-6">
                  <div className="text-xl font-semibold text-gray-900">
                    SSOユーザーを追加
                  </div>
                  <button
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    onClick={() => setShowAddMemberModal(false)}
                  >
                    <span className="material-symbols-outlined text-2xl">
                      close
                    </span>
                  </button>
                </div>

                {/* フォーム */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="material-symbols-outlined mr-1 text-sm align-middle">
                        person
                      </span>
                      ユーザー
                    </label>
                    <select
                      value={newMember.user_id}
                      onChange={(e) =>
                        setNewMember({
                          ...newMember,
                          user_id: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={0}>ユーザーを選択してください</option>

                      {/* プロジェクトメンバー */}
                      {projectMembers.length > 0 && (
                        <optgroup label="プロジェクトメンバー">
                          {projectMembers
                            .filter(
                              (user) =>
                                user &&
                                user.id &&
                                !cspMembers.some(
                                  (member) => member.user_id === user.id
                                )
                            )
                            .map((user) => (
                              <option
                                key={`project-${user.id}`}
                                value={user.id}
                              >
                                {user.name} ({user.email})
                              </option>
                            ))}
                        </optgroup>
                      )}

                      {/* 事業者プロジェクトメンバー */}
                      {vendorProjectMembers.length > 0 && (
                        <optgroup label="事業者プロジェクトメンバー">
                          {vendorProjectMembers
                            .filter(
                              (user) =>
                                user &&
                                user.id &&
                                !cspMembers.some(
                                  (member) => member.user_id === user.id
                                ) &&
                                !projectMembers.some(
                                  (member) => member.id === user.id
                                )
                            )
                            .map((user) => (
                              <option key={`vendor-${user.id}`} value={user.id}>
                                {user.name} ({user.email})
                                {user.vendor_project_name &&
                                  ` - ${user.vendor_project_name}`}
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="material-symbols-outlined mr-1 text-sm align-middle">
                        admin_panel_settings
                      </span>
                      ロール
                    </label>
                    <select
                      value={newMember.role}
                      onChange={(e) =>
                        setNewMember({ ...newMember, role: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="user">ユーザー</option>
                      <option value="admin">管理者</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="material-symbols-outlined mr-1 text-sm align-middle">
                        security
                      </span>
                      SSOプロバイダー
                    </label>
                    <select
                      value={newMember.sso_provider}
                      onChange={(e) =>
                        setNewMember({
                          ...newMember,
                          sso_provider: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="default">デフォルト</option>
                      <option value="google">Google</option>
                      <option value="azure">Azure AD</option>
                      <option value="okta">Okta</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newMember.sso_enabled}
                        onChange={(e) =>
                          setNewMember({
                            ...newMember,
                            sso_enabled: e.target.checked,
                          })
                        }
                        className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        <span className="material-symbols-outlined mr-1 text-sm align-middle">
                          toggle_on
                        </span>
                        SSO有効
                      </span>
                    </label>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={addCSPMember}
                      className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl py-3 px-6"
                      size="large"
                    >
                      <span className="material-symbols-outlined mr-2">
                        person_add
                      </span>
                      追加
                    </Button>
                    <Button
                      onClick={() => setShowAddMemberModal(false)}
                      variant="secondary"
                      className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl py-3 px-6"
                      size="large"
                    >
                      <span className="material-symbols-outlined mr-2">
                        close
                      </span>
                      キャンセル
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}
