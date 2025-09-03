import axios from 'axios'
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://user:c673069adbe314846a3d9cf6a5cad4cd@data-mapping-assessment-app-tunnel-8uabnokl.devinapps.com'
})
export default api
