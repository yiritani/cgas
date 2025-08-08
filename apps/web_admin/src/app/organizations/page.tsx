'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AdminLayout from '@/components/AdminLayout';

interface Organization {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  projectCount?: number;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // API URLを環境変数から取得（フォールバック付き）
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      
      // 認証が必要な場合は、まずログインしてトークンを取得
      const loginResponse = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'admin123'
        })
      });
      
      if (!loginResponse.ok) {
        throw new Error('認証に失敗しました');
      }
      
      const loginData = await loginResponse.json();
      const token = loginData.token;
      
      // 組織一覧を取得（認証ヘッダー付き）
      // 実際のAPIエンドポイントがない場合は、モックデータを使用
      try {
        const response = await fetch(`${apiUrl}/api/organizations`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data.organizations || data);
        } else {
          // APIエンドポイントが存在しない場合は、モックデータを使用
          throw new Error('組織API未実装');
        }
      } catch {
        console.log('組織APIが未実装のため、モックデータを表示します');
        // モックデータ
        const mockOrganizations: Organization[] = [
          {
            id: 1,
            name: 'Tech Division',
            description: '技術開発部門',
            status: 'active',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            projectCount: 8
          },
          {
            id: 2,
            name: 'Marketing Team',
            description: 'マーケティング部門',
            status: 'active',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            projectCount: 2
          },
          {
            id: 3,
            name: 'Research Lab',
            description: '研究開発ラボ',
            status: 'active',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            projectCount: 2
          },
          {
            id: 4,
            name: 'Business Development',
            description: 'ビジネス開発部門',
            status: 'active',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            projectCount: 0
          }
        ];
        setOrganizations(mockOrganizations);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '組織情報の取得に失敗しました');
      console.error('Error fetching organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

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
              <h2 className="text-3xl font-bold text-gray-900">組織管理</h2>
              <p className="mt-2 text-sm text-gray-600">システムに登録されている組織の管理</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              新規組織作成
            </button>
          </div>
        </div>

          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>エラー:</strong> {error}
            </div>
          )}

          {/* Organizations Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <div key={org.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {org.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">{org.name}</h3>
                        <p className="text-sm text-gray-500">ID: {org.id}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(org.status)}
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-gray-600 text-sm">{org.description}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">プロジェクト数:</span>
                      <span className="ml-1 font-semibold text-gray-900">
                        {org.projectCount || 0}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      作成: {formatDate(org.created_at)}
                    </div>
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md">
                      詳細表示
                    </button>
                    <button className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2 px-4 rounded-md">
                      編集
                    </button>
                    <button className="bg-white border border-red-300 hover:bg-red-50 text-red-600 text-sm font-medium py-2 px-3 rounded-md">
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {organizations.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto bg-gray-400 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">O</span>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">組織が見つかりません</h3>
              <p className="mt-2 text-sm text-gray-500">新しい組織を作成してください。</p>
              <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                組織を作成
              </button>
            </div>
          )}

          {/* Statistics */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">組織統計</h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-blue-600">
                    {organizations.filter(org => org.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">アクティブ組織</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-green-600">
                    {organizations.reduce((sum, org) => sum + (org.projectCount || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">総プロジェクト数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-purple-600">
                    {Math.round(organizations.reduce((sum, org) => sum + (org.projectCount || 0), 0) / organizations.length * 10) / 10}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">組織あたり平均プロジェクト数</div>
                </div>
              </div>
            </div>
          </div>
      </AdminLayout>
    </AuthGuard>
  );
}