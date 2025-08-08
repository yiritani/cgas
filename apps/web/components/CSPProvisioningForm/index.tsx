import { Button, Card } from '@sakura-ui/core'
import Link from 'next/link'

interface FormData {
  provider: string
  account_name: string
  reason: string
}

interface Project {
  id: number
  name: string
  description?: string
}

interface CSPProvisioningFormProps {
  projectId: string | string[] | undefined
  project: Project | null
  formData: FormData
  loading: boolean
  error: string | null
  isEdit?: boolean
  currentProvider?: string
  onSubmit: (e: React.FormEvent) => void
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void
  submitButtonText: string
  cancelHref: string
}

export default function CSPProvisioningForm({
  projectId,
  project,
  formData,
  loading,
  error,
  isEdit = false,
  currentProvider,
  onSubmit,
  onChange,
  submitButtonText,
  cancelHref,
}: CSPProvisioningFormProps) {
  // Provider display helper
  const getProviderDisplay = (provider: string) => {
    const providerMap = {
      aws: {
        name: 'Amazon Web Services (AWS)',
        icon: 'cloud',
        color: 'text-orange-600 bg-orange-100',
      },
      gcp: {
        name: 'Google Cloud Platform (GCP)',
        icon: 'cloud',
        color: 'text-blue-600 bg-blue-100',
      },
      azure: {
        name: 'Microsoft Azure',
        icon: 'cloud',
        color: 'text-indigo-600 bg-indigo-100',
      },
    }

    const providerInfo = providerMap[provider as keyof typeof providerMap] || {
      name: provider,
      icon: 'cloud',
      color: 'text-gray-600 bg-gray-100',
    }

    return (
      <div className="flex items-center">
        <div className={`rounded-full p-2 mr-3 ${providerInfo.color}`}>
          <span className="material-symbols-outlined text-sm">
            {providerInfo.icon}
          </span>
        </div>
        <span className="font-medium text-gray-900">{providerInfo.name}</span>
      </div>
    )
  }

  return (
    <>
      {/* エラーメッセージ */}
      {error && (
        <Card className="mb-6 bg-red-50 border-l-4 border-l-red-500 border-red-200">
          <div className="flex items-start p-4">
            <div className="bg-red-100 rounded-full p-2 mr-4 flex-shrink-0">
              <span className="material-symbols-outlined text-red-600 text-xl">
                error
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-red-900 mb-2 mt-0">
                エラー
              </h3>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* フォーム */}
      <Card className="mb-8">
        <div className="p-6 sm:p-8">
          <form onSubmit={onSubmit} className="space-y-8">
            {/* プロジェクト情報 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center mt-0">
                <span className="material-symbols-outlined mr-3 text-blue-600">
                  folder_managed
                </span>
                {isEdit
                  ? '編集対象プロジェクト'
                  : 'プロビジョニング対象プロジェクト'}
              </h2>
              <Card className="bg-blue-50 border-blue-200">
                <div className="p-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 rounded-full p-2 mr-3">
                      <span className="material-symbols-outlined text-blue-600 text-lg">
                        account_tree
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mt-0">
                        {project?.name || `Project ${projectId}`}
                      </h3>
                      {project?.description && (
                        <p className="text-gray-600 text-sm mt-1">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* プロバイダー表示/選択 */}
            {isEdit && currentProvider ? (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center mt-0">
                  <span className="material-symbols-outlined mr-3 text-orange-600">
                    cloud
                  </span>
                  現在のプロバイダー
                </h2>
                <Card className="bg-orange-50 border-orange-200">
                  <div className="p-4">
                    {getProviderDisplay(currentProvider)}
                    <p className="text-orange-700 text-sm mt-2 flex items-center">
                      <span className="material-symbols-outlined mr-1 text-sm">
                        lock
                      </span>
                      プロバイダーは編集時に変更できません
                    </p>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="space-y-2">
                <label
                  htmlFor="provider"
                  className="block text-sm font-semibold text-gray-900"
                >
                  クラウドプロバイダー <span className="text-red-500">*</span>
                </label>
                <select
                  id="provider"
                  name="provider"
                  value={formData.provider}
                  onChange={onChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">プロバイダーを選択してください</option>
                  <option value="aws">Amazon Web Services (AWS)</option>
                  <option value="gcp">Google Cloud Platform (GCP)</option>
                  <option value="azure">Microsoft Azure</option>
                </select>
              </div>
            )}

            {/* アカウント名 */}
            <div className="space-y-2">
              <label
                htmlFor="account_name"
                className="block text-sm font-semibold text-gray-900"
              >
                アカウント名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="account_name"
                name="account_name"
                value={formData.account_name}
                onChange={onChange}
                required
                placeholder="例: my-project-prod"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              <p className="text-sm text-gray-600 flex items-center">
                <span className="material-symbols-outlined mr-1 text-sm text-blue-500">
                  info
                </span>
                作成するCSPアカウントの識別名を入力してください
              </p>
            </div>

            {/* プロビジョニング理由 */}
            <div className="space-y-2">
              <label
                htmlFor="reason"
                className="block text-sm font-semibold text-gray-900"
              >
                プロビジョニング理由 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={onChange}
                required
                rows={4}
                placeholder="CSPアカウントが必要な理由や用途を詳しく記載してください"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 resize-none"
              />
              <p className="text-sm text-gray-600 flex items-center">
                <span className="material-symbols-outlined mr-1 text-sm text-green-500">
                  rate_review
                </span>
                管理者がレビューする際の参考となる情報を記載してください
              </p>
            </div>

            {/* アクションボタン */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <Link href={cancelHref} className="flex-1">
                <Button variant="secondary" className="w-full justify-center">
                  <span className="material-symbols-outlined mr-2 text-sm">
                    cancel
                  </span>
                  キャンセル
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    {isEdit ? '更新中...' : '作成中...'}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined mr-2 text-sm">
                      {isEdit ? 'save' : 'send'}
                    </span>
                    {submitButtonText}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </>
  )
}
