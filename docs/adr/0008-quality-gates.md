# ADR 0008: Qualidade automatizada e exceções documentadas

- Status: Aceito
- Data: 27/10/2026
- Origem: Decisão aplicada nesta refatoração.

## Contexto

Formatação e testes sozinhos não impedem dependências invertidas, promises esquecidas, CSS inconsistente ou funções Android excessivamente complexas.

## Decisão

Executar ESLint tipado, Stylelint, Markdownlint, Prettier, Spotless, Detekt, Android Lint, testes, verificação de arquitetura e links. Manter regras e exceções no repositório e rodar os mesmos comandos em CI.

## Alternativas consideradas

Revisão manual isolada não é repetível. Habilitar todas as regras sem contexto favoreceria supressões e alterações sem benefício.

## Consequências

As verificações têm custo de execução e limites explícitos. Override transitivo de KaTeX mantém a cadeia Markdown atual sem o achado conhecido; revisar em atualizações.

## Validação

Rodar verify, android:verify e npm audit; [política de qualidade](../quality.md).
