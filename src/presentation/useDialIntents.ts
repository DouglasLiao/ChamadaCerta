import { useEffect, useRef, useState } from 'react';

import type { DialRequest } from '../domain/models';
export function useDialIntents(
  native: boolean,
  readDialRequest: () => Promise<DialRequest | null>,
  onRequest: (request: DialRequest) => void,
) {
  const handledId = useRef<string | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!native) return;
    let active = true;
    const readRequest = async () => {
      try {
        const request = await readDialRequest();
        if (!active) return;
        setError('');
        if (request && request.id !== handledId.current) {
          handledId.current = request.id;
          onRequest(request);
        }
      } catch {
        if (active) setError('Não foi possível carregar o número solicitado pelo Android.');
      }
    };
    const onDialRequest = () => {
      void readRequest();
    };
    void readRequest();
    window.addEventListener('chamadacerta:dial-request', onDialRequest);
    return () => {
      active = false;
      window.removeEventListener('chamadacerta:dial-request', onDialRequest);
    };
  }, [native, readDialRequest, onRequest]);
  return error;
}
