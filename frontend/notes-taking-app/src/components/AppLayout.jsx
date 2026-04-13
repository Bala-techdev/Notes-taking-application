import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

import { getCurrentUser, logout } from '../services/authService'

function AppLayout() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/dashboard" className="brand">
          NotesFlow
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/notes/new">New Note</NavLink>
          <span className="user-chip">{currentUser?.email ?? 'Guest'}</span>
          <button type="button" className="text-button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      <main className="page-wrap">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
