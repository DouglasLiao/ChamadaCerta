import type { Contact } from './models'
import { contactNumberKey } from './contactNumber'

export interface ContactGroup {
  key: string
  primary: Contact
  members: Contact[]
  searchNames: string
  searchNumbers: string
}

const normalizeName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')

// Build once per agenda snapshot, not once per keystroke.
export function createContactDirectory(contacts: readonly Contact[]): ContactGroup[] {
  const groups = new Map<string, ContactGroup>()
  const seen = new Set<string>()
  for (const contact of contacts) {
    if (seen.has(contact.id)) continue
    seen.add(contact.id)
    const key = contactNumberKey(contact.number)
    let group = groups.get(key)
    if (!group) {
      group = {
        key,
        primary: contact,
        members: [],
        searchNames: '',
        searchNumbers: key.slice(key.indexOf(':') + 1),
      }
      groups.set(key, group)
    }
    group.members.push(contact)
    group.searchNames += `\0${normalizeName(contact.name)}`
    group.searchNumbers += `\0${contact.number.replace(/\D/g, '')}`
  }
  const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true })
  return [...groups.values()].sort((a, b) => collator.compare(a.primary.name, b.primary.name))
}

export function searchContactDirectory(
  directory: readonly ContactGroup[],
  query: string,
): readonly ContactGroup[] {
  const trimmed = query.trim()
  if (!trimmed) return directory
  const name = normalizeName(trimmed)
  const digits = /^[+\d\s().-]+$/.test(trimmed) ? trimmed.replace(/\D/g, '') : ''
  const key = digits ? contactNumberKey(trimmed) : ''
  return directory.filter(
    (group) =>
      group.searchNames.includes(name) ||
      (!!digits && (group.key === key || group.searchNumbers.includes(digits))),
  )
}
