import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { Button, Card } from '@sakura-ui/core'

interface Project {
  id: number
  name: string
  description: string
  project_type: string
}

const HomePage = () => {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects/me')
        if (!response.ok) {
          throw new Error('プロジェクトの取得に失敗しました')
        }
        const data = await response.json()
        setProjects(data.projects || [])
      } catch (error) {
        console.error('プロジェクト取得エラー:', error)
        setError(
          error instanceof Error ? error.message : 'エラーが発生しました'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const handleProjectSelect = (projectId: number) => {
    router.push(`/projects/${projectId}`)
  }

  if (loading) {
    return (
      <Layout title="CSP Provisioning">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">
            プロジェクトを読み込み中...
          </span>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="CSP Provisioning">
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200 rounded-xl p-8 mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-white bg-opacity-60 rounded-full p-4 shadow-sm">
                <span className="material-symbols-outlined text-blue-600 text-4xl block">
                  cloud
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              CSP Provisioning Management
            </h1>
            <p className="text-gray-700 max-w-2xl mx-auto text-lg">
              クラウドサービスプロバイダー（CSP）アカウントのプロビジョニング申請を管理します。
              プロジェクトを選択してCSP申請の作成・管理を開始してください。
            </p>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <Card className="bg-red-50 border-l-4 border-l-red-500 border-red-200">
            <div className="flex items-start p-4">
              <div className="bg-red-100 rounded-full p-2 mr-3 flex-shrink-0">
                <span className="material-symbols-outlined text-red-600 text-sm">
                  error
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-red-900 mb-1">
                  エラーが発生しました
                </h3>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* プロジェクト一覧 */}
        {projects.length === 0 && !error ? (
          <Card className="text-center p-8">
            <span className="material-symbols-outlined text-gray-400 text-6xl mb-4 block">
              folder_off
            </span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              参加中のプロジェクトがありません
            </h3>
            <p className="text-gray-600 mb-4">
              CSPプロビジョニングを利用するには、まずプロジェクトに参加する必要があります。
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-300 bg-blue-50 cursor-pointer"
                onClick={() => handleProjectSelect(project.id)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-blue-100 rounded-full p-3">
                      <span className="material-symbols-outlined text-blue-600 text-xl">
                        folder_managed
                      </span>
                    </div>
                    <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full font-medium">
                      {project.project_type}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {project.name}
                  </h3>

                  {project.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <Button
                      size="small"
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 inline-flex items-center"
                    >
                      <span className="material-symbols-outlined mr-1 text-sm leading-none">
                        arrow_forward
                      </span>
                      <span className="leading-none">選択</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* フッター */}
        <div className="text-center pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            CSP Provisioning Management System
          </p>
        </div>
      </div>
    </Layout>
  )
}

export default HomePage
