# ADR 0010: Editar contatos pelo editor Android

- Status: Aceito
- Data: 27/10/2026

## Contexto

O aplicativo cadastrava contatos, mas não permitia editar registros existentes. A agenda pode conter contas sincronizadas, cadastros somente leitura e múltiplos registros para o mesmo telefone.

## Decisão

Adicionar `editContact(id)` à porta e à ponte. Validar a referência de uma linha de telefone, consultar o contato agregado no worker e abrir sua URI de lookup com `ACTION_EDIT` na thread principal. Quando houver vários registros agrupados, o usuário escolhe qual abrir. Atualizar a agenda ao retornar do editor.

## Alternativas consideradas

Atualizar todos os duplicados por número afetaria pessoas e contas sem escolha explícita. Um formulário próprio de edição teria que tratar provedores, campos extras e regras de vinculação; o editor Android já conhece essas restrições.

## Consequências

A edição usa a interface de contatos instalada, e não o formulário de cadastro do ChamadaCerta. A confirmação da ponte significa abertura, nunca salvamento. Não se pede permissão de escrita adicional para delegar a edição. Não há fusão automática nem edição em lote. Falhas de referência, permissão ou editor permanecem visíveis.

## Validação

Testar referência válida/inválida, seleção do cadastro agrupado, erro ao abrir e atualização após retorno. Em aparelho, validar salvar, cancelar, conta sincronizada e contato removido. [Contrato e comportamento](../contacts.md).
