import Link from 'next/link'
import { Button, Card } from '@sakura-ui/core'

interface ColorTheme {
  cardBg: string
  cardHover: string
  iconBg: string
  iconColor: string
}

interface SettingCardProps {
  icon: string
  title: string
  description: string
  buttonText: string
  buttonIcon: string
  disabled?: boolean
  href?: string
  onClick?: () => void
  colorTheme: ColorTheme
  loading?: boolean
  dangerous?: boolean
}

const colorThemes = {
  blue: {
    cardBg: 'bg-blue-50',
    cardHover: 'hover:border-blue-300',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  green: {
    cardBg: 'bg-green-50',
    cardHover: 'hover:border-green-300',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  purple: {
    cardBg: 'bg-purple-50',
    cardHover: 'hover:border-purple-300',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  yellow: {
    cardBg: 'bg-yellow-50',
    cardHover: 'hover:border-yellow-300',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
  indigo: {
    cardBg: 'bg-indigo-50',
    cardHover: 'hover:border-indigo-300',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  red: {
    cardBg: 'bg-red-50',
    cardHover: 'hover:border-red-300',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  gray: {
    cardBg: 'bg-gray-50',
    cardHover: '',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
  },
}

export default function SettingCard({
  icon,
  title,
  description,
  buttonText,
  buttonIcon,
  disabled = false,
  href,
  onClick,
  colorTheme,
  loading = false,
  dangerous = false,
}: SettingCardProps) {
  const baseCardClass = `hover:shadow-lg transition-all duration-300 border border-gray-200 ${colorTheme.cardHover} ${colorTheme.cardBg}`
  const disabledCardClass = disabled ? 'opacity-60' : ''

  const dangerousButtonClass =
    dangerous && !disabled ? 'bg-red-100 hover:bg-red-200 text-red-700' : ''

  const buttonContent = (
    <Button
      variant="secondary"
      className={`w-full h-10 rounded-lg font-medium flex items-center justify-center ${dangerousButtonClass}`}
      disabled={disabled}
      onClick={onClick}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600 mr-2"></div>
          {buttonText}
        </>
      ) : (
        <>
          <span className="material-symbols-outlined mr-2 text-lg">
            {buttonIcon}
          </span>
          {buttonText}
        </>
      )}
    </Button>
  )

  return (
    <Card className={`${baseCardClass} ${disabledCardClass}`}>
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className={`${colorTheme.iconBg} rounded-full p-3 mr-4`}>
            <span
              className={`material-symbols-outlined ${colorTheme.iconColor} text-xl`}
            >
              {icon}
            </span>
          </div>
          <div className="text-lg font-semibold text-gray-900">{title}</div>
        </div>
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
          {description}
        </p>
        <div className="flex flex-col gap-3">
          {href && !disabled ? (
            <Link href={href}>{buttonContent}</Link>
          ) : (
            buttonContent
          )}
        </div>
      </div>
    </Card>
  )
}

export { colorThemes }
export type { ColorTheme }
