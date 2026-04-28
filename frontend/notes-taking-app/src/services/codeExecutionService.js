import axios from 'axios'
import { getCurrentUser, getAuthToken } from './authService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
})

// Add JWT token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const session = getCurrentUser()
    const token = getAuthToken() || session?.token
    const tokenType = session?.tokenType || 'Bearer'

    if (token) {
      config.headers.Authorization = `${tokenType} ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Execute code via backend
export const executeCode = async (language, code) => {
  try {
    const response = await axiosInstance.post('/code/run', {
      language,
      code,
    })
    return response.data
  } catch (error) {
    if (error.response?.data) {
      throw new Error(error.response.data.message || 'Failed to execute code')
    }
    throw new Error(error.message || 'Failed to execute code')
  }
}

export default {
  executeCode,
}
