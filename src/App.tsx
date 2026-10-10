import { Toast } from '@heroui/react'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { isFirebaseConfigured } from './lib/firebase'
import { KioskPage } from './pages/KioskPage'
import { MainPage } from './pages/MainPage'

// Admin pulls in Auth and the table; keep it out of the public bundle.
const AdminPage = lazy(() => import('./pages/admin/AdminPage').then((m) => ({ default: m.AdminPage })))

export function App() {
  return (
    <BrowserRouter>
      {!isFirebaseConfigured && (
        <div role="alert" className="bg-warning p-2 text-center text-sm text-warning-foreground">
          Firebase is not configured. Copy <code>.env.example</code> to <code>.env.local</code> and fill it in.
        </div>
      )}
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/kiosk" element={<KioskPage />} />
        <Route
          path="/admin"
          element={
            <Suspense>
              <AdminPage />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast.Provider placement="top" />
    </BrowserRouter>
  )
}
