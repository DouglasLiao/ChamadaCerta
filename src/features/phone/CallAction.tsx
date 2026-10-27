import type { ReactNode } from 'react';
import { useApp } from '../../presentation/AppProvider';
import { isDialableNumber } from '../../domain/phoneNumber';
interface CallActionProps {
  number: string;
  label?: string;
  className?: string;
  children: ReactNode;
}
export function CallAction({ number, label, className, children }: CallActionProps) {
  const device = useApp();
  return (
    <button
      className={className}
      aria-label={label}
      disabled={
        !device.native || !isDialableNumber(number) || device.busy || !device.status?.canDial
      }
      onClick={() => void device.action(() => device.commands.placeCall(number))}
    >
      {children}
    </button>
  );
}
