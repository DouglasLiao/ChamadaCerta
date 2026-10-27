import type { Contact } from '../../domain/models';
const normalizeName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
export function filterContacts(contacts: readonly Contact[], query: string): Contact[] {
  const name = normalizeName(query.trim());
  const digits = query.replace(/\D/g, '');
  return contacts.filter(
    (contact) =>
      normalizeName(contact.name).includes(name) ||
      (!!digits && contact.number.replace(/\D/g, '').includes(digits)),
  );
}
