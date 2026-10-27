# Módulo Android

Projeto Kotlin do ChamadaCerta, com application id `com.chamadacerta.app`, Android mínimo 29 e compile/target SDK 35.

Execute os comandos pela raiz do repositório:

```sh
npm run android:debug
npm run android:verify
npm run android:format
```

O Gradle Wrapper usa a versão 8.11.1 com checksum. O build fixa AGP 8.9.2, Kotlin 2.1.20 e AndroidX WebKit 1.12.1. Requer JDK 17 e Android SDK/Build Tools 35.

A interface local deve ser gerada por `npm run mobile:sync` antes de compilar diretamente pelo Android Studio ou wrapper. Os assets são gerados e ignorados pelo Git.

Consulte a [arquitetura](../docs/architecture.md), a [validação](../docs/testing.md) e as instruções de ambiente no [README principal](../README.md).

## Telefone padrão

A partir da versão 2.2.0, o manifesto registra `ACTION_DIAL`/`tel:` e `PhoneCallService` como `InCallService` com UI própria. `CallUiActivity` e `CallActionReceiver` são privados. O usuário seleciona o aplicativo como telefone padrão com `ROLE_DIALER`; triagem de spam continua sendo um papel separado.

`CALL_PHONE` permite iniciar chamadas por `TelecomManager`. `WRITE_CONTACTS` permite o cadastro local no próprio aplicativo. As notificações e a abertura de tela cheia de chamadas recebidas dependem das autorizações do sistema. O aplicativo não pede `INTERNET` e não incorpora provedor de reputação nesta versão.

O APK contém implementação real dos serviços e controles; a seleção efetiva de papéis, chamadas, áudio, dual SIM e tela bloqueada ainda precisam de testes em telefone. Vídeo é atendido em áudio, sem superfícies de vídeo próprias.
