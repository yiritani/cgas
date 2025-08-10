import Head from 'next/head'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { RegisterForm } from '../../components'

export default function RegisterPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return <div>読み込み中...</div>
  }

  if (user) {
    return null // リダイレクト中
  }

  return (
    <>
      <Head>
        <title>新規登録 - Go + Next.js モノレポ</title>
        <meta name="description" content="新規登録ページ" />
      </Head>
      <RegisterForm />
    </>
  )
}
