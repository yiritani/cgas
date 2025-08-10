import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Layout, SettingCard } from '../../../components'
import { useAuth } from '../../../contexts/AuthContext'
import { colorThemes } from '../../../components/ui/SettingCard'

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

export default function ProjectSettings() {
  const { user } = useAuth()
  const router = useRouter()
  const { projectId } = router.query
  const [project, setProject] = useState<ProjectDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!projectId) return

    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          setProject(data)
        } else {
          console.error('プロジェクトの取得に失敗しました')
        }
      } catch (error) {
        console.error('プロジェクトの取得中にエラーが発生しました:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

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

  if (!project) {
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

  const canManageProject =
    project.user_role === 'owner' || project.user_role === 'admin'

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* 戻るリンク */}
        <div className="mb-6">
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium"
          >
            <span className="material-symbols-outlined mr-2 text-lg">
              arrow_back
            </span>
            プロジェクトに戻る
          </Link>
        </div>

        {/* ヘッダー */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              プロジェクト設定
            </h1>
            <p className="text-gray-600">{project.name}</p>
          </div>
        </div>

        {/* 設定カード一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* プロジェクト基本情報 */}
          <SettingCard
            icon="info"
            title="基本情報"
            description="プロジェクトの名前や説明を変更"
            buttonText="編集（準備中）"
            buttonIcon="edit"
            disabled={true}
            colorTheme={colorThemes.blue}
          />

          {/* メンバー管理 */}
          <SettingCard
            icon="group"
            title="メンバー管理"
            description="プロジェクトメンバーの招待・削除"
            buttonText="メンバー招待（準備中）"
            buttonIcon="person_add"
            disabled={true}
            colorTheme={colorThemes.green}
          />

          {/* 事業者プロジェクト紐付け */}
          {project.project_type !== 'vendor' ? (
            <SettingCard
              icon="link"
              title="事業者プロジェクト紐付け"
              description="事業者プロジェクトとの紐付け管理"
              buttonText={canManageProject ? '紐付け管理' : '管理（権限なし）'}
              buttonIcon="business"
              disabled={!canManageProject}
              href={
                canManageProject
                  ? `/projects/${projectId}/vendor-relations`
                  : undefined
              }
              colorTheme={colorThemes.purple}
            />
          ) : (
            <SettingCard
              icon="link_off"
              title="事業者プロジェクト紐付け"
              description="事業者プロジェクトでは利用できません"
              buttonText="利用不可"
              buttonIcon="block"
              disabled={true}
              colorTheme={colorThemes.gray}
            />
          )}

          {/* 通知設定 */}
          <SettingCard
            icon="notifications"
            title="通知設定"
            description="メール通知の設定"
            buttonText="設定（準備中）"
            buttonIcon="construction"
            disabled={true}
            colorTheme={colorThemes.yellow}
          />

          {/* API設定 */}
          <SettingCard
            icon="api"
            title="API設定"
            description="API キーとWebhookの管理"
            buttonText="API管理（準備中）"
            buttonIcon="key"
            disabled={true}
            colorTheme={colorThemes.indigo}
          />

          {/* 危険な操作 */}
          <SettingCard
            icon="warning"
            title="危険な操作"
            description="プロジェクトの削除など"
            buttonText="プロジェクト削除（準備中）"
            buttonIcon="delete_forever"
            disabled={true}
            colorTheme={colorThemes.red}
          />
        </div>
      </div>
    </Layout>
  )
}
