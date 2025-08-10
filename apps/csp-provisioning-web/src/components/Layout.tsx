import Head from 'next/head'
import { ReactNode } from 'react'
import Link from 'next/link'
import { Button } from '@sakura-ui/core'
import { useAuth } from '../contexts/AuthContext'

interface LayoutProps {
  children: ReactNode
  title?: string
}

const Layout = ({ children, title = 'CSP Provisioning' }: LayoutProps) => {
  const { user, goBack } = useAuth()

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="CSP Provisioning Management" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=optional"
          rel="stylesheet"
        />
      </Head>

      <div className="min-h-screen flex flex-col">
        {/* ヘッダー */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-8">
                <Link
                  href="/"
                  className="text-xl font-semibold text-white hover:text-blue-100 transition-colors"
                >
                  <span className="material-symbols-outlined inline-block mr-2 text-2xl align-middle">
                    cloud
                  </span>
                  CSP Provisioning
                </Link>
              </div>

              <div className="flex items-center gap-4">
                {user && (
                  <span className="hidden sm:block text-blue-100">
                    <span className="font-medium text-white">{user.name}</span>
                    さん
                  </span>
                )}
                <Button
                  variant="secondary"
                  onClick={goBack}
                  className="bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-30 rounded-xl inline-flex items-center justify-center px-3 py-2"
                >
                  <span className="material-symbols-outlined mr-2 text-sm leading-none">
                    home
                  </span>
                  <span className="leading-none">メインアプリに戻る</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="flex-1 pt-24 md:pt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>

        {/* フッター */}
        <footer className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center text-gray-600">
              <p>CSP Provisioning Management System - Powered by CGAS</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

export default Layout
