import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Button, Card } from '@sakura-ui/core'
import { Layout } from '../../../components'
import { useAuth } from '../../../contexts/AuthContext'

interface Project {
  id: number
  name: string
  description: string
  project_type: string
  status: string
}

interface VendorRelation {
  id: number
  project_id: number
  vendor_project_id: number
  created_at: string
  vendor_project: Project
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

export default function VendorRelations() {
  const { user } = useAuth()
  const router = useRouter()
  const { projectId } = router.query
  const [project, setProject] = useState<ProjectDetails | null>(null)
  const [vendorProjects, setVendorProjects] = useState<Project[]>([])
  const [vendorRelations, setVendorRelations] = useState<VendorRelation[]>([])
  const [loading, setLoading] = useState(true)
  const [addingRelation, setAddingRelation] = useState(false)
  const [removingRelation, setRemovingRelation] = useState<number | null>(null)

  useEffect(() => {
    if (!projectId) return

    const fetchData = async () => {
      try {
        setLoading(true)

        // プロジェクト情報を取得
        const projectResponse = await fetch(`/api/projects/${projectId}`, {
          credentials: 'include',
        })

        if (projectResponse.ok) {
          const projectData = await projectResponse.json()
          setProject(projectData)

          // 事業者プロジェクト以外の場合のみ紐付け情報を取得
          if (projectData.project_type !== 'vendor') {
            // 利用可能なベンダープロジェクト一覧を取得
            const vendorResponse = await fetch('/api/projects?type=vendor', {
              credentials: 'include',
            })

            if (vendorResponse.ok) {
              const vendorData = await vendorResponse.json()
              setVendorProjects(vendorData.projects || [])
            }

            // 現在の紐付け情報を取得
            const relationsResponse = await fetch(
              `/api/projects/${projectId}/vendor-relations`,
              {
                credentials: 'include',
              }
            )

            if (relationsResponse.ok) {
              const relationsData = await relationsResponse.json()
              setVendorRelations(relationsData || [])
            }
          }
        }
      } catch (error) {
        console.error('データの取得中にエラーが発生しました:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [projectId])

  const addVendorRelation = async (vendorProjectId: number) => {
    if (!projectId || addingRelation) return

    try {
      setAddingRelation(true)
      const response = await fetch(
        `/api/projects/${projectId}/vendor-relations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            vendor_project_id: vendorProjectId,
          }),
        }
      )

      if (response.ok) {
        // 紐付け情報を再取得
        const relationsResponse = await fetch(
          `/api/projects/${projectId}/vendor-relations`,
          {
            credentials: 'include',
          }
        )

        if (relationsResponse.ok) {
          const relationsData = await relationsResponse.json()
          setVendorRelations(relationsData || [])
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || '紐付けの追加に失敗しました')
      }
    } catch (error) {
      console.error('紐付け追加中にエラーが発生しました:', error)
      alert('ネットワークエラーが発生しました')
    } finally {
      setAddingRelation(false)
    }
  }

  const removeVendorRelation = async (
    relationId: number,
    vendorProjectName: string
  ) => {
    if (!projectId || removingRelation) return

    const confirmed = window.confirm(
      `「${vendorProjectName}」との紐付けを削除しますか？`
    )
    if (!confirmed) return

    try {
      setRemovingRelation(relationId)
      const response = await fetch(
        `/api/projects/${projectId}/vendor-relations/${relationId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (response.ok) {
        // 紐付け情報を再取得
        const relationsResponse = await fetch(
          `/api/projects/${projectId}/vendor-relations`,
          {
            credentials: 'include',
          }
        )

        if (relationsResponse.ok) {
          const relationsData = await relationsResponse.json()
          setVendorRelations(relationsData || [])
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || '紐付けの削除に失敗しました')
      }
    } catch (error) {
      console.error('紐付け削除中にエラーが発生しました:', error)
      alert('ネットワークエラーが発生しました')
    } finally {
      setRemovingRelation(null)
    }
  }

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

  if (project.project_type === 'vendor') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Card className="max-w-md mx-auto p-8 bg-red-50 border-red-200">
              <div className="bg-red-100 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-600 text-2xl">
                  block
                </span>
              </div>
              <h2 className="text-xl font-semibold text-red-900 mb-4">
                アクセス制限
              </h2>
              <p className="text-red-800 mb-6">
                事業者プロジェクトからは
                <br />
                この機能をご利用いただけません
              </p>
              <Link href={`/projects/${projectId}/settings`}>
                <Button className="w-full">
                  <span className="material-symbols-outlined mr-2">
                    arrow_back
                  </span>
                  設定に戻る
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </Layout>
    )
  }

  const canManageProject =
    project.user_role === 'owner' || project.user_role === 'admin'
  const availableVendorProjects = vendorProjects.filter(
    (vendor) =>
      !vendorRelations.some(
        (relation) => relation.vendor_project_id === vendor.id
      )
  )

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* 戻るリンク */}
        <div className="mb-6">
          <Link
            href={`/projects/${projectId}/settings`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium"
          >
            <span className="material-symbols-outlined mr-2 text-lg">
              arrow_back
            </span>
            設定に戻る
          </Link>
        </div>

        {/* ヘッダー */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              事業者プロジェクト紐付け
            </h1>
            <p className="text-gray-600">{project.name}</p>
          </div>
        </div>

        {/* 現在の紐付け */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <span className="material-symbols-outlined mr-3 text-purple-600">
              link
            </span>
            現在の紐付け
          </h2>

          {vendorRelations.length === 0 ? (
            <Card className="text-center p-8 bg-gray-50">
              <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-600 text-2xl">
                  link_off
                </span>
              </div>
              <p className="text-gray-600">
                まだ事業者プロジェクトとの紐付けがありません
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendorRelations.map((relation) => (
                <Card
                  key={relation.id}
                  className="hover:shadow-lg transition-all duration-300 border border-gray-200"
                >
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="bg-purple-100 rounded-full p-3 mr-4">
                        <span className="material-symbols-outlined text-purple-600 text-lg">
                          business
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-semibold text-gray-900">
                          {relation.vendor_project.name}
                        </div>
                        <p className="text-gray-600 text-sm">
                          {relation.vendor_project.description || '説明なし'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs text-gray-500">
                          紐付け日:{' '}
                          {new Date(relation.created_at).toLocaleDateString(
                            'ja-JP'
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/projects/${projectId}/vendor-members/${relation.vendor_project_id}`}
                          className="flex-1"
                        >
                          <Button
                            variant="secondary"
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 w-full h-10 rounded-lg font-medium flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined mr-2 text-lg">
                              group
                            </span>
                            メンバー
                          </Button>
                        </Link>

                        {canManageProject && (
                          <Button
                            onClick={() =>
                              removeVendorRelation(
                                relation.id,
                                relation.vendor_project.name
                              )
                            }
                            disabled={removingRelation === relation.id}
                            variant="secondary"
                            className="bg-red-50 hover:bg-red-100 text-red-700 h-10 rounded-lg font-medium flex items-center justify-center min-w-[80px]"
                          >
                            {removingRelation === relation.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-300 border-t-red-600 mr-2"></div>
                                削除中...
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined mr-2 text-lg">
                                  link_off
                                </span>
                                削除
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 新規紐付け */}
        {canManageProject && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="material-symbols-outlined mr-3 text-green-600">
                add_link
              </span>
              新規紐付け
            </h2>

            {availableVendorProjects.length === 0 ? (
              <Card className="text-center p-8 bg-gray-50">
                <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <span className="material-symbols-outlined text-gray-600 text-2xl">
                    block
                  </span>
                </div>
                <p className="text-gray-600">
                  紐付け可能な事業者プロジェクトがありません
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableVendorProjects.map((vendor) => (
                  <Card
                    key={vendor.id}
                    className="hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-green-300"
                  >
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="bg-green-100 rounded-full p-3 mr-4">
                          <span className="material-symbols-outlined text-green-600 text-lg">
                            business
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="text-lg font-semibold text-gray-900">
                            {vendor.name}
                          </div>
                          <p className="text-gray-600 text-sm">
                            {vendor.description || '説明なし'}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => addVendorRelation(vendor.id)}
                        disabled={addingRelation}
                        className="w-full h-10 rounded-lg font-medium flex items-center justify-center"
                      >
                        {addingRelation ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            紐付け中...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined mr-2 text-lg">
                              add_link
                            </span>
                            紐付ける
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {!canManageProject && (
          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-center">
              <span className="material-symbols-outlined text-yellow-600 mr-3">
                info
              </span>
              <p className="text-yellow-800">
                事業者プロジェクトの紐付けを追加・削除するには、オーナーまたは管理者権限が必要です。
              </p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}
