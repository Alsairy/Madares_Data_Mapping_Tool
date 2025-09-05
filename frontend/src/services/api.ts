import axios from 'axios'

const runtime = (window as any).__APP_CONFIG__ || {}
const baseURL =
  runtime.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

console.log('API baseURL (runtime first):', baseURL)

const api = axios.create({ 
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true'
  },
  withCredentials: false
})

api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default api
