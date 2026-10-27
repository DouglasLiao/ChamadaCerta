# Arquitetura

## Objetivo e limites

A arquitetura separa regras testáveis das APIs do Android e da interface. A direção das dependências é verificada por script. Não há backend, serviço de reputação, sincronização remota ou implementação para outra plataforma.

## Camadas TypeScript

| Camada             | Responsabilidade                                | Dependências permitidas                                     |
| ------------------ | ----------------------------------------------- | ----------------------------------------------------------- |
| `domain`           | Modelos, número discável e validação do contato | Apenas domínio                                              |
| `application`      | `placeCall`, `saveContact`, comandos e portas   | Aplicação e domínio                                         |
| `platform`         | Transporte nativo, decodificação e adaptadores  | Plataforma, aplicação, domínio e config                     |
| `presentation`     | Contexto, atualização de estado e intents       | Apresentação, aplicação, domínio, shared e config           |
| `features`         | Telas e ações do usuário                        | Features, apresentação, aplicação, domínio, shared e config |
| `config`           | Opções públicas validadas do build              | Apenas config                                               |
| `shared`           | Componentes genéricos e CSS                     | Apenas shared                                               |
| `app` e `main.tsx` | Composição                                      | Todas                                                       |

O núcleo não importa React, APIs do navegador, pacotes externos ou adaptadores. A apresentação recebe `DeviceGateway` por injeção; somente a composição instancia `deviceApi`. O [verificador](../scripts/check-architecture.mjs) detecta violações, ciclos e diferenças nos métodos da ponte. Ele analisa imports estáticos e imports dinâmicos literais, não toda semântica do programa.

## Fluxos principais

1. Ligar: `CallAction` chama um comando; `placeCall` valida o número, solicita permissão se necessário e usa `CallGateway.dial`. O adaptador valida a confirmação nativa. `DeviceActions` valida novamente e chama Telecom.
2. Salvar: o formulário confirma o cadastro; `saveContact` valida nome e número, solicita escrita e delega ao gateway. `ContactWriter` usa `ContentResolver.applyBatch`; somente sucesso real fecha o fluxo.
3. Atualizar: `useDeviceState` consulta estado, contatos e histórico. Eventos e retorno à tela atualizam permissões. Falhas ficam visíveis; dados inválidos não são promovidos a domínio.
4. Receber: Telecom entrega a chamada ao `PhoneCallService`. A Activity de chamada e notificações são nativas e independem do WebView.
5. Triar: o serviço consulta contatos, aplica `ProtectionPolicy` e responde dentro do prazo. Falha ou indisponibilidade permite a chamada.

## Android

`domain/` Kotlin contém validações e política puras, testadas na JVM. `bridge/` trata origem local, mensagens, permissões e ações. `data/` acessa ContentProviders, preferências e SQLite. `calls/` coordena Telecom, interface nativa, notificações e áudio. `service/` coordena a triagem. `MainActivity` monta dependências e acompanha ciclo de vida.

Os pacotes Android externos ainda usam DTOs JSON e APIs de plataforma diretamente. Não se afirma uma separação completa de todos os serviços Android em módulos independentes; a fronteira pura é o domínio, e a aplicação TypeScript usa portas. Novos casos complexos devem extrair regras antes de aumentar Activities e serviços.

## Concorrência e recursos

Consultas da ponte usam executor dedicado; respostas e UI voltam à thread principal. Cursores, banco e executores têm fechamento explícito. A triagem usa consultas canceláveis, prazo de 3,5 segundos e resposta protegida contra duplicação. Estado de chamada é reconstruído a partir do Telecom; não persista objetos `Call`.

A interface distingue carregamento, erro, indisponibilidade e permissão negada. Histórico do sistema é combinado com uma cópia do histórico local; falha não deve expor resultado parcial. A deduplicação usa número equivalente e janela de dez segundos, preservando motivos de bloqueio locais.

## Evolução

Consulte os [ADRs](adr/README.md). Integrações de spam devem implementar uma porta própria, explicitar retenção e autorização, e manter o caminho de atendimento independente da rede. Adicionar uma interface de gateway não autoriza transmissão de dados.

## Contatos em agendas grandes

A lista usa índice memoizado por snapshot e páginas de 50 grupos. A comparação por número preserva IDs e variantes para edição individual. O editor é delegado ao Android por URI de lookup. O cache nativo invalida por eventos do provedor, cadastro e retomada, com verificação de permissão; a apresentação mantém o array anterior quando os dados não mudam. Veja [contatos e performance](contacts.md) e ADRs 0009/0010.

## Configuração externa

A camada `config` lê e valida somente as opções públicas do build. Pode ser importada por plataforma, apresentação, features e composição; não depende delas. Domínio, aplicação e UI genérica não acessam ambiente. O verificador de arquitetura e o ESLint reforçam esse limite. Consulte [configuração](configuration.md).
