# ADR 0006: Triagem permite chamada em falha e não inventa reputação

- Status: Aceito
- Data: 27/10/2026
- Origem: Retrospectivo: formaliza política existente.

## Contexto

Consultar contatos pode falhar ou exceder prazo. Não existe fornecedor de reputação integrado e números desconhecidos podem ser legítimos.

## Decisão

Bloquear fora dos contatos apenas com opção explícita, papel e leitura disponíveis. Usar prazo interno de 3,5 segundos, resposta única e permitir em falha. Exibir verificação indisponível enquanto não existir provedor real.

## Alternativas consideradas

Bloquear em erro descartaria chamadas legítimas; apresentar uma pontuação fictícia induziria confiança sem evidência.

## Consequências

Proteção depende de disponibilidade da agenda. O produto não promete detectar golpes. Nova integração exige contrato e análise de dados.

## Validação

Testes JVM da política e roteiro de timeout; [pesquisa de provedores](../spam-providers.md).
