import { describe, expect, it, vi } from 'vitest'
import { placeCall } from '../src/application/usecases/placeCall'
import { saveContact } from '../src/application/usecases/saveContact'
import type { DeviceStatus } from '../src/domain/models'

const denied: DeviceStatus = {
  contactsPermission: false,
  writeContactsPermission: false,
  callPermission: false,
  dialerAvailable: true,
  dialerHeld: false,
  notificationsPermission: false,
  fullScreenAllowed: false,
  hasActiveCall: false,
  callLogPermission: false,
  screeningAvailable: true,
  screeningHeld: false,
  blockNonContacts: false,
  protectionActive: false,
  screeningError: '',
  canDial: false,
  verification: 'unavailable',
}

function gateway(status = denied) {
  return {
    dial: vi.fn<(number: string) => Promise<void>>().mockResolvedValue(undefined),
    saveContact: vi
      .fn<(name: string, number: string) => Promise<void>>()
      .mockResolvedValue(undefined),
    requestCallPermission: vi.fn().mockResolvedValue(status),
    requestWriteContacts: vi.fn().mockResolvedValue(status),
  }
}

describe('casos de uso sem plataforma', () => {
  it('não pede permissão nem liga com número inválido', async () => {
    const device = gateway()
    await expect(placeCall(device, 'javascript:123', false)).rejects.toThrow('Confira')
    expect(device.requestCallPermission).not.toHaveBeenCalled()
    expect(device.dial).not.toHaveBeenCalled()
  })

  it('não liga após recusa de permissão', async () => {
    const device = gateway()
    await expect(placeCall(device, '11988881234', false)).rejects.toThrow('Autorize')
    expect(device.dial).not.toHaveBeenCalled()
  })

  it('normaliza e liga após autorização', async () => {
    const device = gateway({ ...denied, callPermission: true })
    await placeCall(device, '+55 (11) 98888-1234', false)
    expect(device.requestCallPermission).toHaveBeenCalledOnce()
    expect(device.dial).toHaveBeenCalledExactlyOnceWith('+5511988881234')
  })

  it('propaga falha do Telecom sem pedir de novo uma permissão já concedida', async () => {
    const device = gateway()
    device.dial.mockRejectedValueOnce(new Error('Telefonia indisponível'))
    await expect(placeCall(device, '11988881234', true)).rejects.toThrow('Telefonia')
    expect(device.requestCallPermission).not.toHaveBeenCalled()
  })

  it.each(['', ' '.repeat(3), 'a'.repeat(121)])(
    'rejeita nome inválido antes de pedir escrita: %s',
    async (name) => {
      const device = gateway()
      await expect(saveContact(device, name, '11988881234', false)).rejects.toThrow('nome')
      expect(device.requestWriteContacts).not.toHaveBeenCalled()
      expect(device.saveContact).not.toHaveBeenCalled()
    },
  )

  it('não grava contato após recusa', async () => {
    const device = gateway()
    await expect(saveContact(device, 'Maria', '11988881234', false)).rejects.toThrow('Autorize')
    expect(device.saveContact).not.toHaveBeenCalled()
  })

  it('normaliza os dados e grava somente após autorização', async () => {
    const device = gateway({ ...denied, writeContactsPermission: true })
    await saveContact(device, '  Maria  ', '+55 (11) 98888-1234', false)
    expect(device.requestWriteContacts).toHaveBeenCalledOnce()
    expect(device.saveContact).toHaveBeenCalledExactlyOnceWith('Maria', '+5511988881234')
  })

  it('propaga falha da agenda sem pedir novamente permissão concedida', async () => {
    const device = gateway()
    device.saveContact.mockRejectedValueOnce(new Error('Agenda indisponível'))
    await expect(saveContact(device, 'Maria', '11988881234', true)).rejects.toThrow('Agenda')
    expect(device.requestWriteContacts).not.toHaveBeenCalled()
  })
})
