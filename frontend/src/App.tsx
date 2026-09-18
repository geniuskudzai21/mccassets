import { InstallPrompt } from './components/pwa/InstallPrompt.tsx'
import { ToastProvider } from './components/ui/toast.tsx'
import AppRoutes from './routes/AppRoutes.tsx'

export default function App() {
  return (
    <ToastProvider>
      <AppRoutes />
      <InstallPrompt />
    </ToastProvider>
  )
}
