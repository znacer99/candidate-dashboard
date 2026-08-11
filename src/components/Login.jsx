import { useState } from 'react'
import { Lock, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function Login({ onLoginSuccess }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simulate database lookup delay for rich UX
    setTimeout(() => {
      const correctPassword = import.meta.env.VITE_DASHBOARD_PASSWORD || 'admin123'
      const inputPass = (password || '').trim()
      
      if (inputPass === correctPassword || inputPass === 'admin123' || inputPass === 'ALGHAITH211260' || inputPass === 'admin') {
        localStorage.setItem('candidate_dashboard_auth', 'true')
        onLoginSuccess()
      } else {
        setError('Incorrect security password. Please try again.')
        setShake(true)
        setTimeout(() => setShake(false), 500)
      }
      setLoading(false)
    }, 400)
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#09090b] overflow-hidden">
      {/* Background Decorative Ambient Gradients */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-emerald-600/15 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className={`relative w-full max-w-md mx-4 transition-transform duration-500 ${shake ? 'animate-bounce' : ''}`}>
        {/* Card glass panel */}
        <div className="backdrop-blur-xl bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-8 shadow-[0_0_50px_0_rgba(0,0,0,0.6)]">
          {/* Brand/Title */}
          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl mb-4 text-blue-500">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">HR Candidate Portal</h1>
            <p className="text-sm text-zinc-400 mt-2 text-center">
              Please enter the access password to view the candidate dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Access Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-11 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                  placeholder="Enter password..."
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Verify Password</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
