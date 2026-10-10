import { Cog6ToothIcon, TvIcon } from '@heroicons/react/24/outline'
import { buttonVariants } from '@heroui/react'
import { Link } from 'react-router'
import { AppHeader } from '../components/AppHeader'
import { LotScreen } from '../components/LotScreen'

export function MainPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-4 sm:py-6">
      <LotScreen
        header={(stats) => (
          <AppHeader
            actions={
              <>
                <Link to="/kiosk" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                  <TvIcon className="size-5" />
                  <span className="hidden sm:inline">Kiosk</span>
                </Link>
                <Link to="/admin" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                  <Cog6ToothIcon className="size-5" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              </>
            }
          >
            <div className="order-last w-full sm:order-none sm:w-auto">{stats}</div>
          </AppHeader>
        )}
      />
    </main>
  )
}
