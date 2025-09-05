import axios from 'axios'

function getBaseURL() {
  const runtime = (window as any).__APP_CONFIG__ || {}
  const baseURL = 
    runtime.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  
  console.log('=== API Configuration Debug ===')
  console.log('Runtime config:', runtime)
  console.log('Runtime apiBaseUrl:', runtime.apiBaseUrl)
  console.log('Build-time VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
  console.log('Final API baseURL (runtime first):', baseURL)
  console.log('=== End Debug ===')
  
  return baseURL
}

const auth = 
  import.meta.env.VITE_API_BASIC_AUTH_USER && import.meta.env.VITE_API_BASIC_AUTH_PASS
    ? {
        username: import.meta.env.VITE_API_BASIC_AUTH_USER as string,
        password: import.meta.env.VITE_API_BASIC_AUTH_PASS as string
      }
    : undefined

const api = axios.create({ 
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true'
  },
  withCredentials: false,
  auth
})

api.interceptors.request.use(
  (config) => {
    const runtime = (window as any).__APP_CONFIG__ || {}
    const dynamicBaseURL = 
      runtime.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
    
    config.baseURL = dynamicBaseURL
    console.log('Request interceptor - using baseURL:', dynamicBaseURL)
    
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
