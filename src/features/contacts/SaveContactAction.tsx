import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useApp } from '../../presentation/AppProvider';
import { isDialableNumber } from '../../domain/phoneNumber';
import { ContactEditor } from './ContactEditor';
export function SaveContactAction({ number }: { number: string }) {
  const device = useApp();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <div>
      {editing ? (
        <ContactEditor
          initialNumber={number}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            setSaved(true);
          }}
        />
      ) : (
        <button
          className="cc-text-button"
          disabled={!device.native || device.busy || !isDialableNumber(number)}
          onClick={() => {
            setSaved(false);
            setEditing(true);
          }}
        >
          <UserPlus size={18} />
          Salvar na agenda
        </button>
      )}
      {saved && (
        <p role="status" className="cc-notice">
          Contato salvo na agenda.
        </p>
      )}
    </div>
  );
}
