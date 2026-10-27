# Desenvolvimento

## Ambiente reproduzível

Use Node.js 24 (arquivo `.nvmrc`), JDK 17 e Android SDK 35/Build Tools 35.0.0. Instale dependências com `npm ci`; versione `package-lock.json`, Gradle Wrapper e configurações. Não versione SDK, JDK, caches, `.env`, keystores ou `android/local.properties`.

Exemplo PowerShell, ajustando os caminhos locais:

```powershell
$env:JAVA_HOME = 'C:\Ferramentas\jdk-17'
$env:ANDROID_HOME = 'C:\Ferramentas\android-sdk'
npm ci
npm run verify
npm run android:verify
```

Linux/macOS: exporte as mesmas variáveis e dê permissão de execução a `android/gradlew`. Licenças do SDK precisam estar aceitas no ambiente de build. A primeira compilação requer acesso aos repositórios npm e Gradle; o aplicativo instalado funciona sem rede.

## Comandos

| Comando                      | Uso                                     |
| ---------------------------- | --------------------------------------- |
| `npm run dev`                | Prévia local da interface               |
| `npm run format`             | Formatação web, scripts e documentação  |
| `npm run android:format`     | Formatação Kotlin/Gradle                |
| `npm run lint`               | ESLint, CSS e Markdown                  |
| `npm run check:architecture` | Dependências, ciclos e métodos da ponte |
| `npm run check:docs`         | Links locais da documentação            |
| `npm test`                   | Testes TypeScript/React                 |
| `npm run test:tooling`       | Testes da política arquitetural         |
| `npm run android:test`       | JVM, Android Lint, Spotless e Detekt    |
| `npm run android:debug`      | Assets e APK debug                      |
| `npm run verify`             | Verificação web completa                |
| `npm run android:verify`     | Verificação Android e APK               |

`mobile:sync` gera `dist/` e copia assets para `android/app/src/main/assets/web/`. Nunca edite essa saída. Scripts resolvem caminhos a partir da raiz do projeto, não de uma instalação pessoal.

## Diagnóstico

- Java ausente: confira `JAVA_HOME` e `java -version` (17).
- SDK ausente: configure `ANDROID_HOME`, `ANDROID_SDK_ROOT` ou `android/local.properties` e instale a plataforma 35.
- WebView incompatível: atualize Android System WebView. O aplicativo fecha com mensagem, sem reduzir a proteção da ponte.
- Sem chamadas na prévia: esperado; use APK em aparelho com telefonia e permissões.
- Alterações web não aparecem no APK: rode `android:debug`, que sincroniza os assets antes de compilar.
- Permissão revogada: retorne à aplicação e confira o estado; autorize pelas configurações quando necessário.

Antes de abrir PR, siga [CONTRIBUTING](../CONTRIBUTING.md) e o [roteiro de testes](testing.md).
