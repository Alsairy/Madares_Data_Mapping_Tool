import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
const auth = 
  import.meta.env.VITE_API_BASIC_AUTH_USER && import.meta.env.VITE_API_BASIC_AUTH_PASS
    ? {
        username: import.meta.env.VITE_API_BASIC_AUTH_USER as string,
        password: import.meta.env.VITE_API_BASIC_AUTH_PASS as string
      }
    : undefined

const api = axios.create({ 
  baseURL,
  auth,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    'User-Agent': 'MadarisDQTool/1.0'
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
