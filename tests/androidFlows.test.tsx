import { deviceApi } from '../src/platform/android/client'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { AppProvider } from '../src/presentation/AppProvider'
import { App } from '../src/app/App'
import { nativeRequest } from '../src/platform/android/bridge'
import type { DeviceStatus } from '../src/domain/models'

let status: DeviceStatus
let requests: { method: string; args: Record<string, unknown> }[]
let contacts: unknown[]
let history: unknown[]
let historyWarning: string
let failures: Record<string, string>
let allowContacts = true
let allowScreening = true
let allowDialer = true
let allowCalls = true
let allowWrite = true
let dialIntent: { id: string; number: string } | null
function installBridge() {
  const port: NonNullable<Window['ChamadaCertaNative']> = {
    postMessage(raw) {
      const { id, method, args } = JSON.parse(raw)
      requests.push({ method, args })
      let result: unknown = {}
      if (method === 'status') result = { ...status }
      if (method === 'dialRequest') result = dialIntent ?? { id: null, number: null }
      if (method === 'requestDefaultDialer') {
        status.dialerHeld = allowDialer
        result = { ...status }
      }
      if (method === 'requestCallPermission') {
        status.callPermission = allowCalls
        result = { ...status }
      }
      if (method === 'requestWriteContacts') {
        status.writeContactsPermission = allowWrite
        result = { ...status }
      }
      if (method === 'requestNotifications') {
        status.notificationsPermission = true
        result = { ...status }
      }
      if (method === 'dial') result = { started: true }
      if (method === 'saveContact') {
        result = { saved: true }
        if (!failures[method])
          contacts = [{ id: 'saved-1', name: args.name, number: args.number }, ...contacts]
      }
      if (method === 'contacts') result = { items: contacts }
      if (method === 'editContact') result = { opened: true }
      if (method === 'history') result = { items: history, warning: historyWarning }
      if (method === 'requestContacts') {
        status.contactsPermission = allowContacts
        result = { ...status }
      }
      if (method === 'requestScreening') {
        status.screeningHeld = allowScreening
        result = { ...status }
      }
      if (method === 'setBlocking') {
        if (!failures[method]) status.blockNonContacts = args.enabled
        status.protectionActive =
          status.blockNonContacts && status.contactsPermission && status.screeningHeld
        result = { ...status }
      }
      queueMicrotask(() =>
        port.onmessage?.({
          data: JSON.stringify(failures[method] ? { id, error: failures[method] } : { id, result }),
        }),
      )
    },
  }
  window.ChamadaCertaNative = port
}
const mount = () =>
  render(
    <AppProvider gateway={deviceApi}>
      <App />
    </AppProvider>,
  )
beforeEach(() => {
  cleanup()
  localStorage.clear()
  requests = []
  contacts = []
  history = []
  historyWarning = ''
  failures = {}
  allowContacts = true
  allowScreening = true
  allowDialer = true
  allowCalls = true
  allowWrite = true
  dialIntent = null
  status = {
    writeContactsPermission: false,
    callPermission: true,
    dialerAvailable: true,
    dialerHeld: false,
    notificationsPermission: true,
    fullScreenAllowed: true,
    hasActiveCall: false,
    contactsPermission: false,
    callLogPermission: false,
    screeningAvailable: true,
    screeningHeld: false,
    blockNonContacts: false,
    protectionActive: false,
    screeningError: '',
    canDial: true,
    verification: 'unavailable',
  }
  installBridge()
})
afterEach(() => {
  cleanup()
  delete window.ChamadaCertaNative
  vi.useRealTimers()
})

