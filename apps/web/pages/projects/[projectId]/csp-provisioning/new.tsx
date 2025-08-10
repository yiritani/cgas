import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../../../contexts/AuthContext'
import { Layout, CSPProvisioningForm } from '../../../../components'
import Link from 'next/link'
import { Button, Card } from '@sakura-ui/core'

interface Project {
  id: number
  name: string
  description: string
  status: string
  project_type: string
}

const NewCSPProvisioningPage = () => {
  const router = useRouter()
  const { projectId } = router.query
  const { user, authFetch } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({
    provider: '',
    account_name: '',
    reason: '',
  })

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.provider || !formData.account_name || !formData.reason) {
      setError('全ての項目を入力してください')
      return
    }

    if (!projectId) {
      setError('プロジェクトIDが不正です')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await authFetch('/api/csp-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: parseInt(projectId as string),
          provider: formData.provider,
          account_name: formData.account_name,
          reason: formData.reason,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.error || 'CSP Provisioningの作成に失敗しました'
        )
      }

      // Success - redirect to CSP provisioning list
      router.push(`/projects/${projectId}/csp-provisioning`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  if (error && !project) {
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
            <Link href="/projects">
              <Button className="w-full">
                <span className="material-symbols-outlined mr-2 text-sm">
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
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            <Link
              href={`/projects/${projectId}/csp-provisioning`}
              className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              CSP Provisioning
            </Link>
            <span className="material-symbols-outlined text-gray-400 text-sm">
              chevron_right
            </span>
            <span className="text-gray-900 font-medium">新規作成</span>
          </nav>
        </div>

        {/* ヘッダー */}
        <Card className="mb-8 bg-gradient-to-r from-green-50 via-blue-50 to-indigo-50 border-green-200">
          <div className="p-6 sm:p-8">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 rounded-full p-3 mr-4">
                <span className="material-symbols-outlined text-green-600 text-2xl">
                  add_circle
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-0">
                新規CSP Provisioning
              </h1>
            </div>
            <p className="text-gray-700 text-lg leading-relaxed">
              <span className="font-semibold text-green-600">
                {project?.name}
              </span>
              プロジェクト用のクラウドサービス プロビジョニングを依頼します。
            </p>
          </div>
        </Card>

        {/* フォーム */}
        <CSPProvisioningForm
          projectId={projectId}
          project={project}
          formData={formData}
          loading={loading}
          error={error}
          onSubmit={handleSubmit}
          onChange={handleChange}
          submitButtonText="プロビジョニング依頼"
          cancelHref={`/projects/${projectId}/csp-provisioning`}
        />

        {/* 情報ボックス */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="p-6 sm:p-8">
            <div className="flex items-start">
              <div className="bg-blue-100 rounded-full p-3 mr-4 flex-shrink-0">
                <span className="material-symbols-outlined text-blue-600 text-xl">
                  info
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-0">
                  プロビジョニングについて
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="material-symbols-outlined text-green-500 text-sm mr-3 mt-0.5">
                      task_alt
                    </span>
                    <p className="text-gray-700 text-sm">
                      依頼は管理者によってレビューされます
                    </p>
                  </div>
                  <div className="flex items-start">
                    <span className="material-symbols-outlined text-green-500 text-sm mr-3 mt-0.5">
                      task_alt
                    </span>
                    <p className="text-gray-700 text-sm">
                      承認されるとCSPアカウントが作成され、このプロジェクトに関連付けられます
                    </p>
                  </div>
                  <div className="flex items-start">
                    <span className="material-symbols-outlined text-blue-500 text-sm mr-3 mt-0.5">
                      edit
                    </span>
                    <p className="text-gray-700 text-sm">
                      プロビジョニング中の内容は、承認される前であれば編集可能です
                    </p>
                  </div>
                  <div className="flex items-start">
                    <span className="material-symbols-outlined text-orange-500 text-sm mr-3 mt-0.5">
                      refresh
                    </span>
                    <p className="text-gray-700 text-sm">
                      却下された場合は、理由を確認の上、再依頼が可能です
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  )
}

export default NewCSPProvisioningPage
