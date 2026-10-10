import { ArrowRightStartOnRectangleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline'
import { Button, Card, Spinner } from '@heroui/react'
import { signOut } from 'firebase/auth'
import { AppHeader } from '../../components/AppHeader'
import { LotStats } from '../../components/LotStats'
import { useAuth } from '../../hooks/useAuth'
import { useLot } from '../../hooks/useLot'
import { auth } from '../../lib/firebase'
import { HistoryCard } from './HistoryCard'
import { LoginPage } from './LoginPage'
import { SettingsCard } from './SettingsCard'

export function AdminPage() {
  const { user, isAdmin, loading } = useAuth()

  let content: React.ReactNode
  if (loading) {
    content = (
      <div className="flex justify-center p-16">
        <Spinner size="lg" />
      </div>
    )
  } else if (!user) {
    content = <LoginPage />
  } else if (!isAdmin) {
    content = (
      <Card className="mx-auto w-full max-w-md">
        <Card.Header>
          <ShieldExclamationIcon className="size-8 text-danger" />
          <Card.Title>Not authorized</Card.Title>
          <Card.Description>
            {user.email} is not an administrator. Ask the owner to add it to the <code>admins</code> collection.
          </Card.Description>
        </Card.Header>
        <Card.Footer>
          <Button variant="secondary" onPress={() => signOut(auth)}>
            Sign out
          </Button>
        </Card.Footer>
      </Card>
    )
  } else {
    content = <AdminDashboard email={user.email!} />
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-4 sm:py-6">
      <AppHeader
        actions={
          user && (
            <Button variant="ghost" size="sm" onPress={() => signOut(auth)}>
              <ArrowRightStartOnRectangleIcon className="size-5" />
              Sign out
            </Button>
          )
        }
      />
      {content}
    </main>
  )
}

function AdminDashboard({ email }: { email: string }) {
  const { settings, cars, loading } = useLot()

  if (loading) {
    return (
      <div className="flex justify-center p-16">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-sm text-muted">Signed in as {email}</p>
        </div>
        <LotStats capacity={settings.capacity} occupied={cars.filter((c) => c.spot <= settings.capacity).length} />
      </div>
      <SettingsCard
        key={JSON.stringify(settings)}
        settings={settings}
        occupied={cars.map((c) => c.spot)}
        adminEmail={email}
      />
      <HistoryCard />
    </div>
  )
}
