import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: '#4F46E5',
          colorBackground: '#FFFFFF',
          colorText: '#0F172A',
          colorInputBackground: '#F8FAFC',
          colorInputText: '#0F172A',
          borderRadius: '0.9rem',
        },
        elements: {
          cardBox: 'rounded-3xl border border-slate-200 shadow-2xl',
          headerTitle: 'text-slate-900',
          headerSubtitle: 'text-slate-500',
          formFieldInput: 'rounded-xl border-slate-200',
          formButtonPrimary: 'rounded-xl bg-[#4F46E5] hover:bg-[#4338CA]',
          footerActionLink: 'text-[#4F46E5] hover:text-[#4338CA]',
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>,
)
