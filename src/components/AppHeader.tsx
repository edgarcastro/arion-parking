import { Link } from 'react-router'

interface AppHeaderProps {
  children?: React.ReactNode
  actions?: React.ReactNode
}

export function AppHeader({ children, actions }: AppHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <Link to="/" className="flex items-center gap-2 text-foreground no-underline">
        <img src="/favicon.svg" alt="" className="size-9" />
        <span className="text-xl font-black tracking-tight">Arion Parking</span>
      </Link>
      {children}
      {actions && <nav className="flex items-center gap-2">{actions}</nav>}
    </header>
  )
}
