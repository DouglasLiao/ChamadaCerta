import type {
  CallRecord,
  CallStatus,
  Contact,
  DeviceStatus,
  HistorySnapshot,
  DialRequest,
} from '../../domain/models';
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Resposta inválida do aparelho.');
  return value as Record<string, unknown>;
}
function text(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Texto inválido recebido do aparelho.');
  return value;
}
function boolean(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new Error('Estado inválido recebido do aparelho.');
  return value;
}
function optionalText(value: unknown): string | undefined {
  return value == null ? undefined : text(value);
}
function items(value: unknown): unknown[] {
  const payload = record(value);
  if (!Array.isArray(payload.items)) throw new Error('Lista inválida recebida do aparelho.');
  return payload.items;
}
export function decodeStatus(value: unknown): DeviceStatus {
  const data = record(value);
  if (data.verification !== 'unavailable')
    throw new Error('Serviço de verificação não configurado.');
  const status: DeviceStatus = {
    contactsPermission: boolean(data.contactsPermission),
    writeContactsPermission: boolean(data.writeContactsPermission),
    callPermission: boolean(data.callPermission),
    dialerAvailable: boolean(data.dialerAvailable),
    dialerHeld: boolean(data.dialerHeld),
    notificationsPermission: boolean(data.notificationsPermission),
    fullScreenAllowed: boolean(data.fullScreenAllowed),
    hasActiveCall: boolean(data.hasActiveCall),
    callLogPermission: boolean(data.callLogPermission),
    screeningAvailable: boolean(data.screeningAvailable),
    screeningHeld: boolean(data.screeningHeld),
    blockNonContacts: boolean(data.blockNonContacts),
    protectionActive: boolean(data.protectionActive),
    screeningError: text(data.screeningError),
    canDial: boolean(data.canDial),
    verification: 'unavailable',
  };
  status.protectionActive =
    status.protectionActive &&
    status.blockNonContacts &&
    status.contactsPermission &&
    status.screeningAvailable &&
    status.screeningHeld &&
    !status.screeningError;
  return status;
}
export function decodeContacts(value: unknown): Contact[] {
  return items(value).map((item) => {
    const data = record(item);
    return { id: text(data.id), name: text(data.name), number: text(data.number) };
  });
}
const CALL_STATUSES: readonly string[] = [
  'incoming',
  'outgoing',
  'answered',
  'missed',
  'blocked',
  'rejected',
];
export function decodeHistory(value: unknown): CallRecord[] {
  return items(value)
    .map((item): CallRecord => {
      const data = record(item);
      if (
        typeof data.timestamp !== 'number' ||
        !Number.isFinite(data.timestamp) ||
        !Number.isFinite(new Date(data.timestamp).getTime())
      )
        throw new Error('Horário inválido recebido do aparelho.');
      if (typeof data.status !== 'string' || !CALL_STATUSES.includes(data.status))
        throw new Error('Tipo de chamada inválido.');
      if (data.source !== 'screening' && data.source !== 'system')
        throw new Error('Origem de chamada inválida.');
      return {
        id: text(data.id),
        number: text(data.number),
        name: optionalText(data.name),
        timestamp: new Date(data.timestamp).toISOString(),
        status: data.status as CallStatus,
        source: data.source,
        isContact: boolean(data.isContact),
        duration: optionalText(data.duration),
        blockReason: optionalText(data.blockReason),
      };
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function decodeHistorySnapshot(value: unknown): HistorySnapshot {
  const payload = record(value);
  return { entries: decodeHistory(value), warning: optionalText(payload.warning) ?? '' };
}

export function decodeDialRequest(value: unknown): DialRequest | null {
  const payload = record(value);
  if (payload.id == null && payload.number == null) return null;
  return { id: text(payload.id), number: text(payload.number) };
}
export function decodeConfirmation(value: unknown, field: 'started' | 'saved'): void {
  if (record(value)[field] !== true)
    throw new Error(
      field === 'saved'
        ? 'A agenda não confirmou o salvamento.'
        : 'O Android não confirmou o início da chamada.',
    );
}
