# Configuração por ambiente

Copie `.env.example` para `.env` na raiz do projeto. O arquivo local foi criado nesta estação; somente o modelo deve ser versionado. O checkout também funciona sem `.env`, com os padrões abaixo. Variáveis exportadas no terminal/CI têm prioridade sobre os arquivos.

## Opções públicas do aplicativo

| Variável                            | Padrão   | Limites      | Uso                                        |
| ----------------------------------- | -------- | ------------ | ------------------------------------------ |
| `VITE_CONTACT_PAGE_SIZE`            | `50`     | 10–100       | Números por página                         |
| `VITE_CONTACT_RECORD_PAGE_SIZE`     | `20`     | 5–50         | Cadastros por página de um grupo expandido |
| `VITE_BRIDGE_DATA_TIMEOUT_MS`       | `15000`  | 1000–60000   | Prazo de consultas e ações, em ms          |
| `VITE_BRIDGE_PERMISSION_TIMEOUT_MS` | `180000` | 30000–300000 | Prazo de pedidos de permissão/papel, em ms |

A validação central em [config](../src/config/parseRuntimeConfig.ts) exige inteiros dentro dos limites e rejeita valores vazios ou inválidos no início do build. A interface e a ponte usam o objeto imutável de [runtime](../src/config/runtime.ts). Domínio e aplicação não acessam ambiente; o linter bloqueia leitura direta fora da camada `config`.

Essas opções são substituídas no build pelo Vite e ficam visíveis no JavaScript empacotado no APK. Não coloque tokens, senhas, credenciais ou chaves privadas em `VITE_*`. Alterações exigem reiniciar a prévia e gerar novamente o APK com `npm run android:debug`. Elas não são configurações alteráveis no aplicativo instalado. Veja o [comportamento de ambiente do Vite](https://vite.dev/guide/env-and-mode.html).

## Ferramentas locais

| Variável             | Padrão                                      | Uso                                             |
| -------------------- | ------------------------------------------- | ----------------------------------------------- |
| `DEV_HOST`           | `127.0.0.1`                                 | Host de desenvolvimento e prévia                |
| `DEV_PORT`           | `3100`                                      | Porta de desenvolvimento/prévia; 1024–65535     |
| `CHROME_DEBUG_PORT`  | `9337`                                      | Porta do Chrome no teste visual; 1024–65535     |
| `CHROME_PATH`        | comando `chrome` no PATH                    | Executável do navegador para verificação visual |
| `APP_URL`            | URL composta por host/porta acima           | Endereço opcional da prévia no teste visual     |
| `NATIVE_PREVIEW`     | `0`                                         | Ponte simulada apenas no script visual          |
| `CONTACTS_BENCHMARK` | `0`                                         | Agenda sintética apenas no benchmark            |
| `JAVA_HOME`          | Ambiente do sistema ou `.tools/jdk`         | JDK usado pelo wrapper Node do Android          |
| `ANDROID_HOME`       | Ambiente do sistema ou `.tools/android-sdk` | SDK Android                                     |
| `ANDROID_SDK_ROOT`   | Ambiente do sistema                         | Alternativa de SDK já suportada                 |

O Vite respeita `.env`, `.env.local` e os arquivos específicos do modo (`development`, `production`, `test`). Ferramentas Node carregam o modo `development`, incluindo `.env.development`, e preservam as variáveis do processo. Use `.env` para os caminhos comuns das ferramentas. O objeto completo de ambiente fica no processo Node e nunca é passado para `define` ou exposto ao cliente.

`npm run android:*` usa o carregador Node e entende os caminhos do `.env`. Android Studio e Gradle chamado diretamente continuam usando suas próprias configurações de JDK/SDK; eles não interpretam o `.env` automaticamente.

Os testes Vitest fixam as quatro opções públicas nos padrões para que a suíte não dependa da configuração pessoal. Há testes separados para valores válidos, inválidos e limites. O benchmark de contatos documentado usa os padrões de paginação (50/20); restaure esses valores para comparar suas amostras com o registro original.

## Valores que permanecem no código

DDDs, validações de telefone, métodos/eventos da ponte, origem privilegiada do WebView, permissões Android, regra de bloqueio, prazo nativo de triagem de 3,5 segundos e esquema/limites de persistência são regras ou contratos do produto. Não são variáveis de implantação. Mantê-los no código preserva os testes e a consistência entre Kotlin e TypeScript.

Não há credencial de fornecedor de spam ou backend configurada. Adicionar uma credencial ao `.env` não cria armazenamento seguro de segredos no APK.

## Verificação local em 27/10/2026

`verify` aprovado com 94 testes TypeScript/React e seis testes de ferramentas; `android:verify` aprovado, incluindo 13 testes JVM e geração do APK. Build sem arquivo `.env` aprovado, valor de paginação fora dos limites rejeitado e regra ESLint confirmada com detecção/correção de ponto e vírgula. A prévia e o teste visual carregaram as configurações locais. Não houve teste em aparelho nesta alteração.
