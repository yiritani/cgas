'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AdminLayout from '@/components/AdminLayout';

interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  organization: {
    id: number;
    name: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // BFF API経由でプロジェクト情報を取得
      const response = await fetch(`/api/projects?page=${page}&limit=10`, {
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'プロジェクト情報の取得に失敗しました');
      }
      
      setProjects(data.projects || []);
      
      // ページネーション情報があれば設定
      if (data.pagination) {
        setPagination(data.pagination);
      }
      
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロジェクト情報の取得に失敗しました');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(1);
  }, []);

  const handlePageChange = (page: number) => {
    fetchProjects(page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'active': { label: 'アクティブ', color: 'bg-green-100 text-green-800' },
      'inactive': { label: '非アクティブ', color: 'bg-red-100 text-red-800' },
      'completed': { label: '完了', color: 'bg-blue-100 text-blue-800' },
      'archived': { label: 'アーカイブ', color: 'bg-gray-100 text-gray-800' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <AdminLayout>
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">プロジェクト管理</h2>
              <p className="mt-2 text-sm text-gray-600">システムに登録されているプロジェクトの管理</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              新規プロジェクト作成
            </button>
          </div>
        </div>

          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>エラー:</strong> {error}
            </div>
          )}

          {/* Projects Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            プロジェクト名
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            説明
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            組織
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ステータス
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            作成日時
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {projects.map((project) => (
                          <tr key={project.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {project.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {project.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {project.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {project.organization?.name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {getStatusBadge(project.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(project.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button className="text-blue-600 hover:text-blue-900">
                                  詳細
                                </button>
                                <button className="text-green-600 hover:text-green-900">
                                  編集
                                </button>
                                <button className="text-red-600 hover:text-red-900">
                                  削除
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      pagination.hasPrev
                        ? 'text-gray-700 bg-white hover:bg-gray-50'
                        : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    }`}
                  >
                    前へ
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className={`relative ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      pagination.hasNext
                        ? 'text-gray-700 bg-white hover:bg-gray-50'
                        : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    }`}
                  >
                    次へ
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{pagination.total}</span> 件中{' '}
                      <span className="font-medium">{(currentPage - 1) * pagination.limit + 1}</span> -{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * pagination.limit, pagination.total)}
                      </span>{' '}
                      件を表示
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                          pagination.hasPrev
                            ? 'text-gray-500 bg-white hover:bg-gray-50'
                            : 'text-gray-300 bg-gray-100 cursor-not-allowed'
                        }`}
                      >
                        前へ
                      </button>
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        {currentPage} / {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                          pagination.hasNext
                            ? 'text-gray-500 bg-white hover:bg-gray-50'
                            : 'text-gray-300 bg-gray-100 cursor-not-allowed'
                        }`}
                      >
                        次へ
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
      </AdminLayout>
    </AuthGuard>
  );
}