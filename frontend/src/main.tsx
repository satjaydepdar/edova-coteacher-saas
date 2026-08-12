import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { initStorage } from './lib/api'
import { useApp } from './store'
import './index.css'

// Load the device token + stable install UUID from secure storage before first render,
// so an already-activated device never flashes the activation screen (requirement §2).
initStorage().then((hasToken) => {
  useApp.setState({ authed: hasToken })
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  )
})
