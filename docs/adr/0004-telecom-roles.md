# ADR 0004: Telecom como autoridade e autorização explícita

- Status: Aceito
- Data: 27/10/2026
- Origem: Retrospectivo: formaliza o fluxo de telefonia.

## Contexto

O aplicativo precisa discar e atender como telefone padrão sem inferir autorização a partir da abertura de uma tela.

## Decisão

Solicitar ROLE_DIALER no sistema, usar TelecomManager.placeCall e InCallService com UI/notificações nativas. Links tel apenas preenchem o teclado. Solicitar CALL_PHONE antes do efeito e consultar estado real ao retornar das configurações.

## Alternativas consideradas

Delegar sempre ao discador externo não centraliza atendimento; iniciar por intent recebido criaria chamadas sem confirmação.

## Consequências

Capacidades dependem do aparelho, operadora e permissões. Triagem tem papel separado. Vídeo é atendido em áudio.

## Validação

Roteiro em aparelho, papel recusado e permissões revogadas; [Android](../android.md).
