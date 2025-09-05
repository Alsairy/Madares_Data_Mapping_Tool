import axios, { AxiosError } from 'axios'

async function getBaseURL() {
  try {
    const res = await fetch('/config.json', { cache: 'no-store' })
    const config = await res.json()
    console.log('API baseURL (fresh config):', config.apiBaseUrl)
    return config.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  } catch (error) {
    console.error('Failed to load fresh config, using fallback:', error)
    const runtime = (window as any).__APP_CONFIG__ || {}
    const baseURL = runtime.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
    console.log('API baseURL (fallback):', baseURL)
    return baseURL
  }
}

const api = axios.create({ 
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true'
  },
  withCredentials: false
})

api.interceptors.request.use(
  async (config) => {
    config.baseURL = await getBaseURL()
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    console.debug('[API][REQ]', config.method?.toUpperCase(), config.url, {
      baseURL: config.baseURL, 
      params: config.params, 
      headers: config.headers,
    })
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (err: AxiosError) => {
    const info = {
      message: err.message,
      code: (err as any).code,
      url: (err.config?.baseURL || '') + (err.config?.url || ''),
      method: err.config?.method,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      headers: err.response?.headers,
      isCORS: !err.response && !!(err as any).request,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    }
    console.error('[API][ERR] DETAILED ERROR INFO:', info)
    return Promise.reject(err)
  }
)

export default api
