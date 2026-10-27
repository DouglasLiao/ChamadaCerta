import { useState } from 'react';
import { Delete, Phone } from 'lucide-react';
import { isDialableNumber } from '../../domain/phoneNumber';
import { CallAction } from '../phone/CallAction';
import { SaveContactAction } from '../contacts/SaveContactAction';
import { useApp } from '../../presentation/AppProvider';
const keys = [
  ['1', ''],
  ['2', 'ABC'],
  ['3', 'DEF'],
  ['4', 'GHI'],
  ['5', 'JKL'],
  ['6', 'MNO'],
  ['7', 'PQRS'],
  ['8', 'TUV'],
  ['9', 'WXYZ'],
  ['*', ''],
  ['0', '+'],
  ['#', ''],
];
export function DialerScreen({ initialNumber = '' }: { initialNumber?: string }) {
  const [number, setNumber] = useState(initialNumber);
  const device = useApp();
  const validNumber = isDialableNumber(number);
  return (
    <section className="cc-dialpad">
      <h2>Teclado</h2>
      <p>Digite um número para ligar.</p>
      <div className="cc-number">
        <input
          aria-label="Número de telefone"
          type="tel"
          autoComplete="tel"
          value={number}
          maxLength={30}
          onChange={(e) => setNumber(e.target.value.replace(/[^+\d*#\s().-]/g, ''))}
        />
        <button
          aria-label="Apagar último caractere"
          disabled={!number}
          onClick={() => setNumber((n) => n.slice(0, -1))}
        >
          <Delete />
        </button>
      </div>
      <div className="cc-keys">
        {keys.map(([key, letters]) => (
          <button
            key={key}
            aria-label={key}
            onClick={() => setNumber((n) => (n + key).slice(0, 30))}
          >
            <span>{key}</span>
            <small>{letters || '\u00a0'}</small>
          </button>
        ))}
      </div>
      <button
        className="cc-plus"
        onClick={() => setNumber((n) => (n.startsWith('+') ? n : `+${n}`))}
      >
        Adicionar + internacional
      </button>
      <CallAction number={number} className="cc-call">
        <Phone size={23} aria-hidden="true" />
        Ligar
      </CallAction>
      <SaveContactAction key={number} number={number} />
      <p className="cc-help">
        {!number
          ? 'Digite um número para habilitar a chamada. '
          : !validNumber
            ? 'Confira o número digitado. '
            : ''}
        O ChamadaCerta iniciará a chamada pelo Android. Confira o número antes de tocar em Ligar.
        {device.native && device.status?.canDial === false
          ? ' Nenhum discador disponível neste aparelho.'
          : ''}
      </p>
    </section>
  );
}
