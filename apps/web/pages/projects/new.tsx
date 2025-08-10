import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { Layout, AuthGuard } from '../../components'
import Link from 'next/link'
import { Button, Card } from '@sakura-ui/core'

interface ProjectFormData {
  name: string
  description: string
  status: 'active' | 'inactive' | 'archived'
}

interface FormErrors {
  name?: string
  description?: string
  general?: string
}

export default function NewProject() {
  const router = useRouter()
  const { user } = useAuth()

  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    status: 'active',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  // フォームの入力処理
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // エラーをクリア
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  // バリデーション処理
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // プロジェクト名のバリデーション
    if (!formData.name.trim()) {
      newErrors.name = 'プロジェクト名は必須です'
    } else if (formData.name.length > 255) {
      newErrors.name = 'プロジェクト名は255文字以下で入力してください'
    }

    // 説明のバリデーション（任意だが、長さチェック）
    if (formData.description.length > 1000) {
      newErrors.description = '説明は1000文字以下で入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const requestData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        status: formData.status,
        organization_id: 1, // デフォルトでACME Corporation (ID: 1) を使用
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      })

      const data = await response.json()

      if (response.ok) {
        // 作成成功時は詳細ページにリダイレクト
        router.push(`/projects/${data.id}`)
      } else {
        setErrors({ general: data.error || 'プロジェクトの作成に失敗しました' })
      }
    } catch (error) {
      console.error('Error creating project:', error)
      setErrors({ general: 'ネットワークエラーが発生しました' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>新規プロジェクト作成 - Go + Next.js モノレポ</title>
        <meta name="description" content="新しいプロジェクトを作成する" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AuthGuard
        promptTitle="プロジェクト作成にはログインが必要です"
        promptMessage="新しいプロジェクトを作成するには\nアカウントにログインしてください"
      >
        <Layout>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

            {/* ヘッダーセクション */}
            <div className="mb-8">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="material-symbols-outlined mr-3 text-blue-600 text-3xl sm:text-4xl">
                  add_circle
                </span>
                新規プロジェクト作成
              </div>
              <p className="text-lg text-gray-600">
                新しいプロジェクトの情報を入力して、チームでの開発を始めましょう
              </p>
            </div>

            {/* エラー表示 */}
            {errors.general && (
              <div className="mb-6">
                <Card className="bg-red-50 border-l-4 border-l-red-500 border-red-200">
                  <div className="flex items-start p-4">
                    <div className="bg-red-100 rounded-full p-2 mr-4 flex-shrink-0">
                      <span className="material-symbols-outlined text-red-600 text-xl">
                        error
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-semibold text-red-900 mb-2">
                        エラーが発生しました
                      </div>
                      <p className="text-red-800">{errors.general}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* メインフォーム */}
            <Card className="mb-8">
              <div className="p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* プロジェクト名 */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      <span className="material-symbols-outlined mr-2 text-blue-600 text-sm align-middle">
                        folder_managed
                      </span>
                      プロジェクト名 *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="例: 新しいWebアプリケーション開発"
                      disabled={loading}
                      className={`w-full px-4 py-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        errors.name
                          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-blue-500'
                      } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="material-symbols-outlined mr-1 text-sm">
                          error
                        </span>
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* プロジェクト説明 */}
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      <span className="material-symbols-outlined mr-2 text-green-600 text-sm align-middle">
                        description
                      </span>
                      プロジェクト説明
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="プロジェクトの目的や概要を記載してください（任意）"
                      disabled={loading}
                      className={`w-full px-4 py-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-vertical ${
                        errors.description
                          ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:border-blue-500'
                      } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                    {errors.description && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="material-symbols-outlined mr-1 text-sm">
                          error
                        </span>
                        {errors.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      プロジェクトの詳細は後からでも変更できます
                    </p>
                  </div>

                  {/* プロジェクトステータス */}
                  <div>
                    <label
                      htmlFor="status"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      <span className="material-symbols-outlined mr-2 text-purple-600 text-sm align-middle">
                        toggle_on
                      </span>
                      初期ステータス
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      disabled={loading}
                      className={`w-full px-4 py-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                        loading
                          ? 'bg-gray-100 cursor-not-allowed'
                          : 'border-gray-300 focus:border-blue-500'
                      }`}
                    >
                      <option value="active">
                        アクティブ - すぐに開発を開始
                      </option>
                      <option value="inactive">
                        非アクティブ - 準備中・保留中
                      </option>
                      <option value="archived">
                        アーカイブ - 参考用・完了済み
                      </option>
                    </select>
                    <p className="mt-2 text-xs text-gray-500">
                      プロジェクトの開始時の状態を選択してください。後から変更可能です
                    </p>
                  </div>

                  {/* 送信ボタン */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                    <Button
                      type="submit"
                      disabled={loading}
                      size="large"
                      className="flex-1 sm:flex-initial bg-gradient-to-r from-blue-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center justify-center rounded-xl"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          作成中...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined mr-2 text-base">
                            rocket_launch
                          </span>
                          プロジェクトを作成
                        </>
                      )}
                    </Button>

                    <Link href="/projects">
                      <Button
                        type="button"
                        variant="secondary"
                        size="large"
                        disabled={loading}
                        className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl"
                      >
                        <span className="material-symbols-outlined mr-2 text-base">
                          cancel
                        </span>
                        キャンセル
                      </Button>
                    </Link>
                  </div>
                </form>
              </div>
            </Card>

            {/* ヘルプセクション */}
            <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200">
              <div className="p-6">
                <div className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="material-symbols-outlined mr-2 text-blue-600">
                    help
                  </span>
                  プロジェクト作成のヒント
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div className="flex items-start">
                    <span className="material-symbols-outlined mr-2 text-green-600 text-sm mt-0.5">
                      lightbulb
                    </span>
                    <div>
                      <strong>分かりやすい名前</strong>
                      <br />
                      チームメンバーが理解しやすい具体的な名前をつけましょう
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="material-symbols-outlined mr-2 text-purple-600 text-sm mt-0.5">
                      group
                    </span>
                    <div>
                      <strong>メンバー招待</strong>
                      <br />
                      プロジェクト作成後、チームメンバーを招待できます
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="material-symbols-outlined mr-2 text-orange-600 text-sm mt-0.5">
                      settings
                    </span>
                    <div>
                      <strong>後から編集可能</strong>
                      <br />
                      すべての設定は作成後に変更できるのでご安心ください
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="material-symbols-outlined mr-2 text-red-600 text-sm mt-0.5">
                      security
                    </span>
                    <div>
                      <strong>適切な権限設定</strong>
                      <br />
                      プロジェクトオーナーとして全ての権限を持ちます
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Layout>
      </AuthGuard>
    </>
  )
}
