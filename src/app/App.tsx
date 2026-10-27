import { useCallback, useEffect, useState } from 'react';
import { Clock3, Grid3X3, Users, Shield } from 'lucide-react';
import { CallsScreen } from '../features/calls/CallsScreen';
import { ContactsScreen } from '../features/contacts/ContactsScreen';
import { ProtectionScreen } from '../features/protection/ProtectionScreen';
import { DialerScreen } from '../features/dialer/DialerScreen';
import type { DialRequest } from '../domain/models';
import { DefaultPhoneSetup } from '../features/phone/DefaultPhoneSetup';
import { useDialIntents } from '../presentation/useDialIntents';
import { useApp } from '../presentation/AppProvider';
const TABS = [
  { id: 'calls', label: 'Recentes', icon: Clock3, screen: CallsScreen },
  { id: 'dialpad', label: 'Teclado', icon: Grid3X3, screen: DialerScreen },
  { id: 'contacts', label: 'Contatos', icon: Users, screen: ContactsScreen },
  { id: 'protection', label: 'Proteção', icon: Shield, screen: ProtectionScreen },
] as const;
export function App() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('calls');
  const device = useApp();
  const [dialRequest, setDialRequest] = useState<DialRequest | null>(null);
  const onDialRequest = useCallback((request: DialRequest) => {
    setDialRequest(request);
    setActiveTab('dialpad');
  }, []);
  const dialError = useDialIntents(device.native, device.commands.dialRequest, onDialRequest);
  const Screen = TABS.find((tab) => tab.id === activeTab)!.screen;
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);
  return (
    <div className="cc-app">
      <div className="cc-shell">
        <header className="cc-header">
          <div className="cc-brand">
            <Shield size={26} aria-hidden="true" />
            <h1>
              Chamada<span>Certa</span>
            </h1>
          </div>
          <p>Mais tranquilidade para suas chamadas.</p>
        </header>
        {!device.native && (
          <p className="cc-notice">
            Prévia da interface. Os recursos de telefonia estão disponíveis no aplicativo Android.
          </p>
        )}
        {device.error && (
          <div role="alert" className="cc-notice">
            {device.error}
            <button disabled={device.loading} onClick={() => void device.refresh()}>
              Tentar novamente
            </button>
          </div>
        )}
        {dialError && (
          <p className="cc-notice" role="alert">
            {dialError}
          </p>
        )}
        <main className="cc-content" id="mobile-content">
          {activeTab === 'calls' && <DefaultPhoneSetup />}
          {activeTab === 'dialpad' ? (
            <DialerScreen key={dialRequest?.id ?? 'manual'} initialNumber={dialRequest?.number} />
          ) : (
            <Screen />
          )}
        </main>
        <nav className="cc-nav" aria-label="Navegação do aplicativo">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              aria-current={activeTab === id ? 'page' : undefined}
              aria-controls="mobile-content"
            >
              <Icon size={23} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
