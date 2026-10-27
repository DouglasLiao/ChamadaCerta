import { useState } from 'react';
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, ShieldAlert, X, RefreshCw } from 'lucide-react';
import { useApp } from '../../presentation/AppProvider';
import type { CallRecord } from '../../domain/models';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ProtectionStatus } from '../protection/ProtectionStatus';
import { CallAction } from '../phone/CallAction';
import { SaveContactAction } from '../contacts/SaveContactAction';
const labels = {
  blocked: 'Bloqueada',
  missed: 'Perdida',
  answered: 'Atendida',
  incoming: 'Recebida',
  outgoing: 'Efetuada',
  rejected: 'Recusada',
};
function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? timestamp
    : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}
const entryLabel = (entry: CallRecord) =>
  entry.source === 'screening' && entry.status === 'incoming'
    ? 'Tentativa recebida'
    : labels[entry.status];
export const CallsScreen = () => {
  const device = useApp();
  const [blockedOnly, setBlockedOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const history = device.history;
  const selected = history.find((call) => call.id === selectedId);
  const entries = blockedOnly ? history.filter((c) => c.status === 'blocked') : history;
  return (
    <section>
      <div className="cc-title">
        <div>
          <h2>Recentes</h2>
          <p>Suas últimas chamadas e registros de triagem</p>
        </div>
        {device.native && (
          <button
            aria-label="Atualizar chamadas"
            disabled={device.loading}
            onClick={() => void device.refresh()}
          >
            <RefreshCw size={20} />
          </button>
        )}
      </div>
      <ProtectionStatus />
      {device.native && !device.loading && !device.status?.callLogPermission && (
        <div className="cc-notice">
          <strong>Histórico completo do aparelho</strong>
          <p>
            Autorize a leitura para exibir chamadas efetuadas, recebidas e perdidas. Sem esse
            acesso, mostramos apenas os registros feitos pela triagem do ChamadaCerta.
          </p>
          <button
            disabled={device.busy}
            onClick={() => void device.action(device.commands.requestHistory)}
          >
            Autorizar histórico
          </button>
          <button
            disabled={device.busy}
            onClick={() => void device.action(device.commands.openSettings)}
          >
            Permissões
          </button>
        </div>
      )}
      {device.historyError && (
        <div role="alert" className="cc-notice">
          {device.historyError}
          <button disabled={device.loading} onClick={() => void device.refresh()}>
            Tentar novamente
          </button>
        </div>
      )}
      <div className="cc-filters">
        <button aria-pressed={!blockedOnly} onClick={() => setBlockedOnly(false)}>
          Todas
        </button>
        <button aria-pressed={blockedOnly} onClick={() => setBlockedOnly(true)}>
          Bloqueadas
        </button>
      </div>
      {device.loading ? (
        <EmptyState title="Carregando chamadas…">Consultando os registros do aparelho.</EmptyState>
      ) : !entries.length ? (
        <EmptyState title={blockedOnly ? 'Nenhuma chamada bloqueada' : 'Nenhuma chamada por aqui'}>
          As chamadas e tentativas recebidas aparecerão aqui quando os acessos estiverem
          autorizados.
        </EmptyState>
      ) : (
        <ul className="cc-list">
          {entries.map((c) => {
            const Icon =
              c.status === 'blocked'
                ? ShieldAlert
                : c.status === 'missed'
                  ? PhoneMissed
                  : c.status === 'outgoing'
                    ? PhoneOutgoing
                    : PhoneIncoming;
            return (
              <li key={c.id}>
                <button
                  className="cc-row cc-row-button"
                  onClick={() => setSelectedId(c.id)}
                  aria-label={`Detalhes: ${c.name || c.number}, ${entryLabel(c)}`}
                >
                  <span className="cc-avatar">
                    <Icon size={20} />
                  </span>
                  <div className="cc-row-text">
                    <strong>{c.name || c.number}</strong>
                    <p>
                      {entryLabel(c)} · {formatTime(c.timestamp)}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {selected && (
        <div className="cc-card cc-details">
          <button
            className="cc-close"
            aria-label="Fechar detalhes"
            onClick={() => setSelectedId(null)}
          >
            <X />
          </button>
          <h3>Detalhes da chamada</h3>
          <strong>{selected.name || selected.number}</strong>
          <p>{selected.number}</p>
          <p>
            {entryLabel(selected)} · {formatTime(selected.timestamp)}
          </p>
          {selected.blockReason && <p>{selected.blockReason}</p>}
          {selected.duration && <p>Duração: {selected.duration}</p>}
          <p>{selected.isContact ? 'Contato salvo' : 'Número não verificado'}</p>
          <CallAction number={selected.number} className="cc-primary">
            Ligar novamente
          </CallAction>
          {!selected.isContact && <SaveContactAction key={selected.id} number={selected.number} />}
        </div>
      )}
      {device.native && history.some((c) => c.source === 'screening') && (
        <div className="cc-clear">
          {confirmClear ? (
            <div className="cc-card">
              <p>
                Remover os registros de triagem deste aplicativo? O histórico de chamadas do Android
                será preservado.
              </p>
              <button
                disabled={device.busy}
                onClick={() => {
                  setSelectedId(null);
                  void device.action(device.commands.clearBlockedHistory);
                  setConfirmClear(false);
                }}
              >
                Remover registros do app
              </button>
              <button onClick={() => setConfirmClear(false)}>Cancelar</button>
            </div>
          ) : (
            <button className="cc-text-button" onClick={() => setConfirmClear(true)}>
              Limpar registros do app
            </button>
          )}
        </div>
      )}
      {device.native && (
        <p className="cc-help">
          Até 200 registros recentes de cada fonte. Tentativas de triagem não confirmam que uma
          ligação foi atendida.
        </p>
      )}
    </section>
  );
};
