import { describe, expect, it } from 'vitest'
import { contactNumberKey } from '../src/domain/contactNumber'
import { createContactDirectory, searchContactDirectory } from '../src/domain/contactDirectory'

describe('equivalência conservadora de números brasileiros', () => {
  it.each([
    '21987654321',
    '021987654321',
    '+55 (21) 98765-4321',
    '5521987654321',
    '0 21 21 98765-4321',
    '0 15 21 98765-4321',
    '005521987654321',
  ])('agrupa %s pelo mesmo DDD e assinante', (number) => {
    expect(contactNumberKey(number)).toBe('br:21987654321')
  })

  it('suporta fixos e preserva o DDD 55 quando não é código de país', () => {
    expect(contactNumberKey('02121234567')).toBe(contactNumberKey('+552121234567'))
    expect(contactNumberKey('55987654321')).toBe('br:55987654321')
  })

  it.each([
    ['+5521987654321', '+5511987654321'],
    ['+5521987654321', '987654321'],
    ['+5521987654321', '2187654321'],
    ['+5521987654321', '+121987654321'],
    ['+5521987654321', '021987654321 ramal 2'],
    ['190', '0190'],
    ['08001234567', '+558001234567'],
    ['+5521987654321', '+55021987654321'],
  ])('não une números diferentes ou ambíguos: %s e %s', (first, second) => {
    expect(contactNumberKey(first)).not.toBe(contactNumberKey(second))
  })
})

describe('índice da agenda', () => {
  const contacts = [
    { id: 'device_1', name: 'José Silva', number: '021987654321' },
    { id: 'device_2', name: 'Zé Trabalho', number: '+55 (21) 98765-4321' },
    { id: 'device_3', name: 'Ana', number: '+55 11 98765-4321' },
    { id: 'device_4', name: 'José Silva', number: '+55 21 91234-5678' },
  ]

  it('mantém os cadastros originais, separa números diferentes e busca todos os nomes do grupo', () => {
    const directory = createContactDirectory(contacts)
    expect(directory).toHaveLength(3)
    const group = searchContactDirectory(directory, 'ZE TRABALHO')[0]
    expect(group.members.map((member) => member.id)).toEqual(['device_1', 'device_2'])
    expect(group.primary.number).toBe('021987654321')
    expect(searchContactDirectory(directory, 'JOSE')).toHaveLength(2)
    expect(searchContactDirectory(directory, '+5521987654321')).toEqual([group])
    expect(searchContactDirectory(directory, '021987654321')).toEqual([group])
    expect(searchContactDirectory(directory, '0 15 21 987654321')).toEqual([group])
    expect(searchContactDirectory(directory, '98765')).toHaveLength(2)
    expect(searchContactDirectory(directory, 'inexistente')).toHaveLength(0)
    expect(contacts[0].number).toBe('021987654321')
  })

  it('reaproveita o índice e não duplica um mesmo registro recebido duas vezes', () => {
    const directory = createContactDirectory([...contacts, contacts[0]])
    expect(searchContactDirectory(directory, '  ')).toBe(directory)
    expect(directory.reduce((count, group) => count + group.members.length, 0)).toBe(4)
    expect(searchContactDirectory(directory, 'Jose')[0]).toBe(
      searchContactDirectory(directory, 'Silva')[0],
    )
  })

  it('agrupa 10000 cadastros sem busca quadrática ou união por nome', () => {
    const large = Array.from({ length: 10000 }, (_, index) => ({
      id: `device_${index + 1}`,
      name: `Contato ${index % 5000}`,
      number: `${index >= 5000 ? '+55' : '0'}219${String(index % 5000).padStart(8, '0')}`,
    }))
    const directory = createContactDirectory(large)
    expect(directory).toHaveLength(5000)
    expect(directory.every((group) => group.members.length === 2)).toBe(true)
    expect(searchContactDirectory(directory, 'Contato 4999')).toHaveLength(1)
  })
})
