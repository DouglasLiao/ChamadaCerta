export interface Contact {
  id: string
  name: string
  number: string
}
export type CallStatus = 'incoming' | 'outgoing' | 'answered' | 'missed' | 'blocked' | 'rejected'
export interface CallRecord {
  id: string
  number: string
  name?: string
  timestamp: string
  status: CallStatus
  source: 'screening' | 'system'
  blockReason?: string
  isContact: boolean
  duration?: string
}
export interface DeviceStatus {
  contactsPermission: boolean
  writeContactsPermission: boolean
  callPermission: boolean
  dialerAvailable: boolean
  dialerHeld: boolean
  notificationsPermission: boolean
  fullScreenAllowed: boolean
  hasActiveCall: boolean
  callLogPermission: boolean
  screeningAvailable: boolean
  screeningHeld: boolean
  blockNonContacts: boolean
  protectionActive: boolean
  screeningError: string
  canDial: boolean
  verification: 'unavailable'
}

export interface HistorySnapshot {
  entries: CallRecord[]
  warning: string
}

export interface DialRequest {
  id: string
  number: string
}
