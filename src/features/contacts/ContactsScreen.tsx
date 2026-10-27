import { useState } from 'react';
import { Search, Phone, Plus } from 'lucide-react';
import { useApp } from '../../presentation/AppProvider';
import { EmptyState } from '../../shared/ui/EmptyState';
import { CallAction } from '../phone/CallAction';
import { ContactEditor } from './ContactEditor';
import { filterContacts } from './filterContacts';
export function ContactsScreen() {
  const device = useApp();
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(false);
  const matches = filterContacts(device.contacts, query);
  const canRequestPermission =
    device.native && !device.loading && !device.status?.contactsPermission;
  return (
    <section>
      <div className="cc-title">
        <div>
          <h2>Contatos</h2>
          <p>{device.contacts.length} contatos no aparelho</p>
        </div>
        <button
          aria-label="Adicionar contato na agenda"
          disabled={!device.native || device.busy}
          onClick={() => {
            setSaved(false);
            setAdding(true);
          }}
        >
          <Plus />
        </button>
      </div>
      {adding && (
        <ContactEditor
          onCancel={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            setQuery('');
            setSaved(true);
          }}
        />
      )}
      {saved && (
        <p className="cc-notice" role="status">
          Contato salvo na agenda.
        </p>
      )}
      <label className="cc-search">
        <Search size={20} aria-hidden="true" />
        <input
          aria-label="Buscar por nome ou número"
          placeholder="Buscar por nome ou número"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {canRequestPermission && (
        <div className="cc-card">
          <h3>Permitir acesso aos contatos</h3>
          <p>
            Exiba sua agenda e permita que a proteção reconheça quem você conhece. Seus contatos não
            saem do aparelho.
          </p>
          <button
            className="cc-primary"
            disabled={device.busy}
            onClick={() => void device.action(device.commands.requestContacts)}
          >
            Autorizar contatos
          </button>
          <button
            className="cc-text-button"
            disabled={device.busy}
            onClick={() => void device.action(device.commands.openSettings)}
          >
            Abrir permissões
          </button>
        </div>
      )}
      {device.contactsError && (
        <div className="cc-notice" role="alert">
          {device.contactsError}
          <button disabled={device.loading} onClick={() => void device.refresh()}>
            Tentar novamente
          </button>
        </div>
      )}
      {device.loading ? (
        <EmptyState title="Carregando contatos…">Consultando a agenda do aparelho.</EmptyState>
      ) : !matches.length ? (
        <EmptyState
          title={device.contacts.length ? 'Nenhum resultado' : 'Seus contatos, por perto'}
        >
          {device.contacts.length
            ? 'Tente outro nome ou número.'
            : device.status?.contactsPermission
              ? 'Nenhum telefone encontrado na agenda. Adicione um contato usando o botão acima.'
              : 'Autorize o acesso no Android para exibir os contatos da sua agenda.'}
        </EmptyState>
      ) : (
        <ul className="cc-list">
          {matches.map((contact) => (
            <li className="cc-row" key={contact.id}>
              <span className="cc-avatar" aria-hidden="true">
                {contact.name.charAt(0)}
              </span>
              <div className="cc-row-text">
                <strong>{contact.name}</strong>
                <p>{contact.number}</p>
              </div>
              <CallAction number={contact.number} label={`Ligar para ${contact.name}`}>
                <Phone size={20} />
              </CallAction>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
