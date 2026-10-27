# Contribuição

Leia [desenvolvimento](docs/development.md), [arquitetura](docs/architecture.md) e [padrões](docs/standards.md). Use `npm ci`, Node 24, JDK 17 e SDK 35.

## Fluxo de trabalho

1. Descreva comportamento esperado e risco da mudança.
2. Implemente na camada responsável; domínio e aplicação não dependem de plataforma.
3. Adicione testes para comportamento novo ou regressão relevante.
4. Atualize documentação, contrato da ponte e ADR quando afetados.
5. Execute `npm run format`, `npm run android:format`, `npm run verify` e `npm run android:verify`.
6. Na revisão, informe resultado dos testes e o que ainda exige aparelho real.

Não edite assets gerados, não versione ferramentas locais ou segredos e não altere permissões sem explicar a necessidade. Use o [template de PR](.github/pull_request_template.md). Decisões anteriores permanecem no histórico de ADRs; crie uma decisão substituta quando necessário.
