import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

import { register } from '../services/apiService'
import ThemeToggle from '../components/ThemeToggle'

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      await register(form)
      setSuccessMessage('Registration successful. Redirecting to login...')
      setTimeout(() => navigate('/login'), 1200)
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

      <article className="auth-card login-card register-card">
        <div className="auth-header">
          <div>
            <p className="eyebrow">Join the workspace</p>
            <h1 className="login-heading">Register</h1>
            <p className="login-subtext">Create your profile and start organizing your notes.</p>
          </div>
        </div>

        <form className="form-stack login-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="devwriter"
              autoComplete="username"
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
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
                placeholder="Create a password"
                autoComplete="new-password"
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
          {successMessage ? <p className="form-success">{successMessage}</p> : null}

          <button type="submit" className="primary-button login-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="form-footer login-footer">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </article>
    </section>
  )
}

export default Register
