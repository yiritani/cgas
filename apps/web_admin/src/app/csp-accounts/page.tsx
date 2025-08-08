'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import AdminLayout from '@/components/AdminLayout';

interface CSPAccount {
  id: number;
  provider: 'aws' | 'gcp' | 'azure';
  account_name: string;
  account_id: string;
  access_key: string;
  region: string;
  status: string;
  csp_request_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  csp_request?: {
    id: number;
    project_id: number;
    user_id: number;
    reason: string;
    status: string;
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
  };
  created_by_user?: {
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

export default function CSPAccountsPage() {
  const [accounts, setAccounts] = useState<CSPAccount[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerFilter, setProviderFilter] = useState<string>('');

  // Fetch CSP accounts
  const fetchCSPAccounts = async (page = 1, provider = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (provider) params.append('provider', provider);

      const response = await fetch(`/api/csp-accounts?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('CSPアカウントの取得に失敗しました');
      }

      const data = await response.json();
      setAccounts(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCSPAccounts(1, providerFilter);
  }, [providerFilter]);

  // Handle delete
  const handleDelete = async (account: CSPAccount) => {
    if (!confirm(`${account.account_name} のCSPアカウントを削除してもよろしいですか？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/csp-accounts/${account.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '削除に失敗しました');
      }

      // Refresh data
      fetchCSPAccounts(pagination?.page || 1, providerFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
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

  // Status display helper
  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: 'アクティブ', className: 'bg-green-100 text-green-800' },
      inactive: { label: '非アクティブ', className: 'bg-gray-100 text-gray-800' },
      suspended: { label: '停止中', className: 'bg-red-100 text-red-800' },
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">CSPアカウント管理</h1>
            <p className="text-gray-600">プロビジョニングされたクラウドサービスアカウントを管理できます。</p>
          </div>

          {/* Filters */}
          <div className="mb-6 flex gap-4">
            <div>
              <label htmlFor="provider-filter" className="block text-sm font-medium text-gray-700 mb-1">
                プロバイダー
              </label>
              <select
                id="provider-filter"
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">すべて</option>
                <option value="aws">AWS</option>
                <option value="gcp">GCP</option>
                <option value="azure">Azure</option>
              </select>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* CSP Accounts Table */}
          <div className="bg-white shadow-sm rounded-lg border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">CSPアカウント一覧</h2>
            </div>
          
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      アカウント名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      プロバイダー
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      アカウントID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      リージョン
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      プロジェクト
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      作成者
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      作成日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                        CSPアカウントがありません
                      </td>
                    </tr>
                  ) : (
                    accounts.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {account.account_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getProviderDisplay(account.provider)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {account.account_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {account.region}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(account.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {account.csp_request?.project?.name || `Project ${account.csp_request?.project_id}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {account.created_by_user?.name || `User ${account.created_by}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(account.created_at).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Link
                            href={`/csp-accounts/${account.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            詳細
                          </Link>
                          <button
                            onClick={() => handleDelete(account)}
                            className="text-red-600 hover:text-red-900"
                          >
                            削除
                          </button>
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
                    onClick={() => pagination.hasPrev && fetchCSPAccounts(pagination.page - 1, providerFilter)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    前へ
                  </button>
                  <button
                    onClick={() => pagination.hasNext && fetchCSPAccounts(pagination.page + 1, providerFilter)}
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
                        onClick={() => pagination.hasPrev && fetchCSPAccounts(pagination.page - 1, providerFilter)}
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
                            onClick={() => fetchCSPAccounts(page, providerFilter)}
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
                        onClick={() => pagination.hasNext && fetchCSPAccounts(pagination.page + 1, providerFilter)}
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
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-blue-600">
                {accounts.length}
              </div>
              <div className="text-sm text-gray-600">総アカウント数</div>
            </div>
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {accounts.filter(a => a.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">アクティブ</div>
            </div>
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-orange-600">
                {accounts.filter(a => a.provider === 'aws').length}
              </div>
              <div className="text-sm text-gray-600">AWS</div>
            </div>
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="text-2xl font-bold text-purple-600">
                {accounts.filter(a => a.provider === 'gcp' || a.provider === 'azure').length}
              </div>
              <div className="text-sm text-gray-600">GCP/Azure</div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}