describe('Android bridge and mobile flows', () => {
  it('bounds a large agenda to 50 rows and searches without requesting the native agenda again', async () => {
    status.contactsPermission = true
    contacts = Array.from({ length: 10000 }, (_, index) => ({
      id: `device_${index + 1}`,
      name: `Pessoa ${String(index).padStart(5, '0')}`,
      number: `219${String(index).padStart(8, '0')}`,
    }))
    mount()
    await screen.findByText('Bloqueio de desconhecidos inativo')
    fireEvent.click(screen.getByRole('button', { name: 'Contatos' }))
    const list = await screen.findByRole('list', { name: 'Contatos encontrados' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(50)
    const requestCount = requests.length
    fireEvent.click(screen.getByRole('button', { name: 'Próximos' }))
    expect(screen.getByText('Página 2 de 200')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Buscar por nome ou número'), {
      target: { value: 'Pessoa 09999' },
    })
    expect(await screen.findByText('Pessoa 09999')).toBeInTheDocument()
    expect(
      within(screen.getByRole('list', { name: 'Contatos encontrados' })).getAllByRole('listitem'),
    ).toHaveLength(1)
    expect(requests).toHaveLength(requestCount)
    fireEvent.change(screen.getByLabelText('Buscar por nome ou número'), { target: { value: '' } })
    expect(await screen.findByText('Página 1 de 200')).toBeInTheDocument()
  })

  it('groups equivalent numbers and edits only the original record selected by the user', async () => {
    status.contactsPermission = true
    contacts = [
      { id: 'device_41', name: 'José', number: '021987654321' },
      { id: 'device_42', name: 'Trabalho', number: '+5521987654321' },
    ]
    mount()
    await screen.findByText('Bloqueio de desconhecidos inativo')
    fireEvent.click(screen.getByRole('button', { name: 'Contatos' }))
    expect(await screen.findByText('2 registros agrupados')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Ligar para/ })).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Escolher cadastro de José para editar' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Editar cadastro Trabalho, +5521987654321' }),
    )
    await waitFor(() =>
      expect(requests.find((request) => request.method === 'editContact')?.args).toEqual({
        id: 'device_42',
      }),
    )
    expect(
      requests.some(
        (request) => request.method === 'saveContact' || request.method === 'requestWriteContacts',
      ),
    ).toBe(false)
    expect(screen.queryByText('Contato salvo na agenda.')).not.toBeInTheDocument()
    contacts = [{ id: 'device_41', name: 'José atualizado', number: '021987654321' }]
    await act(async () => {
      window.dispatchEvent(new Event('chamadacerta:refresh'))
    })
    expect(await screen.findByText('José atualizado')).toBeInTheDocument()
    expect(screen.queryByText('2 registros agrupados')).not.toBeInTheDocument()
  })

  it('keeps contacts visible and reports an editor launch failure', async () => {
    status.contactsPermission = true
    contacts = [{ id: 'device_1', name: 'Maria', number: '21987654321' }]
    failures.editContact = 'Não foi possível abrir o editor de contatos.'
    mount()
    await screen.findByText('Bloqueio de desconhecidos inativo')
    fireEvent.click(screen.getByRole('button', { name: 'Contatos' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Editar Maria' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível abrir o editor')
    expect(screen.getByText('Maria')).toBeInTheDocument()
  })

  it('requests permissions only after user interaction and loads device contacts', async () => {
    contacts = [
      {
        id: 'real-1',
        name: 'Contato do aparelho',
        number: '+55 11 98765-1234',
        rawNumber: '11987651234',
      },
    ]
    mount()
    await screen.findByText('Bloqueio de desconhecidos inativo')
    expect(requests.some((r) => r.method.startsWith('request'))).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Contatos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Autorizar contatos' }))
    expect(await screen.findByText('Contato do aparelho')).toBeInTheDocument()
    expect(requests.some((request) => request.method === 'contacts')).toBe(true)
  })
  it('keeps protection inactive after a denied contacts permission', async () => {
    allowContacts = false
    mount()
    await screen.findByText('Bloqueio de desconhecidos inativo')
    fireEvent.click(screen.getByRole('button', { name: 'Proteção' }))
    fireEvent.click(screen.getByRole('button', { name: 'Autorizar' }))
    await waitFor(() => expect(requests.some((r) => r.method === 'requestContacts')).toBe(true))
    expect(screen.queryByText('Bloqueio de desconhecidos ativo')).not.toBeInTheDocument()
  })
  it('shows active protection only after native status confirms contacts, role and preference', async () => {
    status.contactsPermission = true
    status.screeningHeld = true
    mount()
    await screen.findByText('Bloqueio de desconhecidos inativo')
    fireEvent.click(screen.getByRole('button', { name: 'Proteção' }))
    fireEvent.click(screen.getByRole('switch'))
    expect(await screen.findByText('Bloqueio de desconhecidos ativo')).toBeInTheDocument()
    expect(requests.find((r) => r.method === 'setBlocking')?.args).toEqual({ enabled: true })
    expect(localStorage.getItem('cc_app_v2_rules')).toBeNull()
  })
  it('does not claim success if native preference persistence fails', async () => {
    failures.setBlocking = 'Não foi possível salvar a preferência.'
    mount()
    await screen.findByText('Bloqueio de desconhecidos inativo')
    fireEvent.click(screen.getByRole('button', { name: 'Proteção' }))
    fireEvent.click(screen.getByRole('switch'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar')
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })
  it('clears private contact data and active state when access is revoked on resume', async () => {
    status.contactsPermission = true
    status.screeningHeld = true
    status.blockNonContacts = true
    status.protectionActive = true
    contacts = [
      {
        id: 'device1',
        name: 'Contato privado',
        number: '+55 11 99988-7766',
        rawNumber: '11999887766',
      },
    ]
    mount()
    await screen.findByText('Bloqueio de desconhecidos ativo')
    fireEvent.click(screen.getByRole('button', { name: 'Contatos' }))
    expect(screen.getByText('Contato privado')).toBeInTheDocument()
    status.contactsPermission = false
    status.protectionActive = false
    await act(async () => {
      window.dispatchEvent(new Event('chamadacerta:refresh'))
    })
    await screen.findByText('Permitir acesso aos contatos')
    expect(screen.queryByText('Contato privado')).not.toBeInTheDocument()
  })
  it('shows actual blocking records while distinguishing screening attempts from completed calls', async () => {
    history = [
      {
        id: 'blocked1',
        number: '+5511987651234',
        timestamp: 1793097000000,
        status: 'blocked',
        source: 'screening',
        blockReason: 'Número fora dos contatos',
        isContact: false,
      },
    ]
    mount()
    await screen.findByRole('button', { name: /Detalhes:.*Bloqueada/ })
    fireEvent.click(screen.getByRole('button', { name: /Detalhes:/ }))
    expect(screen.getByText('Número fora dos contatos')).toBeInTheDocument()
    expect(screen.getByText('Número não verificado')).toBeInTheDocument()
  })
  it('sends dial handoff to Android without creating a synthetic history record', async () => {
    mount()
    await screen.findByText('Bloqueio de desconhecidos inativo')
    fireEvent.click(screen.getByRole('button', { name: 'Teclado' }))
    ;['1', '9', '0'].forEach((name) => fireEvent.click(screen.getByRole('button', { name })))
    fireEvent.click(screen.getByRole('button', { name: 'Ligar' }))
    await waitFor(() =>
      expect(requests.find((r) => r.method === 'dial')?.args).toEqual({ number: '190' }),
    )
    expect(history).toHaveLength(0)
  })
  it('shows a recoverable error for unavailable native data', async () => {
    failures.contacts = 'A agenda não respondeu.'
    status.contactsPermission = true
    mount()
    await screen.findByText('Bloqueio de desconhecidos inativo')
    fireEvent.click(screen.getByRole('button', { name: 'Contatos' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('A agenda não respondeu.')
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeEnabled()
  })
  it('preserves local blocking records when the system history is unavailable', async () => {
    historyWarning =
      'Não foi possível ler o histórico do aparelho. Mostrando apenas registros do aplicativo.'
    history = [
      {
        id: 'local-1',
        number: '+5511988881234',
        timestamp: 1000,
        status: 'blocked',
        source: 'screening',
        isContact: false,
      },
    ]
    mount()
    expect(await screen.findByRole('button', { name: /Detalhes:.*Bloqueada/ })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(historyWarning)
  })
  it('removes selected call details when system access is revoked and the record disappears', async () => {
    status.callLogPermission = true
    history = [
      {
        id: 'system-private',
        name: 'Identidade privada',
        number: '+5511988881234',
        timestamp: 1000,
        status: 'incoming',
        source: 'system',
        isContact: true,
      },
    ]
    mount()
    fireEvent.click(await screen.findByRole('button', { name: /Detalhes: Identidade privada/ }))
    expect(screen.getByText('Detalhes da chamada')).toBeInTheDocument()
    status.callLogPermission = false
    history = []
    await act(async () => {
      window.dispatchEvent(new Event('chamadacerta:refresh'))
    })
    await waitFor(() => expect(screen.queryByText('Detalhes da chamada')).not.toBeInTheDocument())
    expect(screen.queryByText('Identidade privada')).not.toBeInTheDocument()
  })
  it('updates the selected details when the same call record changes', async () => {
    history = [
      {
        id: 'local-1',
        number: '+5511988881234',
        timestamp: 1000,
        status: 'incoming',
        source: 'screening',
        isContact: false,
      },
    ]
    mount()
    fireEvent.click(await screen.findByRole('button', { name: /Detalhes:/ }))
    history = [
      {
        id: 'local-1',
        number: '+5511988881234',
        timestamp: 1000,
        status: 'blocked',
        source: 'screening',
        isContact: false,
        blockReason: 'Motivo atualizado',
      },
    ]
    await act(async () => {
      window.dispatchEvent(new Event('chamadacerta:refresh'))
    })
    expect(await screen.findByText('Motivo atualizado')).toBeInTheDocument()
  })
  it('clears stale source warnings when the device status itself becomes unavailable', async () => {
    historyWarning = 'Aviso anterior do histórico'
    mount()
    expect(await screen.findByRole('alert')).toHaveTextContent(historyWarning)
    failures.status = 'O Android não respondeu.'
    await act(async () => {
      window.dispatchEvent(new Event('chamadacerta:refresh'))
    })
    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(1))
    expect(screen.getByRole('alert')).toHaveTextContent('O Android não respondeu.')
    expect(screen.queryByText(historyWarning)).not.toBeInTheDocument()
  })
  it('lets the user choose the default phone and reflects the native role', async () => {
    mount()
    const button = await screen.findByRole('button', { name: 'Definir como telefone padrão' })
    await waitFor(() => expect(button).toBeEnabled())
    fireEvent.click(button)
    expect(await screen.findByText('ChamadaCerta é seu telefone padrão')).toBeInTheDocument()
    expect(requests.some((request) => request.method === 'requestDefaultDialer')).toBe(true)
  })
  it('does not claim the default role when the Android selection is denied', async () => {
    allowDialer = false
    mount()
    const button = await screen.findByRole('button', { name: 'Definir como telefone padrão' })
    await waitFor(() => expect(button).toBeEnabled())
    fireEvent.click(button)
    await waitFor(() =>
      expect(requests.some((request) => request.method === 'requestDefaultDialer')).toBe(true),
    )
    expect(screen.queryByText('ChamadaCerta é seu telefone padrão')).not.toBeInTheDocument()
  })
  it('asks for call permission on demand and only then starts the requested number', async () => {
    status.callPermission = false
    mount()
    await screen.findByText('Bloqueio de desconhecidos inativo')
    fireEvent.click(screen.getByRole('button', { name: 'Teclado' }))
    ;['1', '2', '3'].forEach((name) => fireEvent.click(screen.getByRole('button', { name })))
    fireEvent.click(screen.getByRole('button', { name: 'Ligar' }))
    await waitFor(() => expect(requests.some((request) => request.method === 'dial')).toBe(true))
    const permissionIndex = requests.findIndex(
      (request) => request.method === 'requestCallPermission',
    )
    expect(permissionIndex).toBeGreaterThanOrEqual(0)
    expect(requests.findIndex((request) => request.method === 'dial')).toBeGreaterThan(
      permissionIndex,
    )
  })
  it('does not place a call after permission is denied', async () => {
    status.callPermission = false
    allowCalls = false
    mount()
    await screen.findByText('Bloqueio de desconhecidos inativo')
    fireEvent.click(screen.getByRole('button', { name: 'Teclado' }))
    fireEvent.change(screen.getByLabelText('Número de telefone'), { target: { value: '123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ligar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Autorize chamadas telefônicas')
    expect(requests.some((request) => request.method === 'dial')).toBe(false)
  })
  it('saves a real contact draft through the native write operation', async () => {
    status.contactsPermission = true
    mount()
    await screen.findByText('Bloqueio de desconhecidos inativo')
    fireEvent.click(screen.getByRole('button', { name: 'Contatos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar contato na agenda' }))
    fireEvent.change(screen.getByLabelText('Nome do contato'), {
      target: { value: 'Contato novo' },
    })
    fireEvent.change(screen.getByLabelText('Telefone do contato'), {
      target: { value: '+55 11 98888-1234' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar contato' }))
    expect(await screen.findByText('Contato salvo na agenda.')).toBeInTheDocument()
    expect(screen.getByText('Contato novo')).toBeInTheDocument()
    expect(requests.find((request) => request.method === 'saveContact')?.args).toEqual({
      name: 'Contato novo',
      number: '+5511988881234',
    })
  })
  it('keeps the draft and shows an error if contact saving fails', async () => {
    status.writeContactsPermission = true
    failures.saveContact = 'Não foi possível salvar o contato.'
    mount()
    await screen.findByText('Bloqueio de desconhecidos inativo')
    fireEvent.click(screen.getByRole('button', { name: 'Contatos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar contato na agenda' }))
    fireEvent.change(screen.getByLabelText('Nome do contato'), { target: { value: 'Rascunho' } })
    fireEvent.change(screen.getByLabelText('Telefone do contato'), {
      target: { value: '11988881234' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar contato' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar')
    expect(screen.getByLabelText('Nome do contato')).toHaveValue('Rascunho')
    expect(screen.queryByText('Contato salvo na agenda.')).not.toBeInTheDocument()
  })
  it('does not write a contact when write permission is denied', async () => {
    allowWrite = false
    mount()
    await screen.findByText('Bloqueio de desconhecidos inativo')
    fireEvent.click(screen.getByRole('button', { name: 'Contatos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar contato na agenda' }))
    fireEvent.change(screen.getByLabelText('Nome do contato'), { target: { value: 'Rascunho' } })
    fireEvent.change(screen.getByLabelText('Telefone do contato'), {
      target: { value: '11988881234' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar contato' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Autorize salvar contatos')
    expect(requests.some((request) => request.method === 'saveContact')).toBe(false)
  })
  it('opens the dialpad with an external Android number, without automatically calling', async () => {
    dialIntent = { id: 'android-intent-1', number: '+5511988881234' }
    render(
      <StrictMode>
        <AppProvider gateway={deviceApi}>
          <App />
        </AppProvider>
      </StrictMode>,
    )
    expect(await screen.findByLabelText('Número de telefone')).toHaveValue('+5511988881234')
    expect(requests.some((request) => request.method === 'dial')).toBe(false)
    fireEvent.change(screen.getByLabelText('Número de telefone'), { target: { value: '123' } })
    await act(async () => {
      window.dispatchEvent(new Event('chamadacerta:dial-request'))
    })
    expect(screen.getByLabelText('Número de telefone')).toHaveValue('123')
    dialIntent = { id: 'android-intent-2', number: '456' }
    await act(async () => {
      window.dispatchEvent(new Event('chamadacerta:dial-request'))
    })
    await waitFor(() => expect(screen.getByLabelText('Número de telefone')).toHaveValue('456'))
  })
  it.each(['dialer', 'history'])('prefills a contact from the %s flow', async (flow) => {
    const number = '11988881234'
    history = [
      {
        id: 'system-1',
        number,
        timestamp: 1000,
        status: 'incoming',
        source: 'system',
        isContact: false,
      },
    ]
    mount()
    await screen.findByText('Bloqueio de desconhecidos inativo')
    if (flow === 'dialer') {
      fireEvent.click(screen.getByRole('button', { name: 'Teclado' }))
      fireEvent.change(screen.getByLabelText('Número de telefone'), { target: { value: number } })
    } else fireEvent.click(screen.getByRole('button', { name: /Detalhes:/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar na agenda' }))
    expect(screen.getByLabelText('Telefone do contato')).toHaveValue(number)
  })
  it('rejects missing and unresponsive bridges instead of presenting fictitious success', async () => {
    delete window.ChamadaCertaNative
    await expect(nativeRequest('status')).rejects.toThrow('somente no aplicativo Android')
    vi.useFakeTimers()
    window.ChamadaCertaNative = { postMessage() {} }
    const request = nativeRequest('status')
    const assertion = expect(request).rejects.toThrow('não respondeu')
    await vi.advanceTimersByTimeAsync(15000)
    await assertion
  })
})
