import type { Contact, DeviceStatus, DialRequest, HistorySnapshot } from '../../domain/models';

export interface CallGateway {
  dial(number: string): Promise<void>;
  requestCallPermission(): Promise<DeviceStatus>;
}
export interface ContactGateway {
  saveContact(name: string, number: string): Promise<void>;
  requestWriteContacts(): Promise<DeviceStatus>;
}
export interface DeviceGateway extends CallGateway, ContactGateway {
  isAvailable(): boolean;
  status(): Promise<DeviceStatus>;
  contacts(): Promise<Contact[]>;
  history(): Promise<HistorySnapshot>;
  dialRequest(): Promise<DialRequest | null>;
  requestDefaultDialer(): Promise<DeviceStatus>;
  requestContacts(): Promise<DeviceStatus>;
  requestHistory(): Promise<DeviceStatus>;
  requestScreening(): Promise<DeviceStatus>;
  requestNotifications(): Promise<DeviceStatus>;
  setBlocking(enabled: boolean): Promise<DeviceStatus>;
  openSettings(): Promise<void>;
  openFullScreenSettings(): Promise<void>;
  openInCall(): Promise<void>;
  clearBlockedHistory(): Promise<void>;
}
