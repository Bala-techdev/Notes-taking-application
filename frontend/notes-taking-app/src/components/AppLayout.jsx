import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { getCurrentUser, logout } from '../services/authService'

function AppLayout() {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [theme, setTheme] = useState(() => localStorage.getItem('notes-theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('notes-theme', theme)
  }, [theme])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className="workspace-shell">
      <aside className="sidebar" aria-label="Sidebar navigation">
        <div className="sidebar-top">
          <p className="logo-mark">NF</p>
          <div>
            <p className="eyebrow">Workspace</p>
            <h1 className="brand-title">NotesFlow</h1>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/notes/new">New Note</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="secondary-button" onClick={toggleTheme}>
            {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          </button>
          <p className="user-chip">{currentUser?.email ?? 'Guest'}</p>
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
