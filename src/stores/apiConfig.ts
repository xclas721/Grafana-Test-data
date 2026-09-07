/**
 * API 路徑解析（相對路徑走 Vite proxy）
 *
 * - Local／Remote 目標只在 env（.env / .env.remote）＋ npm script；改完需重開 Vite
 * - 網頁不設定 host
 * - 建置期可選：VITE_ACS_AUTH_BASE、VITE_ACS_AUTH_WEB_BASE（非空則直拼 origin）
 */
import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ApiTargetEnv = 'local' | 'remote'

const acsAuthBase = (import.meta.env.VITE_ACS_AUTH_BASE ?? '').trim()
const acsAuthWebBase = (import.meta.env.VITE_ACS_AUTH_WEB_BASE ?? '').trim()

function resolveProxyEnv(): ApiTargetEnv {
  const raw = (import.meta.env.VITE_TARGET_ENV ?? 'local').toLowerCase()
  return raw === 'remote' ? 'remote' : 'local'
}

function joinBase(base: string, path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return base ? `${base.replace(/\/+$/, '')}${p}` : p
}

export const useApiConfigStore = defineStore('apiConfig', () => {
  /** 目前 Vite 啟動時的 proxy 模式（改 env／script 後需重開） */
  const proxyEnv = ref<ApiTargetEnv>(resolveProxyEnv())

  function resolveAcsAuthPath(path: string): string {
    return joinBase(acsAuthBase, path)
  }

  function resolveAcsAuthWebPath(path: string): string {
    return joinBase(acsAuthWebBase, path)
  }

  return {
    proxyEnv,
    resolveAcsAuthPath,
    resolveAcsAuthWebPath
  }
})
