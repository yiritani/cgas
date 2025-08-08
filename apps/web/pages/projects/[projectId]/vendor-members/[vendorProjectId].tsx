import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Button, Card } from '@sakura-ui/core'
import Layout from '../../../../components/Layout'
import { useAuth } from '../../../../contexts/AuthContext'
import ProjectMembers, {
  ProjectMember,
  PaginationInfo,
  User,
} from '../../../../components/ProjectMembers'

interface VendorProject {
  id: number
  name: string
  description: string
  project_type: string
  status: string
}

interface ProjectDetails {
  id: number
  name: string
  description: string
  status: string
  project_type: string
  created_at: string
  updated_at: string
  user_role: string
}

export default function VendorProjectMembers() {
  const { user } = useAuth()
  const router = useRouter()
  const { projectId, vendorProjectId } = router.query
  const [project, setProject] = useState<ProjectDetails | null>(null)
  const [vendorProject, setVendorProject] = useState<VendorProject | null>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [membersLoading, setMembersLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!projectId || !vendorProjectId || !user) return

    const fetchData = async () => {
      try {
        setLoading(true)

        // 元プロジェクト情報を取得
        const projectResponse = await fetch(`/api/projects/${projectId}`, {
          credentials: 'include',
        })

        if (projectResponse.ok) {
          const projectData = await projectResponse.json()
          setProject(projectData)
        }

        // ベンダープロジェクト情報を取得
        const vendorResponse = await fetch(`/api/projects/${vendorProjectId}`, {
          credentials: 'include',
        })

        if (vendorResponse.ok) {
          const vendorData = await vendorResponse.json()
          setVendorProject(vendorData)
        }

        // ベンダープロジェクトのメンバー一覧を取得
        fetchMembers(1)
      } catch (error) {
        console.error('データの取得中にエラーが発生しました:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [projectId, vendorProjectId, user])

  const fetchMembers = async (page: number = 1) => {
    if (!vendorProjectId) return

    try {
      setMembersLoading(true)
      const response = await fetch(
        `/api/projects/${vendorProjectId}/members?page=${page}&limit=12`,
        {
          credentials: 'include',
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
  }

  const getRoleDisplay = (role: string) => {
    const roleMap: { [key: string]: string } = {
      owner: 'オーナー',
      admin: '管理者',
      viewer: '閲覧者',
    }
    return roleMap[role] || role
  }

  const getRoleBadgeClass = (role: string) => {
    const roleClasses: { [key: string]: string } = {
      owner: 'bg-red-100 text-red-800 border-red-200',
      admin: 'bg-blue-100 text-blue-800 border-blue-200',
      viewer: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return roleClasses[role] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // 閲覧専用なので操作系の関数は空実装
  const canRemoveMembers = () => false
  const removeMember = async () => {}
  const changeRole = async () => {}
  const availableRoles: Array<{ value: string; label: string }> = []

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!project || !vendorProject) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">プロジェクトが見つかりません</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* 戻るリンク */}
        <div className="mb-6">
          <Link
            href={`/projects/${projectId}/vendor-relations`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium"
          >
            <span className="material-symbols-outlined mr-2 text-lg">
              arrow_back
            </span>
            紐付け管理に戻る
          </Link>
        </div>

        {/* ヘッダー */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              事業者プロジェクトメンバー
            </h1>
            <div className="text-gray-600">
              <p className="mb-1">
                <span className="font-medium">元プロジェクト:</span>{' '}
                {project.name}
              </p>
              <p>
                <span className="font-medium">事業者プロジェクト:</span>{' '}
                {vendorProject.name}
              </p>
            </div>
          </div>
        </div>

        {/* 注意事項 */}
        <Card className="mb-8 p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start">
            <span className="material-symbols-outlined text-blue-600 mr-3 mt-1">
              info
            </span>
            <div className="text-blue-800">
              <h3 className="font-semibold mb-2">閲覧専用</h3>
              <p className="text-sm">
                このページでは事業者プロジェクトのメンバー一覧を閲覧できますが、メンバーの追加・削除・ロール変更はできません。
              </p>
            </div>
          </div>
        </Card>

        {/* メンバー一覧 */}
        <ProjectMembers
          members={members}
          pagination={pagination}
          membersLoading={membersLoading}
          user={user}
          removingMember={null}
          changingRole={null}
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
  )
}
