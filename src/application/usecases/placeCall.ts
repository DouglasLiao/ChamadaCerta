import { normalizeDialNumber } from '../../domain/phoneNumber'
import type { CallGateway } from '../ports/DeviceGateway'
export async function placeCall(
  gateway: CallGateway,
  number: string,
  permissionGranted: boolean,
): Promise<void> {
  const normalized = normalizeDialNumber(number)
  if (!normalized) throw new Error('Confira o número digitado.')
  if (!permissionGranted) {
    const permission = await gateway.requestCallPermission()
    if (!permission.callPermission)
      throw new Error('Autorize chamadas telefônicas nas permissões do aplicativo para ligar.')
  }
  await gateway.dial(normalized)
}
