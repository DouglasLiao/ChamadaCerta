import { Shield, ShieldAlert } from 'lucide-react';
import { useApp } from '../../presentation/AppProvider';
export function ProtectionStatus() {
  const device = useApp();
  const active = device.status?.protectionActive;
  const Icon = active ? Shield : ShieldAlert;
  const title = !device.native
    ? 'Proteção disponível no aplicativo Android'
    : device.loading
      ? 'Verificando proteção…'
      : active
        ? 'Bloqueio de desconhecidos ativo'
        : device.status?.screeningError
          ? 'Proteção precisa de atenção'
          : 'Bloqueio de desconhecidos inativo';
  const explanation = !device.native
    ? 'O bloqueio depende da integração com o aparelho.'
    : device.error ||
      device.status?.screeningError ||
      (active
        ? 'Chamadas fora da sua agenda serão bloqueadas.'
        : !device.status?.contactsPermission
          ? 'Autorize os contatos na aba Proteção.'
          : !device.status?.screeningHeld
            ? 'Ative a triagem de chamadas na aba Proteção.'
            : 'Verificação de possíveis golpes indisponível.');
  return (
    <div className={`cc-status ${active ? 'cc-status-active' : ''}`} role="status">
      <Icon size={22} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{explanation}</p>
      </div>
    </div>
  );
}
