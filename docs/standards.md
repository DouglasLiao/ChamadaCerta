# Padrões de implementação

## Dependências e responsabilidade

Implemente regras no domínio; coordene ações em casos de uso; isole APIs na plataforma. Componentes recebem estado e comandos pelo contexto. UI genérica não conhece contatos, Telecom ou gateway. Evite abstrações sem duas responsabilidades claras: a porta deve representar uma capacidade real, como ligar ou gravar contato.

Nomes descrevem intenção. Arquivos React usam PascalCase, hooks começam com `use`, funções/variáveis usam camelCase e constantes Kotlin usam UPPER_SNAKE_CASE. Mantenha cada função focada e extraia passos com significado, especialmente nos serviços Android. Não use números de telefone como identificadores técnicos.

## TypeScript e React

- Mantenha modo estrito e imports de tipos explícitos; não use `any` para contornar a ponte.
- Dados externos entram como `unknown` e passam pelos decodificadores.
- Promises precisam de `await`, retorno ou tratamento explícito. Em eventos síncronos, use wrapper com `void` somente quando a função chamada trata a falha.
- Efeitos removem listeners e timers; não mantenha dependências omitidas para silenciar o linter.
- Valide antes de solicitar permissão ou executar efeito. Erro deve preservar dados do formulário e permitir nova tentativa.
- Não mostre dados de teste, sucesso antecipado, pontuação inventada ou estado seguro por ausência de resposta.

## Kotlin

Domínio não importa Android. Use `use` para cursores/bancos, feche executores no ciclo de vida e mantenha UI na thread principal. Não retenha Activity além de seu ciclo de vida. Reconfira permissões antes de efeitos e depois de consultas assíncronas. O resultado de um diálogo de papel não substitui a consulta ao estado real.

Capturas amplas são reservadas a fronteiras Android que podem falhar por provedor, fabricante ou revogação. Retorne erro visível ou fallback seguro; não registre nomes, telefones ou payloads. Preserve chaves e esquema persistido; alterações exigem migração e teste.

## UI, CSS e acessibilidade

Use classes e variáveis `cc-`, tokens existentes e layout fluido. Preserve margens superiores responsivas, safe areas, orientação horizontal e rolagem com teclado aberto. Não comunique estado só pela cor. Botões precisam de nomes acessíveis, foco visível e alvos adequados ao toque. Teste texto ampliado, números longos e telas estreitas.

## Erros e segurança

Mensagens ao usuário são em português e indicam uma ação possível. Nunca anuncie ligação, contato salvo ou proteção ativa antes da confirmação. Links de discagem preenchem o teclado e aguardam toque. A triagem permite a chamada em caso de falha. Não adicione rede, telemetria ou fornecedor sem decisão de produto e revisão de dados.

## Revisão

Mudanças comportamentais precisam de testes que observem efeito e falha; não replique a implementação. Revise dependências, permissões, dados, acessibilidade e documentação. Decisões duradouras recebem [ADR](adr/template.md). Formate com as ferramentas do projeto e resolva avisos; supressões locais precisam de justificativa concreta.
