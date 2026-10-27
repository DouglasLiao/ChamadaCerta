# Entrega e manutenção

## Integração contínua

O [workflow Android](../.github/workflows/android.yml) assume este diretório como raiz do repositório. Em push para main/master, PR ou execução manual: instala dependências pelo lockfile, executa audit, verificações web, SDK e verificações Android. O APK debug é anexado ao job. Não há publicação nem chaves de produção no workflow.

Antes de enviar, execute localmente `npm run verify` e `npm run android:verify`. O resultado local não comprova uma execução remota do GitHub Actions.

## Checklist de versão

1. Atualize versão de pacote/lockfile e `versionName`/`versionCode` no Gradle; mantenha o código monotônico.
2. Atualize documentação e ADRs afetados, confira dependências e rode as verificações.
3. Execute o roteiro em aparelho e registre falhas/limites conhecidos.
4. Gere assinatura de produção sob responsabilidade do proprietário. Armazene chaves e senhas fora do repositório e não compartilhe a chave debug.
5. Configure o tipo release com assinatura própria, gere APK/AAB e verifique assinatura, manifesto e versão do artefato final.
6. Antes da loja, confira políticas vigentes de permissões de chamadas/contatos, papel padrão, tela cheia, privacidade e declaração de dados.

O projeto gera um APK **debug**, inadequado como entrega de produção. Não há configuração pronta de assinatura release, política de privacidade publicada, licença escolhida ou cadastro em loja. Esses itens dependem do responsável e do canal de distribuição.

## Recuperação e manutenção

Uma atualização assinada pela mesma chave preserva dados privados; downgrade pode ser recusado pelo Android. Não recomende desinstalar para corrigir um build sem explicar a perda do histórico/preferências. Contatos pertencem à agenda do sistema.

Mantenha o lockfile, Wrapper e checksums. Dependabot propõe atualizações; mudanças de major, permissões ou comportamento exigem revisão. Nunca inclua logs com números, nomes ou payloads de contatos em issues. Veja [segurança](../SECURITY.md).
