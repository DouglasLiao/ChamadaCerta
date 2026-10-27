import { describe, expect, it } from 'vitest'
import { parseRuntimeConfig } from '../src/config/parseRuntimeConfig'

describe('configuração pública do build', () => {
  it('funciona em checkout limpo sem .env e não permite mutação acidental', () => {
    const config = parseRuntimeConfig({})
    expect(config).toEqual({
      contactPageSize: 50,
      contactRecordPageSize: 20,
      bridgeDataTimeoutMs: 15000,
      bridgePermissionTimeoutMs: 180000,
    })
    expect(Object.isFrozen(config)).toBe(true)
  })

  it('converte opções válidas sem incluir variáveis privadas no resultado', () => {
    const env = {
      VITE_CONTACT_PAGE_SIZE: '75',
      VITE_CONTACT_RECORD_PAGE_SIZE: '10',
      VITE_BRIDGE_DATA_TIMEOUT_MS: '20000',
      VITE_BRIDGE_PERMISSION_TIMEOUT_MS: '240000',
      PRIVATE_TOKEN: 'nao-incluir',
    }
    expect(parseRuntimeConfig(env)).toEqual({
      contactPageSize: 75,
      contactRecordPageSize: 10,
      bridgeDataTimeoutMs: 20000,
      bridgePermissionTimeoutMs: 240000,
    })
  })

  it.each(['', '0', '-1', '1.5', 'NaN', 'Infinity', '99999999', ' 50', '1e2'])(
    'rejeita paginação inválida %s em vez de travar a lista',
    (value) => {
      expect(() => parseRuntimeConfig({ VITE_CONTACT_PAGE_SIZE: value })).toThrow(
        'VITE_CONTACT_PAGE_SIZE',
      )
    },
  )

  it('rejeita prazos fora dos limites e não revela o valor recebido no erro', () => {
    expect(() => parseRuntimeConfig({ VITE_BRIDGE_DATA_TIMEOUT_MS: '1' })).toThrow(
      'VITE_BRIDGE_DATA_TIMEOUT_MS',
    )
    expect(() => parseRuntimeConfig({ VITE_BRIDGE_PERMISSION_TIMEOUT_MS: '99999999' })).toThrow(
      'VITE_BRIDGE_PERMISSION_TIMEOUT_MS',
    )
    expect(() => parseRuntimeConfig({ VITE_CONTACT_RECORD_PAGE_SIZE: 'segredo' })).not.toThrow(
      'segredo',
    )
  })
})
