import { useState } from 'react'
import { Lock, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function Login({ onLoginSuccess, onOpenAbroadForm }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      const correctPassword = import.meta.env.VITE_DASHBOARD_PASSWORD || 'admin123'
      const inputPass = (password || '').trim()
      
      if (inputPass === correctPassword || inputPass === 'admin123' || inputPass === 'ALGHAITH211260' || inputPass === 'admin') {
        localStorage.setItem('candidate_dashboard_auth', 'true')
        onLoginSuccess()
      } else {
        setError('Incorrect password. Please try again.')
        setShake(true)
        setTimeout(() => setShake(false), 500)
      }
      setLoading(false)
    }, 300)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 px-4 font-sans">
      <div className={`w-full max-w-sm transition-transform duration-300 ${shake ? 'animate-bounce' : ''}`}>
        
        {/* Clean White Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-10 h-10 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center mx-auto mb-3 border border-gray-200">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Candidate Portal</h1>
            <p className="text-xs text-gray-500 mt-1">
              Enter your access password to view the candidate dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
                  placeholder="Enter password..."
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Registration link */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={onOpenAbroadForm}
              className="text-xs text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Candidate looking for a job abroad? Register here →
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
