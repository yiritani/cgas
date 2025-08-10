import Link from 'next/link'
import { Card } from '@sakura-ui/core'

interface Project {
  project_id: number
  name: string
  description: string
  status: string
  role: string
  joined_at: string
}

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const getRoleDisplay = (role: string) => {
    const roleMap: { [key: string]: string } = {
      owner: 'オーナー',
      admin: '管理者',
      developer: '開発者',
      viewer: '閲覧者',
    }
    return roleMap[role] || role
  }

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: string } = {
      active: 'アクティブ',
      inactive: '非アクティブ',
      archived: 'アーカイブ',
    }
    return statusMap[status] || status
  }

  const getRoleBadgeColor = (role: string) => {
    const roleColors: { [key: string]: string } = {
      owner: 'bg-red-100 text-red-800 border-red-200',
      admin: 'bg-blue-100 text-blue-800 border-blue-200',
      developer: 'bg-green-100 text-green-800 border-green-200',
      viewer: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return roleColors[role] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusBadgeColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      inactive: 'bg-orange-100 text-orange-800 border-orange-200',
      archived: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <Link href={`/projects/${project.project_id}`} className="block group">
      <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 hover:border-blue-300 bg-white group-hover:scale-[1.02]">
        <div className="p-6">
          {/* ヘッダー */}
          <div className="flex justify-between items-start mb-4">
            <div className="text-xl font-bold text-gray-900 flex-1 mr-2 group-hover:text-blue-600 transition-colors">
              {project.name}
            </div>
            <div className="bg-blue-50 rounded-full p-2 group-hover:bg-blue-100 transition-colors">
              <span className="material-symbols-outlined text-blue-600 text-lg">
                chevron_right
              </span>
            </div>
          </div>

          {/* バッジ */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${getStatusBadgeColor(project.status)}`}
            >
              <span className="material-symbols-outlined mr-1 text-xs">
                {project.status === 'active'
                  ? 'check_circle'
                  : project.status === 'inactive'
                    ? 'pause_circle'
                    : 'archive'}
              </span>
              {getStatusDisplay(project.status)}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${getRoleBadgeColor(project.role)}`}
            >
              <span className="material-symbols-outlined mr-1 text-xs">
                {project.role === 'owner'
                  ? 'crown'
                  : project.role === 'admin'
                    ? 'admin_panel_settings'
                    : project.role === 'developer'
                      ? 'code'
                      : 'visibility'}
              </span>
              {getRoleDisplay(project.role)}
            </span>
          </div>

          {/* 説明 */}
          <p className="text-gray-600 text-sm mb-6 leading-relaxed min-h-[2.5rem]">
            {project.description || 'プロジェクトの説明がありません'}
          </p>

          {/* フッター */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
            <div className="flex items-center">
              <span className="material-symbols-outlined mr-2 text-sm text-blue-500">
                event
              </span>
              <span>
                参加日:{' '}
                {new Date(project.joined_at).toLocaleDateString('ja-JP')}
              </span>
            </div>
            <div className="text-blue-500 font-medium group-hover:text-blue-600 transition-colors">
              詳細を見る →
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
