'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useCallback, memo } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

// ナビゲーション配列をコンポーネント外に定義（再作成を防ぐ）
const navigation = [
  { name: 'ダッシュボード', href: '/' },
  { name: 'ユーザー管理', href: '/users' },
  { name: 'プロジェクト管理', href: '/projects' },
  { name: '組織管理', href: '/organizations' },
  { name: 'CSP Provisioning管理', href: '/csp-provisioning' },
  { name: 'CSPアカウント管理', href: '/csp-accounts' },
] as const;

// ナビゲーションアイテムコンポーネントをメモ化
const NavItem = memo(({ item, isActive }: { item: typeof navigation[number]; isActive: boolean }) => (
  <Link
    href={item.href}
    className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
      isActive
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    {item.name}
  </Link>
));

NavItem.displayName = 'NavItem';

function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // ログアウト関数をメモ化
  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">管理サイト</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {user?.name || '管理者'}
              </span>
              <button
                onClick={handleLogout}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Fixed Navigation */}
      <nav className="fixed top-16 left-0 right-0 bg-white shadow-sm z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <NavItem
                  key={item.name}
                  item={item}
                  isActive={isActive}
                />
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content with top padding to account for fixed header and nav */}
      <main className="max-w-7xl mx-auto pt-32 pb-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
}

// AdminLayout全体をメモ化してexport
export default memo(AdminLayout);