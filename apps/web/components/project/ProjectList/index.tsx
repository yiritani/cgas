import Link from 'next/link'
import { Button, Card } from '@sakura-ui/core'
import ProjectCard from '../ProjectCard'

interface Project {
  project_id: number
  name: string
  description: string
  status: string
  role: string
  joined_at: string
}

interface ProjectListProps {
  projects: Project[]
  loading?: boolean
}

export default function ProjectList({
  projects,
  loading = false,
}: ProjectListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Card className="text-center p-8 border-dashed border-2 border-gray-200 bg-gray-50">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
            <div className="text-lg font-semibold text-gray-900 mb-2">
              プロジェクトを読み込み中...
            </div>
            <p className="text-gray-600 text-sm">しばらくお待ちください</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {projects.length > 0 ? (
        projects.map((project) => (
          <ProjectCard key={project.project_id} project={project} />
        ))
      ) : (
        <div className="col-span-full">
          <Card className="text-center py-16 border-2 border-dashed border-gray-200 bg-gray-50">
            <div className="max-w-sm mx-auto">
              <div className="bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-600 text-3xl">
                  rocket_launch
                </span>
              </div>
              <div className="text-xl font-semibold text-gray-900 mb-3">
                最初のプロジェクトを作成しましょう
              </div>
              <p className="text-gray-600 mb-8 leading-relaxed">
                プロジェクトを作成して、チームでの開発を
                <br />
                効率的に管理しませんか？
              </p>
              <Link href="/projects/new">
                <Button size="lg" className="mx-auto">
                  <span className="material-symbols-outlined mr-2">
                    add_circle
                  </span>
                  最初のプロジェクトを作成
                </Button>
              </Link>
              <p className="text-xs text-gray-500 mt-4">数分で設定完了します</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
