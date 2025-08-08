interface DemoAccountItemProps {
  role: string
  email: string
  password: string
  onSelect: (email: string, password: string) => void
}

export default function DemoAccountItem({
  role,
  email,
  password,
  onSelect,
}: DemoAccountItemProps) {
  const handleClick = () => {
    onSelect(email, password)
  }

  return (
    <div
      className="flex items-center justify-between p-2 bg-white rounded border cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={handleClick}
      title="クリックしてフォームに入力"
    >
      <div>
        <span className="font-medium text-gray-900">{role}</span>
        <div className="text-gray-600">{email}</div>
      </div>
      <code className="bg-gray-100 px-2 py-1 rounded text-xs">{password}</code>
    </div>
  )
}
