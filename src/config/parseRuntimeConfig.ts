export interface PublicEnvironment {
  VITE_CONTACT_PAGE_SIZE?: string
  VITE_CONTACT_RECORD_PAGE_SIZE?: string
  VITE_BRIDGE_DATA_TIMEOUT_MS?: string
  VITE_BRIDGE_PERMISSION_TIMEOUT_MS?: string
}

function integer(
  env: PublicEnvironment,
  key: keyof PublicEnvironment,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = env[key]
  if (raw === undefined) return fallback
  const value = Number(raw)
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value < min || value > max)
    throw new Error(`Configuração ${key} inválida: use um inteiro entre ${min} e ${max}.`)
  return value
}

export function parseRuntimeConfig(env: PublicEnvironment) {
  return Object.freeze({
    contactPageSize: integer(env, 'VITE_CONTACT_PAGE_SIZE', 50, 10, 100),
    contactRecordPageSize: integer(env, 'VITE_CONTACT_RECORD_PAGE_SIZE', 20, 5, 50),
    bridgeDataTimeoutMs: integer(env, 'VITE_BRIDGE_DATA_TIMEOUT_MS', 15000, 1000, 60000),
    bridgePermissionTimeoutMs: integer(
      env,
      'VITE_BRIDGE_PERMISSION_TIMEOUT_MS',
      180000,
      30000,
      300000,
    ),
  })
}
