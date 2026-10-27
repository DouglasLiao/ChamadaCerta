# ADR 0003: Ponte restrita à origem local e dados validados

- Status: Aceito
- Data: 27/10/2026
- Origem: Retrospectivo: formaliza controles existentes.

## Contexto

O JavaScript pode acionar capacidades sensíveis. Payloads e mensagens não podem ser considerados confiáveis apenas por estarem tipados no cliente.

## Decisão

Usar WebMessageListener no frame principal da origem local, CSP e assets empacotados. Correlacionar por ID, validar respostas e entradas nativas e expirar pedidos. Não usar fallback inseguro. Cliente e nativo viajam juntos, sem versão de protocolo separada.

## Alternativas consideradas

addJavascriptInterface irrestrito ou navegação remota aumentariam a superfície privilegiada; HTTP local acrescentaria servidor e ciclo de vida.

## Consequências

WebView incompatível exige atualização. Timeout não cancela efeitos nativos, portanto operações sensíveis não têm retry automático.

## Validação

Testes de ponte, decodificação e falhas; [contrato](../bridge.md).
