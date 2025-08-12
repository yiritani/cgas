import { H3, Button, Card } from '@sakura-ui/core'

export interface ProjectMember {
  user_id: number
  name: string
  email: string
  role: string
  joined_at: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface User {
  id: number
  name: string
  email: string
}

export interface ProjectDetails {
  id: number
  name: string
  description: string
  status: string
  project_type: string
  created_at: string
  updated_at: string
  user_role: string
}

interface ProjectMembersProps {
  members: ProjectMember[]
  pagination: PaginationInfo | null
  membersLoading: boolean
  user: User | null
  removingMember: number | null
  changingRole: number | null
  currentPage: number
  canRemoveMembers: () => boolean
  removeMember: (memberId: number, memberName: string) => Promise<void>
  changeRole: (
    memberId: number,
    memberName: string,
    newRole: string
  ) => Promise<void>
  fetchMembers: (page: number) => Promise<void>
  getRoleDisplay: (role: string) => string
  getRoleBadgeClass: (role: string) => string
  availableRoles: Array<{ value: string; label: string }>
}

export default function ProjectMembers({
  members,
  pagination,
  membersLoading,
  user,
  removingMember,
  changingRole,
  currentPage,
  canRemoveMembers,
  removeMember,
  changeRole,
  fetchMembers,
  getRoleDisplay,
  getRoleBadgeClass,
  availableRoles,
}: ProjectMembersProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
          <span className="material-symbols-outlined mr-3 text-purple-600">
            group
          </span>
          プロジェクトメンバー
        </h2>
        {pagination && (
          <div className="bg-purple-50 px-4 py-2 rounded-full border border-purple-200">
            <span className="text-purple-800 font-medium text-sm">
              <span className="material-symbols-outlined mr-1 text-sm align-middle">
                people
              </span>
              {pagination.total}人のメンバー
            </span>
          </div>
        )}
      </div>

      {membersLoading ? (
        <Card className="text-center p-8 bg-white">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600 mb-4"></div>
            <p className="text-gray-600">メンバー情報を読み込み中...</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
            {members.map((member) => (
              <Card
                key={member.user_id}
                className="hover:shadow-lg transition-all duration-300 border border-gray-200 bg-white"
              >
                <div className="p-6">
                  {/* メンバー情報 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center flex-1">
                      <div className="bg-purple-100 rounded-full p-3 mr-4 flex-shrink-0">
                        <span className="material-symbols-outlined text-purple-600 text-lg">
                          person
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-lg font-semibold text-gray-900 truncate">
                          {member.name}
                        </div>
                        <p className="text-gray-600 text-sm truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    {/* 現在のユーザーかどうかのバッジ */}
                    {user && member.user_id === user.id && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                        あなた
                      </span>
                    )}
                  </div>

                  {/* ロール表示・変更 */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getRoleBadgeClass(member.role)}`}
                      >
                        <span className="material-symbols-outlined mr-1 text-xs">
                          {member.role === 'owner'
                            ? 'crown'
                            : member.role === 'admin'
                              ? 'admin_panel_settings'
                              : member.role === 'developer'
                                ? 'code'
                                : 'visibility'}
                        </span>
                        {getRoleDisplay(member.role)}
                      </span>
                    </div>

                    {canRemoveMembers() &&
                      user &&
                      member.user_id !== user.id && (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            changeRole(
                              member.user_id,
                              member.name,
                              e.target.value
                            )
                          }
                          disabled={changingRole === member.user_id}
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          {availableRoles.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      )}
                  </div>

                  {/* 参加日・アクション */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="material-symbols-outlined mr-1 text-sm text-purple-500">
                        event
                      </span>
                      参加日:{' '}
                      {new Date(member.joined_at).toLocaleDateString('ja-JP')}
                    </div>

                    {canRemoveMembers() &&
                      user &&
                      member.user_id !== user.id && (
                        <Button
                          onClick={() =>
                            removeMember(member.user_id, member.name)
                          }
                          disabled={
                            removingMember === member.user_id ||
                            changingRole === member.user_id
                          }
                          variant="secondary"
                          size="sm"
                          className="bg-red-50 hover:bg-red-100 text-red-700"
                        >
                          {removingMember === member.user_id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-300 border-t-red-600 mr-1"></div>
                              削除中...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined mr-1 text-sm">
                                person_remove
                              </span>
                              削除
                            </>
                          )}
                        </Button>
                      )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* ページネーション */}
          {pagination && pagination.totalPages > 1 && (
            <Card className="p-4 bg-white">
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => fetchMembers(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  variant="secondary"
                  size="sm"
                >
                  <span className="material-symbols-outlined mr-1 text-sm">
                    chevron_left
                  </span>
                  前のページ
                </Button>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="material-symbols-outlined text-sm">
                    description
                  </span>
                  {currentPage} / {pagination.totalPages} ページ
                </div>

                <Button
                  onClick={() => fetchMembers(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  variant="secondary"
                  size="sm"
                >
                  次のページ
                  <span className="material-symbols-outlined ml-1 text-sm">
                    chevron_right
                  </span>
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
