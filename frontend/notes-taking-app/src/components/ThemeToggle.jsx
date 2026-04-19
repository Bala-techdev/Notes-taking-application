import { useState } from 'react'

import { applyTheme, getSavedTheme, toggleTheme } from '../services/themeService'

function ThemeToggle({ className = 'secondary-button', compact = false }) {
  const [theme, setTheme] = useState(() => getSavedTheme())

  const handleToggle = () => {
    setTheme((current) => toggleTheme(current))
  }

  const buttonLabel = compact
    ? theme === 'dark'
      ? 'Light'
      : 'Dark'
    : theme === 'dark'
      ? 'Switch to Light'
      : 'Switch to Dark'

  return (
    <button
      type="button"
      className={className}
      onClick={handleToggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {buttonLabel}
    </button>
  )
}

export default ThemeToggle
