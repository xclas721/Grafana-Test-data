/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ACS_AUTH_BASE?: string
  readonly VITE_ACS_AUTH_WEB_BASE?: string
  /** Vite proxy 實際模式：local｜remote（由 .env / .env.remote 注入） */
  readonly VITE_TARGET_ENV?: string
  readonly VITE_PROXY_ACS_AUTH_TARGET?: string
  readonly VITE_PROXY_ACS_AUTH_WEB_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
