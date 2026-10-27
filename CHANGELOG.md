# Alterações

## 2.2.0 — 27/10/2026

- Adiciona a escolha de ChamadaCerta como telefone padrão pela janela oficial do Android.
- Inicia chamadas reais por TelecomManager após autorização e ação explícita do usuário.
- Implementa UI nativa de chamadas recebidas e em andamento, notificações e controles de áudio, espera, DTMF e contas.
- Salva contatos reais na agenda local a partir dos contatos, do teclado ou do histórico, preservando rascunhos quando há falha.
- Recebe links de telefone e pedidos ACTION_DIAL sem discagem automática.
- Amplia a margem superior e mantém o layout em telas pequenas e na horizontal.
- Acrescenta testes de permissões, papel de discador, cadastro e preenchimento de números externos.

## 2.1.1 — 27/10/2026

- Preserva os registros locais de triagem quando a consulta ao histórico Android falha ou perde autorização.
- Exibe aviso e opção para repetir a leitura quando o histórico está parcial.
- Atualiza os detalhes a partir do registro atual e remove dados selecionados quando a fonte deixa de fornecê-los.
- Limpa avisos de fontes antigas quando o estado do aparelho fica indisponível.
- Inclui a ponte TypeScript na verificação de formatação, corrigindo o escopo da regra de exclusão.
- Acrescenta testes de regressão dos estados do histórico e da resposta parcial.
