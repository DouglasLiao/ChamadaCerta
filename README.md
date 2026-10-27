# ChamadaCerta Android

Aplicativo Android 10+ para centralizar discagem, contatos e chamadas. Interface React/TypeScript empacotada no APK, integração Android em Kotlin, sem servidor e sem permissão de internet.

## Funcionalidades

- Recentes: histórico de triagem e histórico do aparelho, quando autorizado.
- Teclado: ligação real com confirmação no botão **Ligar**; links `tel:` apenas preenchem o número.
- Contatos: busca indexada, agrupamento de números equivalentes, cadastro e edição pelo editor da agenda Android. Resultados em páginas de 50 números para manter a resposta em agendas grandes.
- Telefone padrão: solicitação de `ROLE_DIALER`, atendimento, recusa, encerramento, microfone, saída de áudio, espera, DTMF, seleção de conta e conferência conforme capacidades do Telecom.
- Proteção: bloqueio opcional de números fora dos contatos com `CallScreeningService`. Erros na consulta permitem a chamada.

Nenhum provedor de spam está integrado. A interface informa **Verificação indisponível**. Bloquear desconhecidos não equivale a identificar golpes. Vídeo é atendido em áudio; não existe interface de vídeo.

## Preparação e execução

Requisitos: Node.js 24, npm, JDK 17 (`JAVA_HOME`), Android SDK plataforma 35 e Build Tools 35.0.0 (`ANDROID_HOME`). O Gradle Wrapper está incluído. Android Studio é opcional.

Na raiz desta pasta:

Copie `.env.example` para `.env` e ajuste os caminhos locais, se necessário. Consulte [configuração por ambiente](docs/configuration.md). O CI usa os padrões sem depender de um arquivo pessoal.

```sh
npm ci
npm run verify
npm run android:verify
```

O APK de desenvolvimento fica em `artifacts/ChamadaCerta-debug.apk`. Para instalar em um aparelho com depuração USB autorizada:

```sh
adb install -r artifacts/ChamadaCerta-debug.apk
```

Selecione **Definir como telefone padrão** e confirme na janela do Android. Autorize chamadas e notificações; no Android 14+, confira também a autorização de tela cheia. Leitura de contatos, escrita de contatos, histórico e papel de triagem são autorizações distintas, solicitadas conforme a ação.

```sh
npm run dev
```

Abre uma prévia em `http://127.0.0.1:3100`. Recursos do aparelho ficam indisponíveis sem a ponte nativa.

## Qualidade e estrutura

`npm run verify` executa ESLint tipado, Stylelint, Markdownlint, Prettier, regras de arquitetura, links locais da documentação, testes de ferramentas, testes da interface, TypeScript e build. `npm run android:verify` sincroniza os assets, compila, testa Kotlin e executa Android Lint, Spotless e Detekt.

```text
src/domain/          Modelos e validações puras
src/application/     Portas e casos de uso
src/platform/        Adaptadores Android e verificador indisponível
src/presentation/    Estado e coordenação React com dependências injetadas
src/features/        Telas e interações por funcionalidade
src/shared/          UI genérica e estilos
src/app/             Composição de telas
src/main.tsx         Composição das dependências
android/             Aplicativo Kotlin e integração com o sistema
scripts/             Build e verificações locais/CI
docs/                Arquitetura, contratos, procedimentos e ADRs
```

Comece pelo [índice da documentação](docs/README.md), [guia de desenvolvimento](docs/development.md), [padrões](docs/standards.md) e [decisões de arquitetura](docs/adr/README.md). Veja também [contribuição](CONTRIBUTING.md) e [segurança](SECURITY.md).

O workflow [Android](.github/workflows/android.yml) verifica alterações e publica o APK debug como artefato quando este diretório é a raiz do repositório. Não há assinatura de produção ou publicação automática em loja. Este projeto não define licença de distribuição; ela deve ser escolhida pelo responsável antes da publicação.
