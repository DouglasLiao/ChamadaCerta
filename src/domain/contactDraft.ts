import { normalizeDialNumber } from './phoneNumber';
export interface ContactDraft {
  name: string;
  number: string;
}
export function validateContactDraft(name: string, number: string): ContactDraft {
  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > 120)
    throw new Error('Informe um nome de até 120 caracteres.');
  const normalized = normalizeDialNumber(number);
  if (!normalized) throw new Error('Informe um telefone válido.');
  return { name: trimmedName, number: normalized };
}
