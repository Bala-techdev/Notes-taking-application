const AUTH_KEY = 'notes-app-auth'

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
  localStorage.removeItem(AUTH_KEY)
}
