'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import AdminLayout from '@/components/AdminLayout';

interface CSPRequest {
  id: number;
  project_id: number;
  user_id: number;
  provider: 'aws' | 'gcp' | 'azure';
  account_name: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: number;
  reviewed_at?: string;
  reject_reason?: string;
  created_at: string;
  updated_at: string;
  project?: {
    id: number;
    name: string;
    description: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
  reviewed_by_user?: {
    id: number;
    name: string;
    email: string;
  };
}

export default function CSPProvisioningDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  
  const [request, setRequest] = useState<CSPRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);

  // Fetch CSP provisioning details
  const fetchCSPRequest = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/csp-requests/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('CSP Provisioningが見つかりません');
        }
        throw new Error('CSP Provisioningの取得に失敗しました');
      }

      const data = await response.json();
      setRequest(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCSPRequest();
    }
  }, [id]);

  // Handle review (approve/reject)
  const handleReview = async (status: 'approved' | 'rejected', rejectReason?: string) => {
    if (!request) return;

    try {
      setReviewing(true);
      const response = await fetch(`/api/csp-requests/${request.id}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          reject_reason: rejectReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'レビューに失敗しました');
      }

      // Refresh data
      await fetchCSPRequest();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setReviewing(false);
    }
  };

  // Approve request
  const handleApprove = async () => {
    if (!request || !confirm(`${request.account_name} の申請を承認してもよろしいですか？`)) {
      return;
    }
    await handleReview('approved');
  };

  // Reject request
  const handleReject = async () => {
    if (!request) return;
    
    const reason = prompt('却下理由を入力してください:');
    if (!reason) return;

    await handleReview('rejected', reason);
  };

  // Status display helper
  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'プロビジョニング中', className: 'bg-yellow-100 text-yellow-800' },
      approved: { label: '承認済み', className: 'bg-green-100 text-green-800' },
      rejected: { label: '却下', className: 'bg-red-100 text-red-800' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { 
      label: status, 
      className: 'bg-gray-100 text-gray-800' 
    };
    
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  // Provider display helper
  const getProviderDisplay = (provider: string) => {
    const providerMap = {
      aws: 'Amazon Web Services (AWS)',
      gcp: 'Google Cloud Platform (GCP)',
      azure: 'Microsoft Azure',
    };
    return providerMap[provider as keyof typeof providerMap] || provider;
  };

  // Create CSP Account
  const handleCreateCSPAccount = () => {
    if (!request) return;
    router.push(`/csp-accounts/new?request_id=${request.id}`);
  };

  if (loading) {
    return (
      <AuthGuard>
        <AdminLayout>
          <div className="p-6">
            <div className="flex justify-center items-center min-h-64">
              <div className="text-lg">読み込み中...</div>
            </div>
          </div>
        </AdminLayout>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <AdminLayout>
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
            <div className="mt-4">
              <Link href="/csp-provisioning" className="text-blue-600 hover:text-blue-800">
                ← CSP Provisioning一覧に戻る
              </Link>
            </div>
          </div>
        </AdminLayout>
      </AuthGuard>
    );
  }

  if (!request) {
    return (
      <AuthGuard>
        <AdminLayout>
          <div className="p-6">
            <div className="text-center text-gray-500">
              CSP Provisioningが見つかりません
            </div>
            <div className="mt-4 text-center">
              <Link href="/csp-provisioning" className="text-blue-600 hover:text-blue-800">
                ← CSP Provisioning一覧に戻る
              </Link>
            </div>
          </div>
        </AdminLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="p-6">
              {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/csp-provisioning" className="text-blue-600 hover:text-blue-800">
              ← CSP Provisioning一覧に戻る
            </Link>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">CSP Provisioning詳細</h1>
              <p className="text-gray-600">プロビジョニングID: {request.id}</p>
            </div>
          <div className="flex gap-2">
            {request.status === 'pending' && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={reviewing}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reviewing ? '処理中...' : '承認'}
                </button>
                <button
                  onClick={handleReject}
                  disabled={reviewing}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reviewing ? '処理中...' : '却下'}
                </button>
              </>
            )}
            {request.status === 'approved' && (
              <button
                onClick={handleCreateCSPAccount}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                CSPアカウント作成
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Details */}
        <div className="lg:col-span-2">
                      <div className="bg-white shadow-sm rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">プロビジョニング内容</h2>
            
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">ステータス</dt>
                <dd className="mt-1">
                  {getStatusBadge(request.status)}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">クラウドプロバイダー</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {getProviderDisplay(request.provider)}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">アカウント名</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {request.account_name}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">プロジェクト</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {request.project ? (
                    <div>
                      <div className="font-medium">{request.project.name}</div>
                      {request.project.description && (
                        <div className="text-gray-600 text-xs">{request.project.description}</div>
                      )}
                    </div>
                  ) : (
                    `Project ${request.project_id}`
                  )}
                </dd>
              </div>

                              <div>
                  <dt className="text-sm font-medium text-gray-500">プロビジョニング理由</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                    {request.reason}
                  </dd>
                </div>
            </dl>
          </div>

          {/* Rejection Reason */}
          {request.status === 'rejected' && request.reject_reason && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-2">却下理由</h3>
              <p className="text-sm text-red-800 whitespace-pre-wrap">
                {request.reject_reason}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Request Info */}
                      <div className="bg-white shadow-sm rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">プロビジョニング情報</h3>
              
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">依頼者</dt>
                  <dd className="text-gray-900">
                    {request.user ? (
                      <div>
                        <div>{request.user.name}</div>
                        <div className="text-gray-600 text-xs">{request.user.email}</div>
                      </div>
                    ) : (
                      `User ${request.user_id}`
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="font-medium text-gray-500">依頼日時</dt>
                  <dd className="text-gray-900">
                    {new Date(request.created_at).toLocaleString('ja-JP')}
                  </dd>
                </div>

              {request.updated_at !== request.created_at && (
                <div>
                  <dt className="font-medium text-gray-500">更新日時</dt>
                  <dd className="text-gray-900">
                    {new Date(request.updated_at).toLocaleString('ja-JP')}
                  </dd>
                </div>
              )}

              {request.reviewed_at && (
                <div>
                  <dt className="font-medium text-gray-500">レビュー日時</dt>
                  <dd className="text-gray-900">
                    {new Date(request.reviewed_at).toLocaleString('ja-JP')}
                  </dd>
                </div>
              )}

              {request.reviewed_by_user && (
                <div>
                  <dt className="font-medium text-gray-500">レビューワー</dt>
                  <dd className="text-gray-900">
                    <div>{request.reviewed_by_user.name}</div>
                    <div className="text-gray-600 text-xs">{request.reviewed_by_user.email}</div>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Action Guide */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">レビューについて</h3>
              <div className="text-xs text-blue-800 space-y-1">
                <div><span className="font-medium">承認:</span> CSPアカウント作成が可能になります</div>
                <div><span className="font-medium">却下:</span> 依頼者に理由が通知されます</div>
                <div className="mt-2 text-blue-700">
                  承認後はCSPアカウント作成ボタンから実際のアカウントを作成してください。
                </div>
              </div>
            </div>
        </div>
      </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}