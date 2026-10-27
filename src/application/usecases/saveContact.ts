import { validateContactDraft } from '../../domain/contactDraft';
import type { ContactGateway } from '../ports/DeviceGateway';
export async function saveContact(
  gateway: ContactGateway,
  name: string,
  number: string,
  permissionGranted: boolean,
): Promise<void> {
  const draft = validateContactDraft(name, number);
  if (!permissionGranted) {
    const permission = await gateway.requestWriteContacts();
    if (!permission.writeContactsPermission)
      throw new Error('Autorize salvar contatos nas permissões do aplicativo.');
  }
  await gateway.saveContact(draft.name, draft.number);
}
