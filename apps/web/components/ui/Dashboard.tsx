import { Card } from '@sakura-ui/core'
import Link from 'next/link'

interface User {
  name: string
  email: string
  role?: string
}

interface DashboardProps {
  user: User
}

const Dashboard = ({ user }: DashboardProps) => {
  return (
    <div>
      {/* ウェルカムセクション */}
      <div className="mb-12">
        <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200">
          <div className="flex flex-col sm:flex-row p-6 sm:p-8 min-h-[120px]">
            <div className="flex items-center justify-center sm:justify-start mb-4 sm:mb-0 sm:mr-6">
              <div className="bg-white bg-opacity-60 rounded-full p-4 shadow-sm">
                <span className="material-symbols-outlined text-blue-600 text-4xl block">
                  waving_hand
                </span>
              </div>
            </div>
            <div className="text-center sm:text-left flex-1 flex flex-col justify-center items-center sm:items-start">
              <div className="bg-opacity-80 rounded-2xl px-6 py-4">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  おかえりなさい、{user.name}さん！
                </div>
                <p className="text-gray-700 text-lg">
                  今日も素晴らしい一日にしましょう 🚀
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center text-gray-600 mt-4 sm:mt-0">
              <div className="text-right">
                <div className="text-sm font-medium">
                  {new Date().toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                  })}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date().toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* クイックアクションセクション */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Link href="/projects" className="no-underline">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <span className="material-symbols-outlined text-blue-600 text-4xl mb-4 block">
              folder_managed
            </span>
            <div className="text-lg font-semibold mb-2">プロジェクト一覧</div>
            <p className="text-gray-600 text-sm">参加中のプロジェクトを確認</p>
          </Card>
        </Link>

        <Link href="/projects/new" className="no-underline">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <span className="material-symbols-outlined text-green-600 text-4xl mb-4 block">
              add_circle
            </span>
            <div className="text-lg font-semibold mb-2">新規作成</div>
            <p className="text-gray-600 text-sm">新しいプロジェクトを開始</p>
          </Card>
        </Link>

        <Card className="text-center p-6">
          <span className="material-symbols-outlined text-gray-400 text-4xl mb-4 block">
            more_horiz
          </span>
          <div className="text-lg font-semibold mb-2">その他</div>
          <p className="text-gray-600 text-sm">準備中...</p>
        </Card>
      </div>

      {/* 最近のアクティビティ（プレースホルダ） */}
      <div className="mb-8">
        <div className="text-xl font-semibold text-gray-900 mb-4">
          <span className="material-symbols-outlined inline-block mr-2 text-gray-600">
            history
          </span>
          最近のアクティビティ
        </div>
        <Card className="p-6">
          <div className="text-center text-gray-500 py-8">
            <span className="material-symbols-outlined text-4xl mb-2 block">
              timeline
            </span>
            <p>アクティビティログは準備中です</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
