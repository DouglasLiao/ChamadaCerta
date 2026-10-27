import { Info } from 'lucide-react';
import type { ReactNode } from 'react';
export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="cc-state" role="status">
      <Info size={28} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
