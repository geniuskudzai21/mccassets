import { InstallPrompt } from './components/pwa/InstallPrompt.tsx'
import AppRoutes from './routes/AppRoutes.tsx'

export default function App() {
  return (
    <>
      <AppRoutes />
      <InstallPrompt />
    </>
  )
}
