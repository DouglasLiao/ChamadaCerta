import { Phone, CheckCircle2, Bell, Settings } from 'lucide-react'
import { useApp } from '../../presentation/AppProvider'
export function DefaultPhoneSetup() {
  const device = useApp()
  const status = device.status
  const unavailable = !device.native || device.busy || device.loading || !status
  return (
    <section className="cc-card cc-phone-setup" aria-label="Telefone padrão">
      <div className="cc-title">
        <h3>
          {status?.dialerHeld
            ? 'ChamadaCerta é seu telefone padrão'
            : 'Seu telefone e seus contatos, juntos'}
        </h3>
        {status?.dialerHeld ? (
          <CheckCircle2 size={24} aria-hidden="true" />
        ) : (
          <Phone size={24} aria-hidden="true" />
        )}
      </div>
      <p>
        {status?.dialerHeld
          ? 'Discagem, atendimento e chamada em andamento pelo ChamadaCerta.'
          : 'Escolha ChamadaCerta como aplicativo de telefone padrão para centralizar as chamadas.'}
      </p>
      {!status?.dialerHeld && (
        <button
          className="cc-primary"
          disabled={unavailable || !status?.dialerAvailable}
          onClick={() => void device.action(device.commands.requestDefaultDialer)}
        >
          Definir como telefone padrão
        </button>
      )}
      {status?.dialerAvailable === false && (
        <p className="cc-help">A função de telefone padrão não está disponível neste aparelho.</p>
      )}
      {device.native && !status?.callPermission && (
        <button
          className="cc-text-button"
          disabled={unavailable}
          onClick={() => void device.action(device.commands.requestCallPermission)}
        >
          <Phone size={18} />
          Autorizar chamadas
        </button>
      )}
      {device.native && !status?.notificationsPermission && (
        <div>
          <p className="cc-help">
            Autorize notificações para receber os avisos e os botões de atendimento, inclusive com o
            aplicativo fechado.
          </p>
          <button
            className="cc-text-button"
            disabled={unavailable}
            onClick={() => void device.action(device.commands.requestNotifications)}
          >
            <Bell size={18} />
            Autorizar avisos de chamadas
          </button>
          <button
            className="cc-text-button"
            disabled={unavailable}
            onClick={() => void device.action(device.commands.openSettings)}
          >
            Ajustar notificações no Android
          </button>
        </div>
      )}
      {device.native && !status?.fullScreenAllowed && (
        <div>
          <p className="cc-help">
            Para abrir a chamada recebida com o telefone bloqueado, permita os avisos de tela cheia
            nas configurações Android.
          </p>
          <button
            className="cc-text-button"
            disabled={unavailable}
            onClick={() => void device.action(device.commands.openFullScreenSettings)}
          >
            <Settings size={18} />
            Configurar chamada na tela bloqueada
          </button>
        </div>
      )}
      {status?.hasActiveCall && (
        <button
          className="cc-primary"
          disabled={device.busy}
          onClick={() => void device.action(device.commands.openInCall)}
        >
          Voltar à chamada em andamento
        </button>
      )}
    </section>
  )
}
