import Head from 'next/head'
import { useAuth } from '../contexts/AuthContext'
import { Layout, AuthButtons, Dashboard } from '../components'

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
          {!user ? <AuthButtons /> : <Dashboard user={user} />}
        </div>
      </Layout>
    </>
  )
}
