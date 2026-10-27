# ADR 0007: Build com assets gerados e ferramentas fixadas

- Status: Aceito
- Data: 27/10/2026
- Origem: Retrospectivo: formaliza a entrega existente.

## Contexto

O APK deve carregar a interface sem servidor de desenvolvimento, e um checkout independente deve ser compilável sem caminhos pessoais.

## Decisão

Gerar assets pelo Vite e sincronizar antes do Gradle. Versionar lockfile e Wrapper com checksum; usar Node 24, Java 17 e SDK 35. Ignorar assets gerados, ferramentas locais e chaves. CI gera somente debug.

## Alternativas consideradas

Versionar dist criaria duplicidade e divergência; carregar um site remoto alteraria privacidade e disponibilidade.

## Consequências

Build inicial usa rede para dependências; execução instalada é offline. Distribuição em produção ainda requer assinatura própria e revisão de loja.

## Validação

npm ci, verify e android:verify em checkout limpo; [entrega](../release.md).
