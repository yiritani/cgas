import Link from 'next/link'
import { Button, Card } from '@sakura-ui/core'

interface QuickActionsProps {
  projectId: string | string[] | undefined
  projectType?: string
}

export default function QuickActions({
  projectId,
  projectType,
}: QuickActionsProps) {
  console.log('projectType', projectType)
  const isVendorProject = projectType === 'vendor'
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
        <span className="material-symbols-outlined mr-3 text-indigo-600">
          dashboard
        </span>
        クイックアクション
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CSP Provisioning カード */}
        {isVendorProject ? (
          <Card className="border border-gray-200 bg-gray-50 opacity-60">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-gray-100 rounded-full p-3 mr-4">
                  <span className="material-symbols-outlined text-gray-600 text-xl">
                    cloud_off
                  </span>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  CSP Provisioning
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                ベンダープロジェクトではご利用いただけません
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  variant="secondary"
                  className="w-full justify-center"
                  disabled
                >
                  <span className="material-symbols-outlined mr-2 text-sm">
                    block
                  </span>
                  利用不可
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-blue-300 bg-blue-50">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 rounded-full p-3 mr-4">
                  <span className="material-symbols-outlined text-blue-600 text-xl">
                    cloud
                  </span>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  CSP Provisioning
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                クラウドサービス プロビジョニングの管理
              </p>
              <div className="flex flex-col gap-3">
                <Link href={`/projects/${projectId}/csp-provisioning`}>
                  <Button
                    variant="secondary"
                    className="w-full justify-center"
                    disabled={projectType === 'vendor'}
                  >
                    <span className="material-symbols-outlined mr-2 text-sm">
                      list
                    </span>
                    プロビジョニング一覧
                  </Button>
                </Link>
                <Link href={`/projects/${projectId}/csp-provisioning/new`}>
                  <Button
                    className="w-full justify-center"
                    disabled={projectType === 'vendor'}
                  >
                    <span className="material-symbols-outlined mr-2 text-sm">
                      add_circle
                    </span>
                    新規プロビジョニング
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* CSPアカウント カード */}
        <Card className="hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-green-300 bg-green-50">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 rounded-full p-3 mr-4">
                <span className="material-symbols-outlined text-green-600 text-xl">
                  account_circle
                </span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                CSPアカウント
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              承認済みのクラウドサービスアカウント
            </p>
            <div className="flex flex-col gap-3">
              <Link href={`/projects/${projectId}/csp-accounts`}>
                <Button variant="secondary" className="w-full justify-center">
                  <span className="material-symbols-outlined mr-2 text-sm">
                    folder_managed
                  </span>
                  CSPアカウント一覧
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* プロジェクト設定 カード */}
        <Card className="hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-orange-300 bg-orange-50">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="bg-orange-100 rounded-full p-3 mr-4">
                <span className="material-symbols-outlined text-orange-600 text-xl">
                  settings
                </span>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                プロジェクト設定
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              プロジェクトの設定を変更
            </p>
            <div className="flex flex-col gap-3">
              <Link href={`/projects/${projectId}/settings`}>
                <Button variant="secondary" className="w-full justify-center">
                  <span className="material-symbols-outlined mr-2 text-sm">
                    settings
                  </span>
                  設定を開く
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
