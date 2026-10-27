# ADR 0005: Persistência local limitada e agenda do sistema

- Status: Aceito
- Data: 27/10/2026
- Origem: Retrospectivo: formaliza armazenamento existente.

## Contexto

O aplicativo necessita reter preferência e histórico de triagem, além de salvar contatos reais, sem criar uma agenda paralela ou serviço remoto.

## Decisão

Usar SQLite privado com até 500 registros, SharedPreferences para estado de proteção e ContentProvider Android para agenda. Ler até 200 chamadas do sistema e combinar sem apagar o histórico do aparelho. Preservar esquema e chaves.

## Alternativas consideradas

Room seria útil com consultas/migrações mais complexas; um backend não é necessário. Agenda própria duplicaria dados.

## Consequências

Dados privados são removidos na desinstalação; contatos persistem na agenda. Alterar esquema exige migração. Não há criptografia própria além da proteção Android.

## Validação

Testes de política e roteiro de persistência/revogação; [dados](../android.md).
