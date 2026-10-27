import { useCallback, useEffect, useRef, useState } from 'react';
import type { DeviceGateway } from '../application/ports/DeviceGateway';
import type { CallRecord, Contact, DeviceStatus } from '../domain/models';
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Não foi possível carregar os dados.';
const REFRESH_EVENT = 'chamadacerta:refresh';
export function useDeviceState(gateway: DeviceGateway) {
  const [native] = useState(() => gateway.isAvailable());
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [history, setHistory] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(native);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [contactsError, setContactsError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const generation = useRef({ value: 0 });
  const actionInFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (!native) return;
    const currentGeneration = ++generation.current.value;
    const isCurrent = () => currentGeneration === generation.current.value;
    setLoading(true);
    setError('');
    try {
      const nextStatus = await gateway.status();
      if (!isCurrent()) return;
      setStatus(nextStatus);
      if (!nextStatus.contactsPermission) setContacts([]);
      const [agenda, calls] = await Promise.allSettled([
        nextStatus.contactsPermission ? gateway.contacts() : Promise.resolve([]),
        gateway.history(),
      ]);
      if (!isCurrent()) return;
      setContacts(agenda.status === 'fulfilled' ? agenda.value : []);
      setContactsError(agenda.status === 'rejected' ? errorMessage(agenda.reason) : '');
      setHistory(calls.status === 'fulfilled' ? calls.value.entries : []);
      setHistoryError(
        calls.status === 'rejected' ? errorMessage(calls.reason) : calls.value.warning,
      );
    } catch (failure) {
      if (!isCurrent()) return;
      setStatus(null);
      setContactsError('');
      setHistoryError('');
      setContacts([]);
      setHistory([]);
      setError(errorMessage(failure));
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [native, gateway]);

  useEffect(() => {
    if (!native) return;
    const activeGeneration = generation.current;
    const onVisible = () => {
      if (!document.hidden) void refresh();
    };
    const onRefresh = () => {
      void refresh();
    };
    void refresh();
    window.addEventListener(REFRESH_EVENT, onRefresh);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      activeGeneration.value++;
      window.removeEventListener(REFRESH_EVENT, onRefresh);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [native, refresh]);

  const action = useCallback(
    async (operation: () => Promise<unknown>) => {
      if (!native || actionInFlight.current) return false;
      actionInFlight.current = true;
      setBusy(true);
      setError('');
      try {
        await operation();
        await refresh();
        return true;
      } catch (failure) {
        await refresh();
        setError(errorMessage(failure));
        return false;
      } finally {
        actionInFlight.current = false;
        setBusy(false);
      }
    },
    [native, refresh],
  );
  return {
    native,
    status,
    contacts,
    history,
    loading,
    busy,
    error,
    contactsError,
    historyError,
    refresh,
    action,
  };
}
