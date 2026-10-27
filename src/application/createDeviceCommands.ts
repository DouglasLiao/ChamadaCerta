import type { DeviceGateway } from './ports/DeviceGateway';
import { placeCall } from './usecases/placeCall';
import { saveContact } from './usecases/saveContact';
export function createDeviceCommands(
  gateway: DeviceGateway,
  canCall: boolean,
  canWriteContacts: boolean,
) {
  return {
    dialRequest: () => gateway.dialRequest(),
    requestDefaultDialer: () => gateway.requestDefaultDialer(),
    requestCallPermission: () => gateway.requestCallPermission(),
    requestContacts: () => gateway.requestContacts(),
    requestHistory: () => gateway.requestHistory(),
    requestScreening: () => gateway.requestScreening(),
    requestNotifications: () => gateway.requestNotifications(),
    openSettings: () => gateway.openSettings(),
    openFullScreenSettings: () => gateway.openFullScreenSettings(),
    openInCall: () => gateway.openInCall(),
    setBlocking: (enabled: boolean) => gateway.setBlocking(enabled),
    clearBlockedHistory: () => gateway.clearBlockedHistory(),
    placeCall: (number: string) => placeCall(gateway, number, canCall),
    saveContact: (name: string, number: string) =>
      saveContact(gateway, name, number, canWriteContacts),
  };
}
