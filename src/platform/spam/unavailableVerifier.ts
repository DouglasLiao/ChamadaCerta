import type { ScamVerificationGateway } from '../../application/ports/ScamVerificationGateway'
// No provider is configured. This adapter performs no network operation.
export const scamVerification: ScamVerificationGateway = {
  verify() {
    return Promise.resolve({ status: 'unavailable', message: 'Verificação indisponível' })
  },
}
