import { describe, expect, it } from 'vitest'
import { isDialableNumber } from '../src/domain/phoneNumber'
import { createContactDirectory, searchContactDirectory } from '../src/domain/contactDirectory'
import {
  decodeContacts,
  decodeHistory,
  decodeStatus,
  decodeHistorySnapshot,
  decodeConfirmation,
  decodeDialRequest,
} from '../src/platform/android/decoders'
import { scamVerification } from '../src/platform/spam/unavailableVerifier'
const validStatus = {
  contactsPermission: true,
  writeContactsPermission: false,
  callPermission: true,
  dialerAvailable: true,
  dialerHeld: false,
  notificationsPermission: true,
  fullScreenAllowed: true,
  hasActiveCall: false,
  callLogPermission: false,
  screeningAvailable: true,
  screeningHeld: true,
  blockNonContacts: true,
  protectionActive: true,
  screeningError: '',
  canDial: true,
  verification: 'unavailable',
}
describe('Boundaries of Android data', () => {
  it('accepts complete native state and rejects malformed state', () => {
    expect(decodeStatus(validStatus).protectionActive).toBe(true)
    expect(() => decodeStatus({ ...validStatus, contactsPermission: 'true' })).toThrow()
    expect(() => decodeStatus(null)).toThrow()
  })
  it.each(['contactsPermission', 'screeningHeld', 'screeningAvailable', 'blockNonContacts'])(
    'never presents active blocking without %s',
    (key) => {
      expect(decodeStatus({ ...validStatus, [key]: false }).protectionActive).toBe(false)
    },
  )
  it('does not present active blocking after a screening failure', () => {
    expect(
      decodeStatus({ ...validStatus, screeningError: 'Falha na consulta' }).protectionActive,
    ).toBe(false)
  })
  it('rejects malformed contact lists rather than rendering them as private data', () => {
    expect(() => decodeContacts({ items: [{ id: '1', name: {}, number: '123' }] })).toThrow()
    expect(() => decodeContacts({ items: null })).toThrow()
  })
  it('accepts a partial history warning and rejects malformed warning data', () => {
    expect(decodeHistorySnapshot({ items: [], warning: 'Histórico parcial' })).toEqual({
      entries: [],
      warning: 'Histórico parcial',
    })
    expect(decodeHistorySnapshot({ items: [] })).toEqual({ entries: [], warning: '' })
    expect(() => decodeHistorySnapshot({ items: [], warning: {} })).toThrow()
  })
  it('rejects invalid timestamps and unknown call states', () => {
    const record = {
      id: '1',
      number: '123',
      timestamp: 0,
      status: 'incoming',
      source: 'screening',
      isContact: false,
    }
    expect(decodeHistory({ items: [record] })[0].timestamp).toBe('1970-01-01T00:00:00.000Z')
    expect(() => decodeHistory({ items: [{ ...record, timestamp: Infinity }] })).toThrow()
    expect(() => decodeHistory({ items: [{ ...record, status: 'safe' }] })).toThrow()
  })
})
describe('Native action confirmations', () => {
  it('does not present success without explicit call or contact confirmation', () => {
    expect(() => decodeConfirmation({ saved: true }, 'saved')).not.toThrow()
    expect(() => decodeConfirmation({ started: true }, 'started')).not.toThrow()
    expect(() => decodeConfirmation({}, 'saved')).toThrow()
    expect(() => decodeConfirmation({ started: false }, 'started')).toThrow()
    expect(() => decodeConfirmation({ opened: true }, 'opened')).not.toThrow()
    expect(() => decodeConfirmation({ saved: true }, 'opened')).toThrow('editor')
  })
  it('validates external dial requests without turning them into calls', () => {
    expect(decodeDialRequest({ id: null, number: null })).toBeNull()
    expect(decodeDialRequest({ id: 'request-1', number: '123' })).toEqual({
      id: 'request-1',
      number: '123',
    })
    expect(() => decodeDialRequest({ id: 'request-1', number: {} })).toThrow()
  })
})
describe('Dialing and contact search', () => {
  it.each(['190', '+55 (11) 98888-1234', '*#06#', '123#'])(
    'accepts %s for system dialer confirmation',
    (number) => {
      expect(isDialableNumber(number)).toBe(true)
    },
  )
  it.each(['', '***', 'javascript:alert(1)', '12+34', '1'.repeat(31)])(
    'rejects invalid dial input %s',
    (number) => {
      expect(isDialableNumber(number)).toBe(false)
    },
  )
  it('searches contacts ignoring accents and phone formatting', () => {
    const contacts = [{ id: '1', name: 'José', number: '+55 (11) 98888-1234' }]
    expect(searchContactDirectory(createContactDirectory(contacts), 'JOSE')).toHaveLength(1)
    expect(searchContactDirectory(createContactDirectory(contacts), '988881234')).toHaveLength(1)
    expect(searchContactDirectory(createContactDirectory(contacts), 'ausente')).toHaveLength(0)
  })
  it('keeps verification unavailable without making a network request', async () => {
    expect(await scamVerification.verify('+5511988881234')).toEqual({
      status: 'unavailable',
      message: 'Verificação indisponível',
    })
  })
})
