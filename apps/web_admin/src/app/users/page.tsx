'use client';

import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import AuthGuard from '@/components/AuthGuard';
import AdminLayout from '@/components/AdminLayout';

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// メモ化されたユーザー行コンポーネント
const UserRow = memo(({ user, formatDate }: { user: User; formatDate: (date: string) => string }) => (
  <tr className="hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      {user.id}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
      {user.name}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      {user.email}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {formatDate(user.created_at)}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {formatDate(user.updated_at)}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
      <div className="flex space-x-2">
        <button className="text-blue-600 hover:text-blue-900">
          編集
        </button>
        <button className="text-red-600 hover:text-red-900">
          削除
        </button>
      </div>
    </td>
  </tr>
));

UserRow.displayName = 'UserRow';

// メモ化された検索フィールドコンポーネント
const SearchField = memo(({ 
  searchTerm, 
  onSearchChange, 
  searchType, 
  onSearchTypeChange, 
  onSearchClear, 
  searching, 
  pagination 
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchType: 'all' | 'name' | 'email';
  onSearchTypeChange: (value: 'all' | 'name' | 'email') => void;
  onSearchClear: () => void;
  searching: boolean;
  pagination: Pagination | null;
}) => (
  <div className="mt-6 bg-white p-4 rounded-lg shadow">
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
          ユーザー検索
        </label>
        <div className="relative">
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="名前またはメールアドレスで検索..."
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {searching ? (
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            ) : (
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          {searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                onClick={onSearchClear}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="sm:w-48">
        <label htmlFor="searchType" className="block text-sm font-medium text-gray-700 mb-2">
          検索対象
        </label>
        <select
          id="searchType"
          value={searchType}
          onChange={(e) => onSearchTypeChange(e.target.value as 'all' | 'name' | 'email')}
          className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="all">すべて</option>
          <option value="name">名前</option>
          <option value="email">メールアドレス</option>
        </select>
      </div>
    </div>
    
    {/* 検索結果の件数表示 */}
    {pagination && (
      <div className="mt-3 text-sm text-gray-600">
        {searchTerm ? (
          <span>
            「<span className="font-medium">{searchTerm}</span>」の検索結果: {pagination.total}件
          </span>
        ) : (
          <span>総ユーザー数: {pagination.total}件</span>
        )}
      </div>
    )}
  </div>
));

SearchField.displayName = 'SearchField';

// メモ化されたページネーションコンポーネント
const PaginationControls = memo(({ 
  pagination, 
  currentPage, 
  onPageChange 
}: {
  pagination: Pagination;
  currentPage: number;
  onPageChange: (page: number) => void;
}) => (
  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
    <div className="flex-1 flex justify-between sm:hidden">
      <button
        onClick={() => onPageChange(currentPage - 1)}
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
        onClick={() => onPageChange(currentPage + 1)}
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
            onClick={() => onPageChange(currentPage - 1)}
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
            onClick={() => onPageChange(currentPage + 1)}
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
));

PaginationControls.displayName = 'PaginationControls';

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  // 検索関連のstate
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'name' | 'email'>('all');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // カスタムdebounce実装
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  const fetchUsers = useCallback(async (page: number = 1, search: string = '', type: string = 'all', isSearch: boolean = false) => {
    try {
      if (isSearch) {
        setSearching(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // 検索パラメータを構築
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      
      if (search.trim()) {
        searchParams.append('search', search.trim());
        searchParams.append('searchType', type);
      }
      
      // BFF API経由でユーザー情報を取得
      const response = await fetch(`/api/users?${searchParams.toString()}`, {
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'ユーザー情報の取得に失敗しました');
      }
      
      setUsers(data.users || []);
      
      // ページネーション情報があれば設定
      if (data.pagination) {
        setPagination(data.pagination);
      }
      
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザー情報の取得に失敗しました');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  // 初回読み込み
  useEffect(() => {
    fetchUsers(1, '', 'all');
  }, [fetchUsers]);

  // 検索語句が変わったときの処理
  useEffect(() => {
    if (loading) return; // 初回読み込み中は実行しない
    setCurrentPage(1); // 検索時は1ページ目に戻る
    fetchUsers(1, debouncedSearchTerm, searchType, true);
  }, [debouncedSearchTerm, searchType, fetchUsers, loading]);

  const handlePageChange = useCallback((page: number) => {
    fetchUsers(page, debouncedSearchTerm, searchType, !!debouncedSearchTerm);
  }, [fetchUsers, debouncedSearchTerm, searchType]);

  const handleSearchClear = useCallback(() => {
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleSearchTypeChange = useCallback((value: 'all' | 'name' | 'email') => {
    setSearchType(value);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // メモ化されたユーザーリスト
  const memoizedUsers = useMemo(() => users, [users]);
  
  // メモ化されたページネーション
  const memoizedPagination = useMemo(() => pagination, [pagination]);

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
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">ユーザー管理</h2>
              <p className="mt-2 text-sm text-gray-600">システムに登録されているユーザーの管理</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              新規ユーザー作成
            </button>
          </div>
          
          <SearchField
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            searchType={searchType}
            onSearchTypeChange={handleSearchTypeChange}
            onSearchClear={handleSearchClear}
            searching={searching}
            pagination={memoizedPagination}
          />
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>エラー:</strong> {error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className={`min-w-full divide-y divide-gray-300 ${searching ? 'opacity-70' : ''}`}>
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          名前
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          メールアドレス
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          作成日時
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          更新日時
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {memoizedUsers.map((user) => (
                        <UserRow key={user.id} user={user} formatDate={formatDate} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {memoizedPagination && (
            <PaginationControls
              pagination={memoizedPagination}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}

// メインコンポーネントをmemo化してexport
export default memo(UsersPage);