import { useState, useEffect } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import AbroadApplicationForm from './components/AbroadApplicationForm'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('candidate_dashboard_auth') === 'true'
  })

  // Detect if user navigated directly to the public abroad application form
  const isAbroadRoute = () => {
    const search = window.location.search.toLowerCase()
    const hash = window.location.hash.toLowerCase()
    const pathname = window.location.pathname.toLowerCase()
    const hostname = window.location.hostname.toLowerCase()
    return (
      search.includes('page=apply-abroad') ||
      search.includes('apply=abroad') ||
      hash === '#apply' ||
      pathname.startsWith('/abroad') ||
      pathname.startsWith('/apply') ||
      hostname.startsWith('abroad.') ||
      hostname.startsWith('global.')
    )
  }

  const [showAbroadForm, setShowAbroadForm] = useState(isAbroadRoute)

  useEffect(() => {
    const handlePopState = () => {
      setShowAbroadForm(isAbroadRoute())
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    setShowAbroadForm(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('candidate_dashboard_auth')
    setIsAuthenticated(false)
  }

  const handleOpenAbroadForm = () => {
    setShowAbroadForm(true)
    window.history.pushState({}, '', '?page=apply-abroad')
  }

  const handleBackToLogin = () => {
    setShowAbroadForm(false)
    window.history.pushState({}, '', window.location.pathname)
  }

  // 1. If public abroad form is requested, render it directly
  if (showAbroadForm) {
    return <AbroadApplicationForm onBackToLogin={handleBackToLogin} />
  }

  // 2. Otherwise render authenticated dashboard or login
  return isAuthenticated ? (
    <Dashboard onLogout={handleLogout} />
  ) : (
    <Login onLoginSuccess={handleLoginSuccess} onOpenAbroadForm={handleOpenAbroadForm} />
  )
}

export default App

