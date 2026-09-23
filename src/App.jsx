import { useState, useEffect } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import AbroadApplicationForm from './components/AbroadApplicationForm'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('candidate_dashboard_auth') === 'true'
  })

  // Detect if user navigated directly to the public abroad application form
  const [showAbroadForm, setShowAbroadForm] = useState(() => {
    const search = window.location.search
    const hash = window.location.hash
    return search.includes('page=apply-abroad') || search.includes('apply=abroad') || hash === '#apply'
  })

  useEffect(() => {
    const handlePopState = () => {
      const search = window.location.search
      const hash = window.location.hash
      setShowAbroadForm(search.includes('page=apply-abroad') || search.includes('apply=abroad') || hash === '#apply')
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

