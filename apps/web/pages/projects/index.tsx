import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import Layout from '../../components/Layout'
import AuthGuard from '../../components/AuthGuard'
import ProjectList from '../../components/ProjectList'
import Link from 'next/link'
import { Button, Card } from '@sakura-ui/core'

interface Project {
  project_id: number
  name: string
  description: string
  status: string
  role: string
  joined_at: string
}

export default function ProjectsIndex() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const { user } = useAuth()

  useEffect(() => {
    // AuthGuardでラップされているため、userは存在する前提
    if (user) {
      fetchProjects()
    }
  }, [user])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/projects/me', {
        credentials: 'include', // cookieを含める
      })

      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'プロジェクト一覧の取得に失敗しました')
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      setError('ネットワークエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>プロジェクト一覧 - Go + Next.js モノレポ</title>
        <meta name="description" content="参加しているプロジェクトの一覧" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AuthGuard
        promptTitle="プロジェクト一覧にアクセス"
        promptMessage="参加しているプロジェクトを確認するには\nログインまたは新規アカウント作成が必要です"
      >
        <Layout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* ヘッダーセクション */}
            <div className="mb-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                    <span className="material-symbols-outlined inline-block mr-3 text-blue-600 text-3xl sm:text-4xl align-middle">
                      folder_managed
                    </span>
                    プロジェクト一覧
                  </div>
                  <p className="text-lg text-gray-600">
                    あなたが参加しているプロジェクトを管理・確認できます
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-6 flex-shrink-0">
                  <Link href="/projects/new">
                    <Button
                      className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl px-6 bg-gradient-to-r from-blue-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105"
                      size="large"
                    >
                      <span className="material-symbols-outlined mr-2 text-base">
                        add_circle
                      </span>
                      新規プロジェクト作成
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            {/* ユーザー情報セクション */}
            <div className="mb-8">
              <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200">
                <div className="flex flex-col sm:flex-row p-6 sm:p-8 min-h-[120px]">
                  <div className="flex items-center justify-center sm:justify-start mb-4 sm:mb-0 sm:mr-6">
                    <div className="bg-white bg-opacity-60 rounded-full p-4 shadow-sm">
                      <span className="material-symbols-outlined text-blue-600 text-3xl block">
                        folder_managed
                      </span>
                    </div>
                  </div>
                  <div className="text-center sm:text-left flex-1 flex flex-col justify-center items-center sm:items-start">
                    <div className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                      ようこそ、{user?.name || 'ユーザー'}さん
                    </div>
                    <p className="text-gray-700 text-base sm:text-lg">
                      プロジェクトを効率的に管理しましょう 🚀
                    </p>
                  </div>
                  <div className="hidden md:flex items-center text-gray-600 mt-4 sm:mt-0">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {new Date().toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'long',
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date().toLocaleTimeString('ja-JP', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* エラー表示 */}
            {error && (
              <div className="mb-8">
                <Card className="bg-red-50 border-l-4 border-l-red-500 border-red-200">
                  <div className="flex items-start p-2">
                    <div className="bg-red-100 rounded-full p-2 mr-4 flex-shrink-0">
                      <span className="material-symbols-outlined text-red-600 text-xl">
                        error
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-semibold text-red-900 mb-2">
                        エラーが発生しました
                      </div>
                      <p className="text-red-800 mb-4">{error}</p>
                      <Button
                        onClick={fetchProjects}
                        size="small"
                        className="inline-flex items-center justify-center rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm transition-all duration-200 hover:shadow-md"
                      >
                        <span className="material-symbols-outlined mr-2 text-sm">
                          refresh
                        </span>
                        再試行
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* コンテンツ表示 */}
            {loading ? (
              <ProjectList projects={[]} loading={true} />
            ) : (
              <div>
                {/* 統計情報 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10">
                  <Card className="text-center hover:shadow-md transition-shadow duration-300 border-l-4 border-l-blue-500">
                    <div className="py-6">
                      <div className="bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <span className="material-symbols-outlined text-blue-600 text-2xl">
                          folder
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {projects.length}
                      </div>
                      <p className="text-gray-600 font-medium">
                        参加プロジェクト
                      </p>
                      <div className="mt-2 text-xs text-gray-500">
                        合計プロジェクト数
                      </div>
                    </div>
                  </Card>

                  <Card className="text-center hover:shadow-md transition-shadow duration-300 border-l-4 border-l-green-500">
                    <div className="py-6">
                      <div className="bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <span className="material-symbols-outlined text-green-600 text-2xl">
                          check_circle
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {projects.filter((p) => p.status === 'active').length}
                      </div>
                      <p className="text-gray-600 font-medium">アクティブ</p>
                      <div className="mt-2 text-xs text-gray-500">
                        稼働中のプロジェクト
                      </div>
                    </div>
                  </Card>

                  <Card className="text-center hover:shadow-md transition-shadow duration-300 border-l-4 border-l-purple-500">
                    <div className="py-6">
                      <div className="bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <span className="material-symbols-outlined text-purple-600 text-2xl">
                          admin_panel_settings
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {
                          projects.filter(
                            (p) => p.role === 'owner' || p.role === 'admin'
                          ).length
                        }
                      </div>
                      <p className="text-gray-600 font-medium">管理権限</p>
                      <div className="mt-2 text-xs text-gray-500">
                        オーナー・管理者
                      </div>
                    </div>
                  </Card>
                </div>

                {/* プロジェクト一覧セクション */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-2xl font-semibold text-gray-900">
                      <span className="material-symbols-outlined inline-block mr-2 text-gray-600">
                        view_module
                      </span>
                      プロジェクト
                    </div>
                    {projects.length > 0 && (
                      <div className="text-sm text-gray-500">
                        {projects.length} 件のプロジェクト
                      </div>
                    )}
                  </div>

                  <ProjectList projects={projects} loading={false} />
                </div>
              </div>
            )}
          </div>
        </Layout>
      </AuthGuard>
    </>
  )
}
