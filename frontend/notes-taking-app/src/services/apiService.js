import axios from 'axios'
import { clearSession, getCurrentUser, saveSession } from './authService'

// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : 'http://localhost:8080')
const API_BASE_URL = "http://localhost:8080"

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// apiClient.interceptors.request.use((config) => {
//   const session = getCurrentUser()
//   const token = session?.token
//   const tokenType = session?.tokenType || 'Bearer'

//   if (token) {
//     config.headers.Authorization = `${tokenType} ${token}`
//   }

//   return config
// })
apiClient.interceptors.request.use((config) => {
  const session = getCurrentUser()
  const token = session?.token
  const tokenType = session?.tokenType || 'Bearer'
  const requestUrl = String(config.url || '')

  // ✅ Skip token for auth APIs
  if (token && !requestUrl.includes('/api/auth/')) {
    config.headers.Authorization = `${tokenType} ${token}`
  }

  return config
})
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const requestUrl = error?.config?.url || ''

    // Clear stale JWT if backend rejects protected requests.
    if (status === 401 && !requestUrl.startsWith('/api/auth/')) {
      clearSession()
    }

    return Promise.reject(error)
  }
)

function resolveApiErrorMessage(error, fallbackMessage) {
  const status = error?.response?.status

  if (error?.response?.data) {
    const { data } = error.response
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message
    }

    const fieldErrors = data.fieldErrors
    if (fieldErrors && typeof fieldErrors === 'object') {
      const firstFieldMessage = Object.values(fieldErrors).find((value) => typeof value === 'string' && value.trim())
      if (firstFieldMessage) {
        return firstFieldMessage
      }
    }
  }

  if (status === 401) {
    return 'Session expired or unauthorized. Please login again.'
  }

  if (status === 403) {
    return 'Access denied. You do not have permission for this action.'
  }

  if (error?.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.'
  }

  if (!error?.response) {
    return 'Unable to connect to server. Check backend URL and CORS configuration.'
  }

  return fallbackMessage
}

function throwApiError(error, fallbackMessage) {
  throw new Error(resolveApiErrorMessage(error, fallbackMessage))
}

export async function login({ email, password }) {
  try {
    const normalizedEmail = email.trim().toLowerCase()
    const { data } = await apiClient.post('/api/auth/login', {
      email: normalizedEmail,
      password,
    })

    const session = {
      email: normalizedEmail,
      token: data.token,
      tokenType: data.tokenType || 'Bearer',
    }

    saveSession(session)
    return data
  } catch (error) {
    throwApiError(error, 'Invalid email or password.')
  }
}

export async function register({ username, email, password }) {
  try {
    const { data } = await apiClient.post('/api/auth/register', {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
    })
    return data
  } catch (error) {
    throwApiError(error, 'Registration failed.')
  }
}

export async function getNotes(filters = {}) {
  try {
    const params = {}

    if (filters.search && filters.search.trim()) {
      params.search = filters.search.trim()
    }

    if (filters.sort && (filters.sort === 'latest' || filters.sort === 'oldest')) {
      params.sort = filters.sort
    }

    if (Array.isArray(filters.tags) && filters.tags.length > 0) {
      params.tags = filters.tags.join(',')
    }

    const { data } = await apiClient.get('/api/notes', { params })
    return data
  } catch (error) {
    throwApiError(error, 'Failed to fetch notes.')
  }
}

export async function getNoteById(id) {
  try {
    const { data } = await apiClient.get(`/api/notes/${id}`)
    return data
  } catch (error) {
    throwApiError(error, 'Failed to load note.')
  }
}

export async function createNote(noteInput) {
  try {
    const { data } = await apiClient.post('/api/notes', noteInput)
    return data
  } catch (error) {
    throwApiError(error, 'Failed to create note.')
  }
}

export async function updateNote(id, noteInput) {
  try {
    const { data } = await apiClient.put(`/api/notes/${id}`, noteInput)
    return data
  } catch (error) {
    throwApiError(error, 'Failed to update note.')
  }
}

export async function deleteNote(id) {
  try {
    await apiClient.delete(`/api/notes/${id}`)
  } catch (error) {
    throwApiError(error, 'Failed to delete note.')
  }
}

export async function updateNoteFavorite(id, enabled) {
  try {
    const { data } = await apiClient.patch(`/api/notes/${id}/favorite`, { enabled })
    return data
  } catch (error) {
    throwApiError(error, 'Failed to update favorite status.')
  }
}

export async function updateNotePinned(id, enabled) {
  try {
    const { data } = await apiClient.patch(`/api/notes/${id}/pin`, { enabled })
    return data
  } catch (error) {
    throwApiError(error, 'Failed to update pin status.')
  }
}

export async function getMyProfile() {
  try {
    const { data } = await apiClient.get('/api/users/me')
    return data
  } catch (error) {
    throwApiError(error, 'Failed to load profile.')
  }
}

export async function updateMyProfile(profileInput) {
  try {
    const { data } = await apiClient.put('/api/users/me', profileInput)
    return data
  } catch (error) {
    throwApiError(error, 'Failed to update profile.')
  }
}

export default apiClient
