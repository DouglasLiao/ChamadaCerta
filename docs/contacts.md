# Contatos: agrupamento, edição e performance

## Busca e apresentação

A agenda é indexada quando seu conteúdo muda. O índice usa mapa por número equivalente, nomes sem acentos e dígitos de todos os cadastros. Cada busca percorre textos preparados, sem normalizar novamente cada contato ou consultar o Android. `useDeferredValue` mantém a digitação prioritária; os resultados são memoizados e paginados em até 50 números. A navegação por página não consulta o provedor.

Um nome diferente no mesmo número continua pesquisável. Um contato com dois números diferentes aparece em dois grupos. Cada grupo preserva os registros originais e seus IDs; não há exclusão, fusão ou regravação automática da agenda. O telefone mostrado e discado continua sendo o original do primeiro cadastro no grupo.

## Equivalência brasileira conservadora

Exemplos agrupados, todos com DDD 21 e o mesmo assinante:

| Formato                      | Exemplo                                      |
| ---------------------------- | -------------------------------------------- |
| Nacional                     | `21987654321`                                |
| Zero + DDD                   | `021987654321`                               |
| Código do Brasil             | `+55 (21) 98765-4321` ou `5521987654321`     |
| Zero + operadora + DDD       | `0 21 21 98765-4321` ou `0 15 21 98765-4321` |
| Acesso internacional sem CSP | `005521987654321`                            |

A chave exige DDD brasileiro reconhecido e formato completo de fixo ou celular atual. O DDD 55 não é retirado de um número nacional de 10/11 dígitos. Números locais sem DDD, países diferentes, ramais, códigos curtos e formatos inválidos não são unidos por sufixo. Não se acrescenta o nono dígito nem se deduz DDD pelo aparelho. Há falsos negativos intencionais para evitar juntar pessoas diferentes.

A regra é uma comparação local, não um validador mundial de telefonia. O padrão com CSP segue a [orientação da Anatel](https://www.gov.br/anatel/pt-br/regulado/numeracao/codigos-nacionais/codigo-de-selecao-de-prestadora-csp). A implementação e os casos limite estão em [contactNumber](../src/domain/contactNumber.ts) e [testes](../tests/contactDirectory.test.ts).

## Edição

Toque no lápis ao lado do contato. Quando houver vários registros no grupo, escolha o cadastro. O aplicativo resolve o ID da linha de telefone para a URI de lookup do contato e abre `ACTION_EDIT` no editor Android, conforme a [documentação de contatos](https://developer.android.com/identity/providers/contacts-provider/modify-data). Assim, conta sincronizada, campos adicionais e restrições do provedor ficam sob responsabilidade do editor do sistema.

`editContact` confirma apenas que o editor abriu; não informa que o usuário salvou. A edição pode ser cancelada. Ao voltar, a agenda é invalidada e recarregada. Não é necessário pedir escrita ao ChamadaCerta para abrir esse editor. O cadastro pelo formulário próprio continua usando `WRITE_CONTACTS`.

Não há edição em lote dos duplicados. Contatos já vinculados pelo próprio Android podem abrir o mesmo contato agregado; os diferentes cadastros são preservados conforme o provedor. Se o cadastro foi removido, a leitura foi revogada ou não existe editor, exiba erro sem criar contato substituto.

## Atualizações da agenda

O repositório Kotlin mantém um snapshot em memória, sem cache persistido adicional. Uma revisão atômica impede reutilizar cache invalidado. Eventos do provedor, cadastro e retorno à Activity invalidam o snapshot. Leituras exigem permissão; consultas são executadas no worker e fecham o cursor. Eventos nativos repetidos são agrupados em uma janela de 250 ms.

A apresentação preserva a referência do array quando IDs, nomes e números não mudaram. Atualizações em segundo plano não desmontam uma lista já carregada. Revogação de acesso limpa os contatos. A invalidação depende das notificações do provedor; retornar ao aplicativo força nova leitura mesmo quando o provedor não notificou a mudança.

## Reprodução do benchmark

Depois de `npm run build`, inicie a prévia de produção:

```sh
npx vite preview --host 127.0.0.1 --port 3100
```

Em outro terminal PowerShell:

```powershell
$env:CONTACTS_BENCHMARK = '1'
node scripts/verify-mobile.mjs
```

O script injeta somente no navegador uma agenda sintética com 10 mil cadastros, agrupados em cinco mil números. Verifica as quatro telas em diferentes tamanhos, confirma limite de 50 linhas, executa 20 buscas com CPU do Chrome desacelerada quatro vezes e falha se houver consulta nativa durante a busca. Salva amostras e tempos em `artifacts/contacts-performance.json`.

Esses dados sintéticos não entram no APK. O resultado mede o navegador no computador de teste, não o desempenho do S23 Ultra. Compare execuções no mesmo equipamento/build. Teste também no aparelho com agenda real, sincronização, retomada, revogação de permissão, edição salva/cancelada e fontes ampliadas.

## Resultado local em 27/10/2026

Na prévia de produção 2.3.0, com dez mil cadastros/cinco mil grupos e CPU Chrome em 4×: 20 buscas, mediana de 12,7 ms e máximo de 17,2 ms. A lista manteve 50 linhas; nenhuma busca enviou mensagem à ponte nativa. As quatro telas não apresentaram transbordamento horizontal em 320×568, 390×844, 900×900 e 844×390.

Verificações automatizadas: 82 testes TypeScript/React, quatro da política arquitetural e 13 JVM. APK debug compilado e assinatura verificada; Android Lint sem erros, com dois avisos de atualização de dependências já registrados. Não havia dispositivo conectado para validar o editor Samsung ou o tempo de resposta da agenda real.
