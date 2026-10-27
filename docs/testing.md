# Estratégia de testes

## Automatizados

```sh
npm run verify
npm run android:verify
```

Vitest e Testing Library cobrem validações, ponte/decodificadores, estados sem plataforma, permissões, contatos, chamadas e falhas. Casos de uso usam gateways falsos para verificar autorização e efeitos sem React ou Android. Os testes Node verificam as regras de importação e ciclos. Testes Kotlin JVM cobrem domínio de números, contatos e política de proteção.

Compilação, Android Lint e Detekt conferem código nativo; eles não simulam Telecom nem substituem um dispositivo. Não há suíte instrumentada de ponta a ponta. O CI gera APK debug e não executa chamadas reais.

## Roteiro em aparelho

Registre modelo, versão Android, operadora, versão do APK e resultado. Use números de teste consentidos; nunca use serviços de emergência para teste.

1. Instalação limpa: conferir estado sem permissões e sem dados fictícios.
2. Telefone padrão: aceitar, recusar e trocar o papel nas configurações; retornar e conferir atualização da UI.
3. Ligações: permissão aceita/negada, link `tel:` sem ligação automática, discagem explícita, número inválido e aparelho sem conta telefônica.
4. Chamadas recebidas: aparelho aberto, bloqueado, aplicação em segundo plano e processo reiniciado; atender/recusar por UI e notificação.
5. Em chamada: encerrar, microfone, alto-falante, Bluetooth/fone, DTMF, espera, segunda chamada e conferência se disponíveis.
6. Contatos: leitura recusada/revogada, nome ou número inválido, gravação permitida/negada, falha do provedor e confirmação pela agenda do sistema.
7. Histórico: sem acesso, com acesso, revogação durante consulta, deduplicação e limpeza apenas dos registros locais.
8. Triagem: papel separado, contato conhecido, desconhecido com opção ligada/desligada, consulta indisponível e timeout. Falha deve permitir chamada.
9. Layout: 320 px até telas grandes, retrato/paisagem, recorte, barras do sistema, teclado aberto, fonte ampliada, leitor de tela e contraste.
10. Android 13/14+: notificações recusadas e autorização de tela cheia desligada; a UI deve explicar o ajuste necessário.

## Prévia de layout

Com `npm run dev` em execução e Chrome disponível, use `node scripts/verify-mobile.mjs`. `CHROME_PATH` seleciona outro executável. `NATIVE_PREVIEW=1` injeta uma ponte de teste somente no script, sem telefonia real. Essa verificação não valida permissões nem comportamento do Telecom.

## Critérios para regressões

Teste o comportamento observável: entrada inválida não pede permissão; recusa não produz efeito; erro não exibe sucesso; retorno tardio não altera pedido encerrado; permissão revogada não expõe dados parciais. Não crie testes que apenas repetem uma função ou congelam detalhes visuais sem propósito.

## Registro da refatoração de 27/10/2026

Verificação local: `verify` aprovado com 60 testes TypeScript/React e quatro testes das regras arquiteturais. `android:verify` aprovado com 11 testes JVM, Detekt e Spotless. Android Lint: zero erros e dois avisos de versões mais recentes de dependências AndroidX; o compilador também informa APIs legadas de telefonia/layout usadas na compatibilidade Android. Esses avisos continuam visíveis e devem ser avaliados na atualização de SDK e bibliotecas.

`npm audit` não reportou vulnerabilidades. O APK debug gerado teve assinatura verificada com `apksigner`. Nenhum aparelho estava conectado via ADB: atendimento, áudio, triagem e persistência em dispositivo continuam dependentes do roteiro manual acima. Não foi executado CI remoto nesta verificação.
