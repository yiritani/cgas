'use client';

import { useState, useEffect } from 'react';
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

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function CSPProvisioningPage() {
  const [requests, setRequests] = useState<CSPRequest[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Fetch CSP provisioning requests
  const fetchCSPRequests = async (page = 1, status = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (status) params.append('status', status);

      const response = await fetch(`/api/csp-requests?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('CSP Provisioningの取得に失敗しました');
      }

      const data = await response.json();
      setRequests(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCSPRequests(1, statusFilter);
  }, [statusFilter]);

  // Handle review (approve/reject)
  const handleReview = async (requestId: number, status: 'approved' | 'rejected', rejectReason?: string) => {
    try {
      const response = await fetch(`/api/csp-requests/${requestId}/review`, {
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
      fetchCSPRequests(pagination?.page || 1, statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  // Approve request
  const handleApprove = async (request: CSPRequest) => {
    if (!confirm(`${request.account_name} の申請を承認してもよろしいですか？`)) {
      return;
    }
    await handleReview(request.id, 'approved');
  };

  // Reject request
  const handleReject = async (request: CSPRequest) => {
    const reason = prompt('却下理由を入力してください:');
    if (!reason) return;

    await handleReview(request.id, 'rejected', reason);
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
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  // Provider display helper
  const getProviderDisplay = (provider: string) => {
    const providerMap = {
      aws: 'AWS',
      gcp: 'GCP',
      azure: 'Azure',
    };
    return providerMap[provider as keyof typeof providerMap] || provider;
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

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CSP Provisioning管理</h1>
        <p className="text-gray-600">クラウドサービス プロビジョニングの承認・却下を管理できます。</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
            ステータス
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">すべて</option>
            <option value="pending">プロビジョニング中</option>
            <option value="approved">承認済み</option>
            <option value="rejected">却下</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

              {/* CSP Provisioning Table */}
        <div className="bg-white shadow-sm rounded-lg border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">プロビジョニング一覧</h2>
          </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  依頼者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  プロジェクト
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  プロバイダー
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  アカウント名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  依頼日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.length === 0 ? (
                                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      CSP Provisioningがありません
                    </td>
                  </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {request.user ? request.user.name : `User ${request.user_id}`}
                        </div>
                        {request.user && (
                          <div className="text-gray-500 text-xs">{request.user.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.project ? request.project.name : `Project ${request.project_id}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getProviderDisplay(request.provider)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.account_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleDateString('ja-JP')}
                    </td>
                                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Link
                          href={`/csp-provisioning/${request.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          詳細
                        </Link>
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(request)}
                            className="text-green-600 hover:text-green-900"
                          >
                            承認
                          </button>
                          <button
                            onClick={() => handleReject(request)}
                            className="text-red-600 hover:text-red-900"
                          >
                            却下
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => pagination.hasPrev && fetchCSPRequests(pagination.page - 1, statusFilter)}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                前へ
              </button>
              <button
                onClick={() => pagination.hasNext && fetchCSPRequests(pagination.page + 1, statusFilter)}
                disabled={!pagination.hasNext}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                次へ
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{pagination.total}</span>件中{' '}
                  <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span>-
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>件を表示
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => pagination.hasPrev && fetchCSPRequests(pagination.page - 1, statusFilter)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    前へ
                  </button>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => fetchCSPRequests(page, statusFilter)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => pagination.hasNext && fetchCSPRequests(pagination.page + 1, statusFilter)}
                    disabled={!pagination.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    次へ
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-yellow-600">
            {requests.filter(r => r.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">プロビジョニング中</div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {requests.filter(r => r.status === 'approved').length}
          </div>
          <div className="text-sm text-gray-600">承認済み</div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-red-600">
            {requests.filter(r => r.status === 'rejected').length}
          </div>
          <div className="text-sm text-gray-600">却下</div>
        </div>
      </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}