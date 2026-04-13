import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { register } from '../services/apiService'

function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
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
    <section className="auth-card">
      <div>
        <p className="eyebrow">Join the workspace</p>
        <h1>Register</h1>
        <p className="lede">Create a profile to organize your notes.</p>
      </div>

      <form className="form-stack" onSubmit={handleSubmit}>
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
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Create a password"
            autoComplete="new-password"
            required
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}
        {successMessage ? <p className="form-success">{successMessage}</p> : null}

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p className="form-footer">
        Already registered? <Link to="/login">Login</Link>
      </p>
    </section>
  )
}

export default Register
