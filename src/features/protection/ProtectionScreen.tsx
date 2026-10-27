import { Check, Users, Shield, Settings } from 'lucide-react';
import { DefaultPhoneSetup } from '../phone/DefaultPhoneSetup';
import { useApp } from '../../presentation/AppProvider';
import { ProtectionStatus } from './ProtectionStatus';
export function ProtectionScreen() {
  const device = useApp();
  const enabled = !!device.status?.blockNonContacts;
  const unavailable = !device.native || device.busy || device.loading;
  return (
    <section>
      <h2>Proteção de chamadas</h2>
      <p>Você escolhe quem pode interromper.</p>
      <ProtectionStatus />
      <DefaultPhoneSetup />
      <div className="cc-card cc-setup">
        <h3>Configurar proteção</h3>
        <p>
          Precisamos consultar sua agenda e receber autorização do Android para filtrar chamadas. Os
          contatos ficam no aparelho.
        </p>
        <div className="cc-access">
          <Users size={20} aria-hidden="true" />
          <div>
            <strong>Agenda de contatos</strong>
            <p>
              {device.status?.contactsPermission
                ? 'Acesso autorizado'
                : 'Necessário para reconhecer seus contatos'}
            </p>
          </div>
          {device.status?.contactsPermission ? (
            <Check aria-label="Autorizado" />
          ) : (
            <button
              disabled={unavailable}
              onClick={() => void device.action(device.commands.requestContacts)}
            >
              Autorizar
            </button>
          )}
        </div>
        <div className="cc-access">
          <Shield size={20} aria-hidden="true" />
          <div>
            <strong>Triagem de chamadas</strong>
            <p>
              {device.status?.screeningHeld
                ? 'ChamadaCerta autorizado'
                : device.status?.screeningAvailable === false
                  ? 'Indisponível neste aparelho'
                  : 'Selecione ChamadaCerta na solicitação do Android'}
            </p>
          </div>
          {device.status?.screeningHeld ? (
            <Check aria-label="Autorizado" />
          ) : (
            <button
              disabled={unavailable || !device.status?.screeningAvailable}
              onClick={() => void device.action(device.commands.requestScreening)}
            >
              Ativar
            </button>
          )}
        </div>
        <button
          className="cc-text-button"
          disabled={unavailable}
          onClick={() => void device.action(device.commands.openSettings)}
        >
          <Settings size={18} />
          Permissões do aplicativo
        </button>
      </div>
      <div className="cc-card">
        <div className="cc-setting">
          <h3>Bloquear desconhecidos</h3>
          <button
            role="switch"
            aria-checked={enabled}
            aria-label="Bloquear desconhecidos"
            className="cc-switch"
            disabled={unavailable || !device.status}
            onClick={() => void device.action(() => device.commands.setBlocking(!enabled))}
          >
            <span />
          </button>
        </div>
        <p>Quando ativado, chamadas de números que não estão nos seus contatos serão bloqueadas.</p>
        <p className="cc-help">
          {device.status?.protectionActive
            ? 'Bloqueio habilitado no Android. Contatos salvos seguem o fluxo normal.'
            : 'A preferência só passa a bloquear com acesso aos contatos e autorização de triagem.'}
        </p>
        {!enabled && (
          <p>
            Números desconhecidos serão verificados para identificar possíveis golpes, quando houver
            um serviço disponível.
          </p>
        )}
        <p className="cc-help">
          Se a consulta à agenda falhar, a chamada será permitida. Chamadas sem identificação também
          podem ser bloqueadas quando a regra estiver ativa.
        </p>
      </div>
      <div className="cc-card">
        <h3>Identificação de possíveis golpes</h3>
        <p className="cc-warning" role="status">
          Verificação indisponível
        </p>
        <p>
          Nenhum serviço de identificação foi configurado. Números desconhecidos permanecem não
          verificados.
        </p>
        <p className="cc-help">
          A identificação de possível golpe não é uma garantia. Seus contatos e números não são
          enviados a serviços externos.
        </p>
      </div>
      <p className="cc-help cc-about">
        ChamadaCerta · Seus dados ficam neste aparelho.
        <br />
        Defina ChamadaCerta como telefone padrão para atender e gerenciar suas chamadas aqui.
      </p>
    </section>
  );
}
