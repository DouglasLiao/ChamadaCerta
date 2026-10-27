import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { AppProvider } from './presentation/AppProvider'
import './shared/styles/app.css'
import { deviceApi } from './platform/android/client'
const root = document.getElementById('root')
if (!root) throw new Error('Não foi possível inicializar o aplicativo.')
createRoot(root).render(
  <StrictMode>
    <AppProvider gateway={deviceApi}>
      <App />
    </AppProvider>
  </StrictMode>,
)
