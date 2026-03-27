import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './i18n'
import api from './api/axios'
import ENDPOINTS from './api/endpoints'
import { registerServiceWorker } from './pwa/registerServiceWorker'
import { setupOfflineComplaintQueueSync } from './offline/complaintQueue'

registerServiceWorker()
setupOfflineComplaintQueueSync({
  apiClient: api,
  createEndpoint: ENDPOINTS.GRIEVANCES.CREATE,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
