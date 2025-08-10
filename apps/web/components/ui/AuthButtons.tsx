import Link from 'next/link'
import { Button, Card } from '@sakura-ui/core'

interface AuthButtonsProps {
  showCard?: boolean
  className?: string
}

const AuthButtons = ({ showCard = true, className = '' }: AuthButtonsProps) => {
  const buttonsContent = (
    <div className={`flex flex-col sm:flex-row gap-4 ${className}`}>
      <Link href="/auth/register" className="flex-1">
        <Button className="w-full inline-flex items-center justify-center rounded-xl">
          <span className="material-symbols-outlined mr-2 text-sm">
            person_add
          </span>
          新規登録
        </Button>
      </Link>
      <Link href="/auth/login" className="flex-1">
        <Button
          variant="secondary"
          className="w-full inline-flex items-center justify-center rounded-xl"
        >
          <span className="material-symbols-outlined mr-2 text-sm">login</span>
          ログイン
        </Button>
      </Link>
    </div>
  )

  if (!showCard) {
    return buttonsContent
  }

  return (
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
        {buttonsContent}
      </Card>
    </div>
  )
}

export default AuthButtons
