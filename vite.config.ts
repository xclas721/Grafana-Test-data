import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

function requireRemoteProxyTarget(name: string, value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) {
    throw new Error(
      `[dev:remote] 缺少 ${name}。請在 .env.remote 設定 proxy 目標後重開，例如：\n` +
        `  VITE_PROXY_ACS_AUTH_TARGET=https://demo-acs-v3.hitrust-emv.com\n` +
        `  VITE_PROXY_ACS_AUTH_WEB_TARGET=https://demo-acs-v3.hitrust-emv.com`
    )
  }
  return trimmed
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isRemote = mode === 'remote'

  const acsAuthTarget = isRemote
    ? requireRemoteProxyTarget('VITE_PROXY_ACS_AUTH_TARGET', env.VITE_PROXY_ACS_AUTH_TARGET)
    : env.VITE_PROXY_ACS_AUTH_TARGET?.trim() || 'http://localhost:30100'
  const acsAuthWebTarget = isRemote
    ? requireRemoteProxyTarget(
        'VITE_PROXY_ACS_AUTH_WEB_TARGET',
        env.VITE_PROXY_ACS_AUTH_WEB_TARGET
      )
    : env.VITE_PROXY_ACS_AUTH_WEB_TARGET?.trim() || 'http://localhost:8050'

  if (isRemote) {
    console.log(`[dev:remote] VITE_PROXY_ACS_AUTH_TARGET=${acsAuthTarget}`)
    console.log(`[dev:remote] VITE_PROXY_ACS_AUTH_WEB_TARGET=${acsAuthWebTarget}`)
  }

  return {
    plugins: [tailwindcss(), vue(), vueDevTools()],
    server: {
      port: 6600,
      proxy: {
        // /acs-auth-web 必須排在 /acs-auth 前面，避免被較短前綴吃掉
        '/acs-auth-web': {
          target: acsAuthWebTarget,
          changeOrigin: true,
        },
        '/acs-auth': {
          target: acsAuthTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 6600,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
