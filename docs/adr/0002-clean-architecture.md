# ADR 0002: Portas, casos de uso e dependências para dentro

- Status: Aceito
- Data: 27/10/2026
- Origem: Decisão aplicada nesta refatoração.

## Contexto

Telas importavam diretamente o cliente Android, dificultando testar regras sem plataforma e favorecendo a repetição de validações e permissões.

## Decisão

Criar domínio puro, portas CallGateway/ContactGateway/DeviceGateway, casos placeCall/saveContact e injeção do adaptador no ponto de composição. Apresentação e funcionalidades usam comandos, sem importar plataforma.

## Alternativas consideradas

Manter chamadas diretas seria mais curto, mas acoplaria regras à ponte. Adotar um framework de injeção adicionaria custo sem necessidade.

## Consequências

Casos de uso são testáveis com gateways falsos. O núcleo não conhece React ou navegador. O Android preserva um domínio Kotlin puro; os serviços externos não foram artificialmente divididos em módulos.

## Validação

Executar check:architecture e testes de casos de uso; [padrões](../standards.md).
