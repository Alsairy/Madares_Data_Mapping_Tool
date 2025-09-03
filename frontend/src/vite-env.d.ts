
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_BASIC_AUTH_USER: string
  readonly VITE_API_BASIC_AUTH_PASS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
