import { getCurrentUser } from '../services/authService'

function Profile() {
  const currentUser = getCurrentUser()

  return (
    <section className="panel profile-panel">
      <div className="panel-heading">
        <h2>Profile</h2>
        <span>Account details</span>
      </div>

      <div className="profile-grid">
        <div className="profile-field">
          <p className="profile-label">Email</p>
          <p className="profile-value">{currentUser?.email || 'Not available'}</p>
        </div>

        <div className="profile-field">
          <p className="profile-label">Token type</p>
          <p className="profile-value">{currentUser?.tokenType || 'Bearer'}</p>
        </div>
      </div>
    </section>
  )
}

export default Profile
