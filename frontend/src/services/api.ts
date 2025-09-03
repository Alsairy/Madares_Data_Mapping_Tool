import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
const api = axios.create({
  baseURL,
  auth:
    import.meta.env.VITE_API_BASIC_AUTH_USER && import.meta.env.VITE_API_BASIC_AUTH_PASS
      ? {
          username: import.meta.env.VITE_API_BASIC_AUTH_USER,
          password: import.meta.env.VITE_API_BASIC_AUTH_PASS
        }
      : undefined
})

export default api
