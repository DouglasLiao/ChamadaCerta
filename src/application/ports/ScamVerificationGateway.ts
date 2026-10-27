import type { VerificationResult } from '../../domain/VerificationResult';
export interface ScamVerificationGateway {
  verify(number: string, signal?: AbortSignal): Promise<VerificationResult>;
}
