const THEME_KEY = 'notes-theme'
const LIGHT_THEME = 'light'
const DARK_THEME = 'dark'

function resolveStoredTheme() {
  const raw = localStorage.getItem(THEME_KEY)
  if (raw === DARK_THEME || raw === LIGHT_THEME) {
    return raw
  }

  return LIGHT_THEME
}

export function getSavedTheme() {
  return resolveStoredTheme()
}

export function applyTheme(theme) {
  const nextTheme = theme === DARK_THEME ? DARK_THEME : LIGHT_THEME
  const root = document.documentElement

  root.setAttribute('data-theme', nextTheme)
  root.classList.remove('theme-light', 'theme-dark')
  root.classList.add(nextTheme === DARK_THEME ? 'theme-dark' : 'theme-light')

  localStorage.setItem(THEME_KEY, nextTheme)
  return nextTheme
}

export function toggleTheme(currentTheme) {
  const nextTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME
  return applyTheme(nextTheme)
}
