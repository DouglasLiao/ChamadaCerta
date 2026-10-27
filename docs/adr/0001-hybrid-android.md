# ADR 0001: Interface local React e telefonia Kotlin

- Status: Aceito
- Data: 27/10/2026
- Origem: Retrospectivo: formaliza a implementação existente.

## Contexto

O produto já possui interface React e depende de Telecom, contatos e triagem Android. Uma interface inteiramente web não oferece esses recursos com segurança.

## Decisão

Manter React/TypeScript empacotado para as quatro telas e Kotlin para integração e UI de chamada. Distribuir os dois no mesmo APK, sem servidor local.

## Alternativas consideradas

Reescrever tudo em Compose aumentaria o escopo; uma PWA não satisfaz os papéis de telefonia.

## Consequências

Compartilha validações conceituais entre linguagens e exige contrato explícito. A UI de chamada funciona sem depender do WebView.

## Validação

Compilar APK e verificar recursos em aparelho; [arquitetura](../architecture.md).
