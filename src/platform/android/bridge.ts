import { runtimeConfig } from '../../config/runtime'

export interface NativePort {
  postMessage(message: string): void
  onmessage?: (event: { data: string }) => void
}
declare global {
  interface Window {
    ChamadaCertaNative?: NativePort
  }
}
export type NativeMethod =
  | 'dialRequest'
  | 'requestDefaultDialer'
  | 'requestCallPermission'
  | 'requestWriteContacts'
  | 'requestNotifications'
  | 'openFullScreenSettings'
  | 'openInCall'
  | 'saveContact'
  | 'editContact'
  | 'status'
  | 'contacts'
  | 'history'
  | 'setBlocking'
  | 'requestContacts'
  | 'requestHistory'
  | 'requestScreening'
  | 'openSettings'
  | 'dial'
  | 'clearBlockedHistory'
interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}
export const isNativeDevice = () => typeof window !== 'undefined' && !!window.ChamadaCertaNative

export class AndroidBridge {
  private sequence = 0
  private readonly pending = new Map<string, PendingRequest>()
  constructor(private readonly getPort: () => NativePort | undefined) {}

  request(method: NativeMethod, args: Record<string, unknown> = {}): Promise<unknown> {
    const port = this.getPort()
    if (!port) return Promise.reject(new Error('Recurso disponível somente no aplicativo Android.'))
    port.onmessage = this.receive
    return new Promise((resolve, reject) => {
      const id = `cc_${++this.sequence}`
      const timeout = method.startsWith('request')
        ? runtimeConfig.bridgePermissionTimeoutMs
        : runtimeConfig.bridgeDataTimeoutMs
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error('O aparelho não respondeu. Tente novamente.'))
      }, timeout)
      this.pending.set(id, { resolve, reject, timer })
      try {
        port.postMessage(JSON.stringify({ id, method, args }))
      } catch {
        this.finish(id, undefined, 'Não foi possível acessar o aparelho.')
      }
    })
  }

  private readonly receive = (event: { data: string }) => {
    let message: unknown
    try {
      message = JSON.parse(event.data)
    } catch {
      return
    }
    if (
      typeof message !== 'object' ||
      message === null ||
      !('id' in message) ||
      typeof message.id !== 'string'
    )
      return
    const error =
      'error' in message && typeof message.error === 'string' ? message.error : undefined
    const result = 'result' in message ? message.result : undefined
    this.finish(message.id, result, error)
  }

  private finish(id: string, value: unknown, error?: string) {
    const request = this.pending.get(id)
    if (!request) return
    clearTimeout(request.timer)
    this.pending.delete(id)
    if (error) request.reject(new Error(error))
    else request.resolve(value)
  }
}
const bridge = new AndroidBridge(() => window.ChamadaCertaNative)
export const nativeRequest = (method: NativeMethod, args?: Record<string, unknown>) =>
  bridge.request(method, args)
