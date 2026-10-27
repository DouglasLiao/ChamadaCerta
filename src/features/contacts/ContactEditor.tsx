import { useState } from 'react';
import type { FormEvent } from 'react';
import { useApp } from '../../presentation/AppProvider';
import { validateContactDraft } from '../../domain/contactDraft';
interface ContactEditorProps {
  initialNumber?: string;
  onSaved: () => void;
  onCancel: () => void;
}
export function ContactEditor({ initialNumber = '', onSaved, onCancel }: ContactEditorProps) {
  const device = useApp();
  const [name, setName] = useState('');
  const [number, setNumber] = useState(initialNumber);
  const [validation, setValidation] = useState('');
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      validateContactDraft(name, number);
    } catch (error) {
      setValidation(error instanceof Error ? error.message : 'Confira os dados do contato.');
      return;
    }
    setValidation('');
    const saved = await device.action(() => device.commands.saveContact(name, number));
    if (saved) onSaved();
  };
  return (
    <form
      className="cc-card cc-form"
      aria-label="Novo contato"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <h3>Novo contato</h3>
      <label>
        Nome
        <input
          autoComplete="name"
          aria-label="Nome do contato"
          value={name}
          maxLength={120}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </label>
      <label>
        Telefone
        <input
          type="tel"
          autoComplete="tel"
          aria-label="Telefone do contato"
          value={number}
          maxLength={40}
          onChange={(event) => setNumber(event.target.value)}
          required
        />
      </label>
      <p className="cc-help">
        O contato será salvo na agenda local do aparelho. Para sincronizar com uma conta, você pode
        editá-lo depois no aplicativo de contatos do Android.
      </p>
      {validation && <p role="alert">{validation}</p>}
      <button className="cc-primary" type="submit" disabled={!device.native || device.busy}>
        {device.busy ? 'Salvando…' : 'Salvar contato'}
      </button>
      <button type="button" disabled={device.busy} onClick={onCancel}>
        Cancelar
      </button>
    </form>
  );
}
