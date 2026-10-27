export interface VerificationResult {
  status: 'unavailable' | 'inconclusive' | 'error' | 'suspicious'
  message: string
}
