# Android: permissões, dados e ciclo de vida

## Autorizações

| Acesso                   | Finalidade                       | Momento                                                 |
| ------------------------ | -------------------------------- | ------------------------------------------------------- |
| `CALL_PHONE`             | Iniciar ligação pelo Telecom     | Ação Ligar                                              |
| `READ_CONTACTS`          | Agenda e consulta para triagem   | Autorizar contatos/proteção                             |
| `WRITE_CONTACTS`         | Cadastro real                    | Confirmar Salvar                                        |
| `READ_CALL_LOG`          | Histórico do sistema             | Autorizar histórico                                     |
| `POST_NOTIFICATIONS`     | Avisos de chamada no Android 13+ | Configuração do telefone                                |
| `USE_FULL_SCREEN_INTENT` | UI de chamada recebida           | Configuração; Android 14+ pode exigir ajuste específico |
| `ROLE_DIALER`            | Aplicativo de telefone padrão    | Escolha explícita no sistema                            |
| `ROLE_CALL_SCREENING`    | Triagem                          | Escolha explícita no sistema                            |

O papel de discador e o de triagem são distintos. Permissões podem ser recusadas ou revogadas a qualquer momento. Estado é consultado novamente ao retornar à Activity. O manifesto não declara internet. Serviços exportados de Telecom/triagem exigem permissões de bind do sistema; UI de chamada e receiver de ações não são exportados.

## Persistência

- Agenda: ContentProvider do Android; escrita em lote por `ContactWriter`, não uma agenda paralela.
- Histórico Android: leitura autorizada, até 200 entradas consultadas, sem apagar registros do aparelho.
- Histórico de triagem: SQLite privado `protection.db`, esquema versão 1, tabela `calls`, até 500 entradas mais recentes. Número, data, estado, motivo e indicador de contato ficam locais.
- Preferências: `chamadacerta_prefs`, chaves `block_non_contacts` e `last_screening_error`.
- Limpar histórico remove somente registros locais de triagem. Desinstalar remove dados privados; contatos gravados pertencem à agenda e permanecem.

O banco ainda não possui migração entre versões porque há apenas esquema 1. Qualquer mudança exige incremento e migração testada; não use recriação destrutiva silenciosa. Backup automático está desabilitado e regras de extração estão declaradas. O armazenamento usa a proteção do sandbox Android, sem criptografia adicional própria.

## Chamadas e triagem

Telecom controla o estado e as capacidades disponíveis. Interface nativa atende, rejeita, encerra, silencia, alterna áudio, espera, DTMF e conferência quando suportado pelo aparelho/operadora. A seleção de conta é apresentada quando exigida. Não persista referências `Call` ou assuma que toda chamada permite espera/conferência.

`CallScreeningService` aplica bloqueio apenas quando a preferência está ligada e a consulta de contatos está disponível. Prazo interno: 3,5 segundos. Timeout, cancelamento e falha permitem a chamada. A resposta é protegida contra duplicação. Não use consultas de rede no caminho crítico sem nova decisão de arquitetura.

Receber `ACTION_DIAL` ou `tel:` prepara o teclado; não executa chamada. Para comportamento em aparelhos reais, siga [testes](testing.md).
