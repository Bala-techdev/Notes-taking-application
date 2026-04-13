import axios from 'axios'

const AUTH_KEY = 'notes-app-auth'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  const session = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null')
  const token = session?.token
  const tokenType = session?.tokenType || 'Bearer'

  if (token) {
    config.headers.Authorization = `${tokenType} ${token}`
  }

  return config
})

function normalizeApiError(error, fallbackMessage) {
  const message = error?.response?.data?.message || fallbackMessage
  throw new Error(message)
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

    localStorage.setItem(AUTH_KEY, JSON.stringify(session))
    return data
  } catch (error) {
    normalizeApiError(error, 'Invalid email or password.')
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
    normalizeApiError(error, 'Registration failed.')
  }
}

export async function getNotes() {
  try {
    const { data } = await apiClient.get('/api/notes')
    return data
  } catch (error) {
    normalizeApiError(error, 'Failed to fetch notes.')
  }
}

export async function createNote(noteInput) {
  try {
    const { data } = await apiClient.post('/api/notes', noteInput)
    return data
  } catch (error) {
    normalizeApiError(error, 'Failed to create note.')
  }
}

export async function updateNote(id, noteInput) {
  try {
    const { data } = await apiClient.put(`/api/notes/${id}`, noteInput)
    return data
  } catch (error) {
    normalizeApiError(error, 'Failed to update note.')
  }
}

export async function deleteNote(id) {
  try {
    await apiClient.delete(`/api/notes/${id}`)
  } catch (error) {
    normalizeApiError(error, 'Failed to delete note.')
  }
}

export default apiClient
