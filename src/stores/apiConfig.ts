/**
 * API 網域／基礎 URL 共用設定
 *
 * 留空時：使用相對路徑 (/acs-auth、/acs-auth-web)，由 Vite proxy 轉發
 * - Local／Remote 目標只在 env（.env / .env.remote）＋ npm script；改完需重開 Vite
 * - 網頁不設定 Remote host
 *
 * 部署預設值（可選）：VITE_ACS_AUTH_BASE、VITE_ACS_AUTH_WEB_BASE
 */
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export type ApiTargetEnv = 'local' | 'remote'

const envAcsAuth = import.meta.env.VITE_ACS_AUTH_BASE ?? ''
const envAcsAuthWeb = import.meta.env.VITE_ACS_AUTH_WEB_BASE ?? ''

function resolveProxyEnv(): ApiTargetEnv {
  const raw = (import.meta.env.VITE_TARGET_ENV ?? 'local').toLowerCase()
  return raw === 'remote' ? 'remote' : 'local'
}

export const useApiConfigStore = defineStore('apiConfig', () => {
  /** 目前 Vite 啟動時的 proxy 模式（改 env／script 後需重開） */
  const proxyEnv = ref<ApiTargetEnv>(resolveProxyEnv())

  /** acs-auth 基礎 URL；留空＝相對路徑走 proxy */
  const acsAuthBase = ref(envAcsAuth)
  /** acs-auth-web 基礎 URL；留空＝相對路徑走 proxy */
  const acsAuthWebBase = ref(envAcsAuthWeb)

  const acsAuthBaseTrimmed = computed(() => acsAuthBase.value.trim())
  const acsAuthWebBaseTrimmed = computed(() => acsAuthWebBase.value.trim())

  function resolveAcsAuthPath(path: string): string {
    const base = acsAuthBaseTrimmed.value
    const p = path.startsWith('/') ? path : `/${path}`
    return base ? `${base.replace(/\/+$/, '')}${p}` : p
  }

  function resolveAcsAuthWebPath(path: string): string {
    const base = acsAuthWebBaseTrimmed.value
    const p = path.startsWith('/') ? path : `/${path}`
    return base ? `${base.replace(/\/+$/, '')}${p}` : p
  }

  function loadDefaults() {
    acsAuthBase.value = envAcsAuth
    acsAuthWebBase.value = envAcsAuthWeb
  }

  /** 清空為相對路徑，強制走目前 Vite proxy */
  function useProxyPaths() {
    acsAuthBase.value = ''
    acsAuthWebBase.value = ''
  }

  return {
    proxyEnv,
    acsAuthBase,
    acsAuthWebBase,
    acsAuthBaseTrimmed,
    acsAuthWebBaseTrimmed,
    resolveAcsAuthPath,
    resolveAcsAuthWebPath,
    loadDefaults,
    useProxyPaths
  }
})
