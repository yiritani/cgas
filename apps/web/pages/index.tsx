import Head from 'next/head'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import Link from 'next/link'
import { Button, Card } from '@sakura-ui/core'

export default function Home() {
  const { user } = useAuth()

  return (
    <>
      <Head>
        <title>Go + Next.js モノレポ</title>
        <meta name="description" content="Go API と Next.js のモノレポ構成" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* ヒーローセクション */}
          <div className="text-center mb-16">
            <div className="text-5xl font-bold text-gray-900 mb-6">
              <span className="material-symbols-outlined inline-block mr-4 text-blue-600 text-5xl">
                dashboard
              </span>
              Go + Next.js モノレポ
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              モダンなフルスタック開発プラットフォーム
              <br />
              Go API と Next.js フロントエンドによる効率的なプロジェクト管理
            </p>
          </div>

          {!user ? (
            <div>
              {/* ログイン前の紹介セクション */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card className="text-center p-6">
                  <span className="material-symbols-outlined text-blue-600 text-4xl mb-4 block">
                    speed
                  </span>
                  <div className="text-lg font-semibold mb-2">高速・軽量</div>
                  <p className="text-gray-600 text-sm">
                    Go
                    APIによる高速なバックエンド処理とNext.jsの最適化されたフロントエンド
                  </p>
                </Card>

                <Card className="text-center p-6">
                  <span className="material-symbols-outlined text-green-600 text-4xl mb-4 block">
                    security
                  </span>
                  <div className="text-lg font-semibold mb-2">セキュア</div>
                  <p className="text-gray-600 text-sm">
                    JWTトークン認証とロールベースアクセス制御による安全な運用
                  </p>
                </Card>

                <Card className="text-center p-6">
                  <span className="material-symbols-outlined text-purple-600 text-4xl mb-4 block">
                    rocket_launch
                  </span>
                  <div className="text-lg font-semibold mb-2">スケーラブル</div>
                  <p className="text-gray-600 text-sm">
                    マイクロサービス指向のアーキテクチャで成長に対応
                  </p>
                </Card>
              </div>

              {/* ログインCTA */}
              <div className="flex justify-center">
                <Card className="max-w-lg w-full text-center p-8">
                  <span className="material-symbols-outlined mx-auto block text-blue-600 mb-6 text-6xl">
                    login
                  </span>
                  <div className="text-2xl font-semibold text-gray-900 mb-4">
                    今すぐ始めましょう
                  </div>
                  <p className="text-gray-600 mb-8">
                    アカウントを作成してプロジェクト管理を始めるか、
                    <br />
                    既存のアカウントでログインしてください。
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/auth/register" className="flex-1">
                      <Button className="w-full">
                        <span className="material-symbols-outlined mr-2 text-sm">
                          person_add
                        </span>
                        新規登録
                      </Button>
                    </Link>
                    <Link href="/auth/login" className="flex-1">
                      <Button variant="secondary" className="w-full">
                        <span className="material-symbols-outlined mr-2 text-sm">
                          login
                        </span>
                        ログイン
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
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
                <Link href="/projects">
                  <Card className="text-center p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <span className="material-symbols-outlined text-blue-600 text-4xl mb-4 block">
                      folder_managed
                    </span>
                    <div className="text-lg font-semibold mb-2">
                      プロジェクト一覧
                    </div>
                    <p className="text-gray-600 text-sm">
                      参加中のプロジェクトを確認
                    </p>
                  </Card>
                </Link>

                <Link href="/projects/new">
                  <Card className="text-center p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <span className="material-symbols-outlined text-green-600 text-4xl mb-4 block">
                      add_circle
                    </span>
                    <div className="text-lg font-semibold mb-2">新規作成</div>
                    <p className="text-gray-600 text-sm">
                      新しいプロジェクトを開始
                    </p>
                  </Card>
                </Link>

                <Link href="/sakura-test">
                  <Card className="text-center p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <span className="material-symbols-outlined text-pink-600 text-4xl mb-4 block">
                      palette
                    </span>
                    <div className="text-lg font-semibold mb-2">
                      UI コンポーネント
                    </div>
                    <p className="text-gray-600 text-sm">Sakura UIのデモ</p>
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
          )}
        </div>
      </Layout>
    </>
  )
}
