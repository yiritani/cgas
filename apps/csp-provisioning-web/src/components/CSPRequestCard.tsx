import { Button, Card } from '@sakura-ui/core'
import Link from 'next/link'

interface CSPRequest {
  id: string
  project_id: number
  requested_by: string
  provider: string
  account_name: string
  reason: string
  status: string
  reviewed_by?: string
  reviewed_at?: string
  reject_reason?: string
  created_at: string
  updated_at: string
}

interface CSPRequestCardProps {
  request: CSPRequest
  projectId: string | string[] | undefined
}

export default function CSPRequestCard({
  request,
  projectId,
}: CSPRequestCardProps) {
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

    return (
      providerMap[provider as keyof typeof providerMap] || {
        name: provider,
        icon: 'cloud',
        color: 'text-gray-600 bg-gray-100',
      }
    )
  }

  // Status display helper
  const getStatusDisplay = (status: string) => {
    const statusMap = {
      pending: {
        text: '承認待ち',
        icon: 'schedule',
        color: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      },
      approved: {
        text: '承認済み',
        icon: 'check_circle',
        color: 'bg-green-50 text-green-800 border-green-200',
      },
      rejected: {
        text: '却下',
        icon: 'cancel',
        color: 'bg-red-50 text-red-800 border-red-200',
      },
    }

    return (
      statusMap[status as keyof typeof statusMap] || {
        text: status,
        icon: 'help',
        color: 'bg-gray-50 text-gray-800 border-gray-200',
      }
    )
  }

  // Date formatting helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const providerInfo = getProviderDisplay(request.provider)
  const statusInfo = getStatusDisplay(request.status)

  return (
    <Card className="hover:shadow-md transition-shadow rounded-lg">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className={`rounded-full p-2 ${providerInfo.color}`}>
                <span className="material-symbols-outlined text-sm">
                  {providerInfo.icon}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {request.account_name}
                </h3>
                <p className="text-sm text-gray-600">{providerInfo.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">申請者:</span>
                <span className="ml-2 text-gray-900">
                  {request.requested_by}
                </span>
              </div>
              <div>
                <span className="text-gray-500">申請日:</span>
                <span className="ml-2 text-gray-900">
                  {formatDate(request.created_at)}
                </span>
              </div>
              {request.reviewed_by && (
                <>
                  <div>
                    <span className="text-gray-500">承認者:</span>
                    <span className="ml-2 text-gray-900">
                      {request.reviewed_by}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">承認日:</span>
                    <span className="ml-2 text-gray-900">
                      {request.reviewed_at && formatDate(request.reviewed_at)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {request.reason && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 line-clamp-2">
                  {request.reason}
                </p>
              </div>
            )}

            {request.reject_reason && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  <span className="font-medium">却下理由: </span>
                  {request.reject_reason}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-3">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.color}`}
            >
              <span className="material-symbols-outlined mr-1 text-sm">
                {statusInfo.icon}
              </span>
              {statusInfo.text}
            </div>

            <div className="flex flex-col gap-2">
              <Link href={`/projects/${projectId}/${request.id}`}>
                <Button
                  variant="secondary"
                  size="small"
                  className="w-full px-3 py-1.5 inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined mr-1 text-sm leading-none">
                    visibility
                  </span>
                  <span className="leading-none">詳細</span>
                </Button>
              </Link>
              {request.status === 'pending' && (
                <Link href={`/projects/${projectId}/${request.id}/edit`}>
                  <Button
                    size="small"
                    className="w-full px-3 py-1.5 inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined mr-1 text-sm leading-none">
                      edit
                    </span>
                    <span className="leading-none">編集</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
