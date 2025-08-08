import Head from 'next/head'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../contexts/AuthContext'
import Layout from '../../../components/Layout'
import AuthGuard from '../../../components/AuthGuard'
import ProjectMembers, {
  ProjectMember,
  PaginationInfo,
  ProjectDetails,
} from '../../../components/ProjectMembers'
import QuickActions from '../../../components/QuickActions'
import Link from 'next/link'
import { H1, H2, H3, Button, Card } from '@sakura-ui/core'

export default function ProjectDetail() {
  const router = useRouter()
  const { projectId } = router.query
  const { user } = useAuth()

  const [project, setProject] = useState<ProjectDetails | null>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [membersLoading, setMembersLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [removingMember, setRemovingMember] = useState<number | null>(null)
  const [changingRole, setChangingRole] = useState<number | null>(null)

  const fetchProject = useCallback(async () => {
    if (!projectId) return

    // projectIdが数値でない場合（"new"など）は処理を停止
    if (isNaN(Number(projectId))) {
      setLoading(false)
      setError('無効なプロジェクトIDです')
      return
    }

    try {
      setLoading(true)
      setError('')
      const response = await fetch(`/api/projects/${projectId}`, {
        credentials: 'include', // cookieを含める
      })

      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'プロジェクトの取得に失敗しました')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      setError('ネットワークエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const fetchMembers = useCallback(
    async (page: number = 1) => {
      if (!projectId) return

      // projectIdが数値でない場合（"new"など）は処理を停止
      if (isNaN(Number(projectId))) {
        setMembersLoading(false)
        return
      }

      try {
        setMembersLoading(true)
        const response = await fetch(
          `/api/projects/${projectId}/members?page=${page}&limit=12`,
          {
            credentials: 'include', // cookieを含める
          }
        )

        if (response.ok) {
          const data = await response.json()
          setMembers(data.members || [])
          setPagination(data.pagination)
          setCurrentPage(page)
        } else {
          const errorData = await response.json()
          console.error('Failed to fetch members:', errorData.error)
        }
      } catch (error) {
        console.error('Error fetching members:', error)
      } finally {
        setMembersLoading(false)
      }
    },
    [projectId]
  )

  useEffect(() => {
    if (projectId && user) {
      fetchProject()
      fetchMembers(1)
    }
  }, [projectId, user, fetchProject, fetchMembers])

  const getRoleDisplay = (role: string) => {
    const roleMap: { [key: string]: string } = {
      owner: 'オーナー',
      admin: '管理者',
      viewer: '閲覧者',
    }
    return roleMap[role] || role
  }

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      active: 'アクティブ',
      inactive: '非アクティブ',
      archived: 'アーカイブ',
    }
    return statusMap[status] || status
  }

  const getRoleBadgeClass = (role: string) => {
    const roleClasses: { [key: string]: string } = {
      owner: 'bg-red-100 text-red-800 border-red-200',
      admin: 'bg-blue-100 text-blue-800 border-blue-200',
      viewer: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return roleClasses[role] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // 削除権限があるかチェック
  const canRemoveMembers = () => {
    if (!project) return false
    return project.user_role === 'owner' || project.user_role === 'admin'
  }

  // メンバー削除処理
  const removeMember = async (memberId: number, memberName: string) => {
    if (!projectId || isNaN(Number(projectId))) return

    const confirmed = window.confirm(
      `${memberName}さんをこのプロジェクトから削除しますか？`
    )
    if (!confirmed) return

    try {
      setRemovingMember(memberId)
      const response = await fetch(
        `/api/projects/${projectId}/members/${memberId}`,
        {
          method: 'DELETE',
          credentials: 'include', // cookieを含める
        }
      )

      if (response.ok) {
        // メンバーリストを再取得
        await fetchMembers(currentPage)
      } else {
        const errorData = await response.json()
        if (response.status === 400) {
          alert('最後のオーナーは削除できません')
        } else {
          alert(errorData.error || 'メンバーの削除に失敗しました')
        }
      }
    } catch (error) {
      console.error('Error removing member:', error)
      alert('ネットワークエラーが発生しました')
    } finally {
      setRemovingMember(null)
    }
  }

  // ロール変更処理
  const changeRole = async (
    memberId: number,
    memberName: string,
    newRole: string
  ) => {
    if (!projectId || isNaN(Number(projectId))) return

    const confirmed = window.confirm(
      `${memberName}さんのロールを「${getRoleDisplay(newRole)}」に変更しますか？`
    )
    if (!confirmed) return

    try {
      setChangingRole(memberId)
      const response = await fetch(
        `/api/projects/${projectId}/members/${memberId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // cookieを含める
          body: JSON.stringify({ role: newRole }),
        }
      )

      if (response.ok) {
        // メンバーリストを再取得
        await fetchMembers(currentPage)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'ロールの変更に失敗しました')
      }
    } catch (error) {
      console.error('Error changing role:', error)
      alert('ネットワークエラーが発生しました')
    } finally {
      setChangingRole(null)
    }
  }

  // 利用可能なロール一覧
  const availableRoles = [
    { value: 'owner', label: 'オーナー' },
    { value: 'admin', label: '管理者' },
    { value: 'viewer', label: '閲覧者' },
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Card className="text-center p-8">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <H2 className="text-lg font-semibold text-gray-900 mb-2">
                プロジェクトを読み込み中...
              </H2>
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
            <H2 className="text-xl font-semibold text-red-900 mb-3">
              エラーが発生しました
            </H2>
            <p className="text-red-800 mb-6 leading-relaxed">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={fetchProject}
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

  if (!project) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Card className="max-w-md w-full text-center p-8 border-2 border-dashed border-gray-200 bg-gray-50">
            <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <span className="material-symbols-outlined text-gray-600 text-2xl">
                folder_off
              </span>
            </div>
            <H2 className="text-xl font-semibold text-gray-900 mb-3">
              プロジェクトが見つかりません
            </H2>
            <p className="text-gray-600 mb-6">
              指定されたプロジェクトは存在しないか、
              <br />
              アクセス権限がありません
            </p>
            <Link href="/projects">
              <Button className="w-full" size="large">
                <span className="material-symbols-outlined mr-2">
                  arrow_back
                </span>
                プロジェクト一覧に戻る
              </Button>
            </Link>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <>
      <Head>
        <title>{project?.name || 'プロジェクト詳細'}</title>
        <meta
          name="description"
          content={
            project
              ? `${project.name}の詳細情報とメンバー一覧`
              : 'プロジェクトの詳細情報'
          }
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AuthGuard
        promptTitle="プロジェクト詳細の表示にはログインが必要です"
        promptMessage="プロジェクトの詳細情報を確認するには\nアカウントにログインしてください"
      >
        <Layout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* パンくずナビ・戻るボタン */}
            <div className="mb-6">
              <Link
                href="/projects"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium"
              >
                <span className="material-symbols-outlined mr-2 text-lg">
                  arrow_back
                </span>
                プロジェクト一覧に戻る
              </Link>
            </div>

            {/* プロジェクト情報ヘッダー */}
            <Card className="mb-8 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 flex items-center">
                      <span className="material-symbols-outlined mr-3 text-blue-600 text-3xl sm:text-4xl">
                        folder_managed
                      </span>
                      {project.name}
                    </div>

                    <div className="flex flex-wrap gap-3 mb-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border shadow-sm ${
                          project.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : project.status === 'inactive'
                              ? 'bg-orange-100 text-orange-800 border-orange-200'
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}
                      >
                        <span className="material-symbols-outlined mr-1 text-sm">
                          {project.status === 'active'
                            ? 'check_circle'
                            : project.status === 'inactive'
                              ? 'pause_circle'
                              : 'archive'}
                        </span>
                        {getStatusDisplay(project.status)}
                      </span>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border shadow-sm ${getRoleBadgeClass(project.user_role)}`}
                      >
                        <span className="material-symbols-outlined mr-1 text-sm">
                          {project.user_role === 'owner'
                            ? 'crown'
                            : project.user_role === 'admin'
                              ? 'admin_panel_settings'
                              : 'visibility'}
                        </span>
                        あなたの役割: {getRoleDisplay(project.user_role)}
                      </span>
                    </div>

                    <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                      {project.description || 'プロジェクトの説明がありません'}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="material-symbols-outlined mr-2 text-blue-500">
                          calendar_add_on
                        </span>
                        作成日:{' '}
                        {new Date(project.created_at).toLocaleDateString(
                          'ja-JP'
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="material-symbols-outlined mr-2 text-green-500">
                          update
                        </span>
                        更新日:{' '}
                        {new Date(project.updated_at).toLocaleDateString(
                          'ja-JP'
                        )}
                      </div>
                    </div>
                  </div>

                  {/* プロジェクトアイコン */}
                  <div className="hidden lg:flex items-center justify-center">
                    <div className="bg-white bg-opacity-60 rounded-2xl p-6 shadow-sm border border-white border-opacity-60">
                      <span className="material-symbols-outlined text-blue-600 text-6xl">
                        account_tree
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* プロジェクトアクション */}
            <QuickActions
              projectId={projectId}
              projectType={project.project_type}
            />

            {/* プロジェクトメンバーセクション */}
            <ProjectMembers
              members={members}
              pagination={pagination}
              membersLoading={membersLoading}
              user={user}
              removingMember={removingMember}
              changingRole={changingRole}
              currentPage={currentPage}
              canRemoveMembers={canRemoveMembers}
              removeMember={removeMember}
              changeRole={changeRole}
              fetchMembers={fetchMembers}
              getRoleDisplay={getRoleDisplay}
              getRoleBadgeClass={getRoleBadgeClass}
              availableRoles={availableRoles}
            />
          </div>
        </Layout>
      </AuthGuard>
    </>
  )
}
