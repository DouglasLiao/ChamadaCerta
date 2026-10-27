# Segurança e privacidade

## Modelo atual

O aplicativo funciona sem internet, sem analytics e sem fornecedor de spam. Contatos e histórico permanecem no aparelho. A agenda do Android recebe contatos somente após confirmação explícita. Consulte [dados e permissões](docs/android.md).

A superfície inclui intents externos de discagem, mensagens WebView, ContentProviders e callbacks Telecom. Controles: validação de entrada nos dois lados, origem local e frame principal, CSP, bloqueio de navegação remota, componentes privados quando possível e serviços de sistema protegidos por permissões de bind. Não aceite conteúdo remoto dentro da origem privilegiada.

Limites: o sandbox Android é a proteção de armazenamento; não há criptografia própria. Um aparelho comprometido ou autorizado para depuração pode expor dados. A triagem permite chamadas quando não consegue consultar contatos. Não há garantia de identificação de golpes.

## Relatar vulnerabilidade

Evite publicar dados pessoais, exploração detalhada ou segredos em issue pública. Quando o repositório estiver no GitHub, use reporte privado de vulnerabilidade se estiver habilitado; caso contrário, procure o canal privado divulgado pelo responsável. Ainda não existe endereço de contato definido neste projeto.

Inclua versão, Android/modelo, impacto e passos mínimos com dados sintéticos. O projeto não promete prazo de resposta nem versões com suporte enquanto o responsável não definir essa política.

## Revisão de mudanças

Novos fornecedores, permissões, rede, telemetria ou armazenamento exigem análise do fluxo de dados, finalidade, retenção e autorização. Nunca coloque credenciais no bundle web. Audit e linters ajudam a detectar problemas, mas não substituem revisão e teste em aparelho.
