# ADR 0011: Configuração pública validada e ferramentas por ambiente

- Status: Aceito
- Data: 27/10/2026

## Contexto

Tamanhos de página, prazos da ponte e portas estavam definidos diretamente nos consumidores. Caminhos pessoais precisavam ser exportados manualmente. O usuário solicitou centralizar as configurações no `.env`.

## Decisão

Declarar um `.env.example`, ignorar arquivos locais e carregar opções públicas `VITE_*` por uma camada `config` validada e imutável. As camadas externas podem consumir essa configuração; domínio e aplicação continuam puros. Ferramentas Node carregam ambiente pelo Vite e mantêm prioridade das variáveis exportadas, sem expor o ambiente completo ao bundle. O build valida limites; o CI funciona sem arquivo local.

## Alternativas consideradas

Mover toda constante ao ambiente tornaria regras de negócio e contratos nativos configuráveis sem garantia de consistência. Acessar `import.meta.env` em cada tela repetiria conversões e permitiria valores inválidos. Injetar o ambiente completo pelo `define` poderia expor informações locais.

## Consequências

As configurações do aplicativo são públicas e fixadas no APK durante o build. Alterações precisam de nova compilação. Caminhos locais permanecem no `.env` ignorado. O prazo nativo de triagem, políticas e contratos não mudam por ambiente. Não há promessa de proteção de segredos em aplicações distribuídas.

## Validação

Testar padrões, inteiros e limites, regras de dependência e lint. Verificar build sem `.env` e rejeição de configuração inválida. Executar `verify` e `android:verify`. Consulte [configuração](../configuration.md).
