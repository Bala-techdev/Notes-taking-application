const AUTH_KEY = 'notes-app-auth'

export { AUTH_KEY }

export function saveSession(session) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(AUTH_KEY)
}

export function updateSession(updater) {
  const current = getCurrentUser()
  if (!current) {
    return null
  }

  const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater }
  saveSession(next)
  return next
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null')
  } catch {
    return null
  }
}

export function getAuthToken() {
  const session = getCurrentUser()
  const token = session?.token
  return typeof token === 'string' && token.trim() ? token : null
}

export function isAuthenticated() {
  return Boolean(getAuthToken())
}

export function logout() {
  clearSession()
}
