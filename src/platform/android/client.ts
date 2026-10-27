import type { DeviceGateway } from '../../application/ports/DeviceGateway';
import { isNativeDevice, nativeRequest } from './bridge';
import type { NativeMethod } from './bridge';
import {
  decodeContacts,
  decodeHistorySnapshot,
  decodeStatus,
  decodeDialRequest,
  decodeConfirmation,
} from './decoders';
const command = async (method: NativeMethod): Promise<void> => {
  await nativeRequest(method);
};
export const deviceApi = {
  isAvailable: isNativeDevice,
  dialRequest: async () => decodeDialRequest(await nativeRequest('dialRequest')),
  requestDefaultDialer: async () => decodeStatus(await nativeRequest('requestDefaultDialer')),
  requestCallPermission: async () => decodeStatus(await nativeRequest('requestCallPermission')),
  requestWriteContacts: async () => decodeStatus(await nativeRequest('requestWriteContacts')),
  requestNotifications: async () => decodeStatus(await nativeRequest('requestNotifications')),
  openFullScreenSettings: () => command('openFullScreenSettings'),
  openInCall: () => command('openInCall'),
  saveContact: async (name: string, number: string) =>
    decodeConfirmation(await nativeRequest('saveContact', { name, number }), 'saved'),
  status: async () => decodeStatus(await nativeRequest('status')),
  contacts: async () => decodeContacts(await nativeRequest('contacts')),
  history: async () => decodeHistorySnapshot(await nativeRequest('history')),
  setBlocking: async (enabled: boolean) =>
    decodeStatus(await nativeRequest('setBlocking', { enabled })),
  requestContacts: async () => decodeStatus(await nativeRequest('requestContacts')),
  requestHistory: async () => decodeStatus(await nativeRequest('requestHistory')),
  requestScreening: async () => decodeStatus(await nativeRequest('requestScreening')),
  openSettings: () => command('openSettings'),
  dial: async (number: string) =>
    decodeConfirmation(await nativeRequest('dial', { number }), 'started'),
  clearBlockedHistory: () => command('clearBlockedHistory'),
} satisfies DeviceGateway;
