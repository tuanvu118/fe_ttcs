import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App as AntdApp, ConfigProvider } from 'antd/es'
import viVN from 'antd/es/locale/vi_VN'
import './styles/design-tokens.css'
import './index.css'
import App from './App.jsx'

const isLocalhost =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

if ((import.meta.env.PROD || isLocalhost) && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error)
    })
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ConfigProvider locale={viVN}>
        <AntdApp>
          <App />
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  </StrictMode>,
)
