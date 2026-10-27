# ADR 0009: Índice de contatos e agrupamento sem alterar a agenda

- Status: Aceito
- Data: 27/10/2026

## Contexto

A pesquisa normalizava toda a agenda e renderizava todos os resultados a cada tecla. Números iguais com zero, código do Brasil ou operadora apareciam duplicados. O usuário relatou lentidão em um S23 Ultra.

## Decisão

Preparar índice por snapshot, usar chaves brasileiras completas e conservadoras, pesquisar todos os aliases e paginar a apresentação em 50 grupos. Adiar resultados com React e preservar referências em atualizações sem mudança. Cache nativo em memória é invalidado por mudanças e retomada; eventos são agrupados em 250 ms.

## Alternativas consideradas

Virtualização manteria rolagem contínua, mas exigiria gestão de altura variável para nomes, acessibilidade e cadastros expandidos. Paginação limita o DOM sem dependência adicional. Deduplicação destrutiva e comparação só pelos últimos dígitos poderiam perder dados ou unir pessoas distintas.

## Consequências

A navegação usa páginas e o agrupamento não remove duplicados no Android. Números sem DDD ou ambíguos podem permanecer separados. Há custo de índice ao receber nova agenda, sem repeti-lo durante a digitação. O cache mantém dados somente no processo e continua sujeito às permissões.

## Validação

Testes de formatos equivalentes, colisões, aliases, agenda de 10 mil registros, limite de linhas e ausência de consulta nativa durante busca. [Reprodução e limites do benchmark](../contacts.md).
