import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'

const root = fileURLToPath(new URL('../../', import.meta.url))

export function loadToolEnvironment(mode = 'development') {
  // Only returned to Node tools; never expose this object through Vite define/envPrefix.
  return { ...loadEnv(mode, root, ''), ...process.env }
}

export function environmentPort(env, key, fallback) {
  const raw = env[key]
  if (raw === undefined) return fallback
  const port = Number(raw)
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(port) || port < 1024 || port > 65535)
    throw new Error(`Configuração ${key} inválida: use uma porta entre 1024 e 65535.`)
  return port
}
