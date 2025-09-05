import axios, { AxiosError } from 'axios'

function getBaseURL() {
  const runtime = (window as any).__APP_CONFIG__ || {}
  const baseURL = runtime.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  console.log('API baseURL (runtime first):', baseURL)
  return baseURL
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
  (config) => {
    config.baseURL = getBaseURL()
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
    }
    console.error('[API][ERR]', info)
    return Promise.reject(err)
  }
)

export default api
