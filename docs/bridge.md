# Contrato da ponte Android

## Transporte

A UI empacotada usa `WebViewAssetLoader`, origem `https://appassets.androidplatform.net`. A ponte `ChamadaCertaNative` aceita mensagens do frame principal dessa origem; navegação e recursos remotos são restringidos. Não há fallback para uma ponte insegura quando `WEB_MESSAGE_LISTENER` falta.

Requisição JSON: `{ "id": "cc_1", "method": "status", "args": {} }`. Resposta: `{ "id": "cc_1", "result": {} }` ou `{ "id": "cc_1", "error": "mensagem" }`. IDs nativos precisam ter entre 1 e 100 caracteres. Não existe campo de versão do protocolo; cliente e nativo são distribuídos juntos no APK.

Consultas/ações expiram em 15 segundos; métodos `request*` em 180 segundos. Resposta tardia ou desconhecida é ignorada. Expiração não cancela um efeito nativo já iniciado: não repita automaticamente cadastro ou ligação. JSON malformado é ignorado; payloads de resposta passam pelos decodificadores antes de chegar à apresentação.

## Métodos

| Método                   | Argumentos                | Resultado                                         |
| ------------------------ | ------------------------- | ------------------------------------------------- |
| `status`                 | nenhum                    | Estado real de permissões, papéis e proteção      |
| `contacts`               | nenhum                    | `{items}` de contatos                             |
| `history`                | nenhum                    | `{items, warning}` de histórico                   |
| `dialRequest`            | nenhum                    | `{id, number}` da intenção pendente               |
| `dial`                   | `number`                  | Confirmação de encaminhamento ao Telecom          |
| `saveContact`            | `name, number`            | Confirmação de gravação                           |
| `editContact`            | `id` da linha de telefone | `{opened: true}`; abertura do editor Android      |
| `setBlocking`            | `enabled`                 | Estado atualizado                                 |
| `clearBlockedHistory`    | nenhum                    | `{cleared: true}`; somente registros locais       |
| `requestDefaultDialer`   | nenhum                    | Estado após escolha do papel                      |
| `requestScreening`       | nenhum                    | Estado após escolha de triagem                    |
| `requestCallPermission`  | nenhum                    | Estado após pedido de chamadas                    |
| `requestContacts`        | nenhum                    | Estado após pedido de leitura de contatos         |
| `requestWriteContacts`   | nenhum                    | Estado após pedido de escrita                     |
| `requestHistory`         | nenhum                    | Estado após pedido do histórico                   |
| `requestNotifications`   | nenhum                    | Estado; pedido somente quando exigido pela versão |
| `openFullScreenSettings` | nenhum                    | Confirmação de abertura das configurações         |
| `openSettings`           | nenhum                    | Confirmação de abertura das configurações         |
| `openInCall`             | nenhum                    | Confirmação de abertura da UI de chamada          |

A edição não confirma salvamento: o usuário pode cancelar o editor. Consulte [contatos](contacts.md).

A confirmação de `dial` não comprova conexão ou atendimento. A confirmação de uma tela de configuração não concede permissão.

## Fontes e evolução

As definições exatas de DTOs estão em [models](../src/domain/models.ts), as validações em [decoders](../src/platform/android/decoders.ts), o transporte em [bridge.ts](../src/platform/android/bridge.ts), o adaptador em [client](../src/platform/android/client.ts) e o despacho em [AndroidBridge](../android/app/src/main/java/com/chamadacerta/app/bridge/AndroidBridge.kt).

Ao adicionar método: atualize união TypeScript, porta, adaptador, despacho Kotlin, validação, testes e esta tabela. `check:architecture` compara os nomes; tipos, semântica e erros precisam dos testes. Erros de segurança/revogação viram mensagens ao usuário, sem registrar payloads pessoais.
