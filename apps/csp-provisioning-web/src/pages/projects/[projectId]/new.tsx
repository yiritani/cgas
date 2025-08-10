import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import AuthGuard from '../../../components/AuthGuard'
import CSPProvisioningForm from '../../../components/CSPProvisioningForm'
import { useAuth } from '../../../contexts/AuthContext'

interface Project {
  id: number
  name: string
  description: string
  project_type: string
}

interface FormData {
  provider: string
  account_name: string
  reason: string
}

const NewCSPProvisioningPage = () => {
  const router = useRouter()
  const { projectId } = router.query
  const { authFetch } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState<FormData>({
    provider: '',
    account_name: '',
    reason: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          setError('プロジェクト情報を取得できませんでした。')
        })
    }
  }, [projectId, authFetch])

  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value } = e.target
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    },
    []
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError(null)

      try {
        const response = await authFetch('/api/csp-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project_id: parseInt(projectId as string),
            ...formData,
          }),
        })

        if (!response.ok) {
          const errorData = await response.text()
          throw new Error(errorData || 'CSP申請の作成に失敗しました')
        }

        router.push(`/projects/${projectId}`)
      } catch (error) {
        console.error('CSP申請作成エラー:', error)
        setError(
          error instanceof Error
            ? error.message
            : 'CSP申請の作成に失敗しました。もう一度お試しください。'
        )
      } finally {
        setLoading(false)
      }
    },
    [projectId, formData, router, authFetch]
  )

  if (!projectId) {
    return <Layout title="新規CSP申請">Loading...</Layout>
  }

  return (
    <AuthGuard>
      <Layout title={`新規CSP申請 - ${project?.name || 'Project'}`}>
        <div className="space-y-6">
          {/* ヘッダー */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-green-200 rounded-xl p-6">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center mb-2">
                <span className="material-symbols-outlined mr-3 text-green-600">
                  add_circle
                </span>
                新規CSP申請
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
          </div>

          {/* フォーム */}
          <CSPProvisioningForm
            projectId={projectId}
            project={project}
            formData={formData}
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
            onChange={handleInputChange}
            submitButtonText="申請を作成"
            cancelHref={`/projects/${projectId}`}
          />
        </div>
      </Layout>
    </AuthGuard>
  )
}

export default NewCSPProvisioningPage
