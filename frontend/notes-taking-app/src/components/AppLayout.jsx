import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { getCurrentUser, logout } from '../services/authService'
import ThemeToggle from './ThemeToggle'

function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser())
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setCurrentUser(getCurrentUser())
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="workspace-shell">
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`} aria-label="Sidebar navigation">
        <div className="sidebar-top">
          <p className="logo-mark">NF</p>
          <div>
            <p className="eyebrow">Workspace</p>
            <h1 className="brand-title">NotesFlow</h1>
          </div>
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? 'Close' : 'Menu'}
          </button>
        </div>

        <nav className={`sidebar-nav ${isMobileMenuOpen ? 'open' : ''}`}>
          <NavLink to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</NavLink>
          <NavLink to="/notes/new" onClick={() => setIsMobileMenuOpen(false)}>New Note</NavLink>
          <NavLink to="/profile" onClick={() => setIsMobileMenuOpen(false)}>Profile</NavLink>
        </nav>

        <div className={`sidebar-footer ${isMobileMenuOpen ? 'open' : ''}`}>
          <ThemeToggle className="secondary-button" />
          <p className="user-chip">{currentUser?.username || currentUser?.email || 'Guest'}</p>
          <button type="button" className="text-button danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="content-shell">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
