import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

import { login } from '../services/apiService'
import ThemeToggle from '../components/ThemeToggle'

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(form)
      navigate('/dashboard')
    } catch (error) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page-shell">
      <header className="auth-brand-header" aria-label="Application branding">
        <div className="auth-brand-left">
          <span className="auth-brand-logo" aria-hidden="true">
            NF
          </span>
          <div>
            <p className="auth-brand-title">NotesFlow</p>
            <p className="auth-brand-tagline">Organize your ideas and notes efficiently</p>
          </div>
        </div>
        <ThemeToggle className="theme-toggle-button" compact />
      </header>

      <article className="auth-card login-card">
        <div className="auth-header">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h1 className="login-heading">Login</h1>
            <p className="login-subtext">Access your notes, snippets, and drafts in seconds.</p>
          </div>
        </div>

        <form className="form-stack login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <div className="input-with-icon">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
                  <path
                    d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm8 6 8-5H4l8 5zm0 2L4 9v7h16V9l-8 5z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label>
            Password
            <div className="input-with-icon">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
                  <path
                    d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-6 7.73V17a1 1 0 1 0 2 0v-1.27a2 2 0 1 0-2 0zM10 8V6a2 2 0 0 1 4 0v2h-4z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle-button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button type="submit" className="primary-button login-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="form-footer login-footer">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </article>
    </section>
  )
}

export default Login
