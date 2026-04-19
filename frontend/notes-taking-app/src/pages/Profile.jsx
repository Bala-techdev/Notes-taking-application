import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import LoadingSpinner from '../components/LoadingSpinner'
import { logout, updateSession } from '../services/authService'
import { getMyProfile, updateMyProfile } from '../services/apiService'

function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      setError('')
      try {
        const data = await getMyProfile()
        setProfile(data)
        setUsername(data.username || '')
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSaving(true)

    try {
      const payload = {
        username: username.trim(),
        password: password.trim() || null,
      }

      const updatedProfile = await updateMyProfile(payload)
      setProfile(updatedProfile)
      setUsername(updatedProfile.username || '')
      setPassword('')
      updateSession((current) => ({ ...current, email: updatedProfile.email, username: updatedProfile.username }))
      setSuccess('Profile updated successfully.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <section className="panel profile-panel">
      <div className="panel-heading">
        <h2>Profile</h2>
        <span>Manage your account</span>
      </div>

      {isLoading ? <LoadingSpinner label="Loading profile..." /> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}

      {!isLoading && profile ? (
        <>
          <div className="profile-grid">
            <div className="profile-field">
              <p className="profile-label">Username</p>
              <p className="profile-value">{profile.username}</p>
            </div>

            <div className="profile-field">
              <p className="profile-label">Email</p>
              <p className="profile-value">{profile.email}</p>
            </div>

            <div className="profile-field">
              <p className="profile-label">Total notes</p>
              <p className="profile-value">{profile.totalNotesCount}</p>
            </div>
          </div>

          <form className="form-stack" onSubmit={handleSubmit}>
            <label>
              Update username
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                minLength={3}
                maxLength={50}
                required
              />
            </label>

            <label>
              New password (optional)
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                maxLength={100}
                placeholder="Leave empty to keep current password"
              />
            </label>

            <div className="hero-actions">
              <button type="submit" className="primary-button" disabled={isSaving}>
                {isSaving ? 'Updating...' : 'Update profile'}
              </button>
              <button type="button" className="secondary-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </form>
        </>
      ) : null}

      {!isLoading && !profile && !error ? (
        <div className="empty-state">
          <h3>Profile unavailable</h3>
          <p>Unable to load your profile right now. Please try again.</p>
        </div>
      ) : null}
    </section>
  )
}

export default Profile
