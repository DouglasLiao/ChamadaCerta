# Verificações de qualidade

| Ferramenta           | Política                                                                        |
| -------------------- | ------------------------------------------------------------------------------- |
| TypeScript           | Tipagem estrita, sem emissão no typecheck                                       |
| ESLint               | Regras com informação de tipos, hooks, promises e imports de tipos; zero avisos |
| Stylelint            | Padrão CSS, nomes `cc-` e sintaxe consistente                                   |
| Markdownlint         | Estrutura de Markdown                                                           |
| Prettier             | Formatação web, configuração, scripts e docs                                    |
| Spotless/ktfmt       | Formatação Kotlin e Gradle                                                      |
| Detekt               | Complexidade e estilo Kotlin, zero problemas permitidos                         |
| Android Lint         | Análise de APIs, recursos e manifesto                                           |
| Architecture checker | Camadas, ciclos, domínio Kotlin e métodos da ponte                              |
| Link checker         | Destinos locais de links Markdown                                               |

As verificações fazem parte de `verify` e `android:verify`, usados no [workflow](../.github/workflows/android.yml). O CI verifica audit npm em severidade alta ou superior. `npm audit` completo pode ser executado localmente. Zero achados não comprova ausência de vulnerabilidades.

## Exceções explícitas

- Stylelint preserva media queries `min/max` para compatibilidade do WebView; a regra de especificidade descendente está desligada porque compara componentes independentes e estados intencionais.
- Markdown não limita comprimento de linha; Prettier formata a prosa. HTML embutido é permitido. Títulos repetidos só são aceitos em seções diferentes.
- Detekt aceita até três retornos para guard clauses, até 25 funções por classe e métodos até 120 linhas; complexidade continua verificada. Números literais de dimensões/cores são permitidos. Capturas genéricas e exceções consumidas são aceitas nas fronteiras de plataforma; a revisão exige erro ou fallback documentado. Wildcards são tolerados somente nos testes.
- ESLint permite `console.error` para falhas de ferramentas, sem dados pessoais. Código de domínio/aplicação não pode acessar globais de navegador.
- `katex` possui override para `^0.19.1`: dependência transitiva do Markdownlint com correções de segurança. Revise a necessidade ao atualizar a cadeia, execute lint de docs e audit antes de removê-lo.

Detekt está configurado para análise de fontes sem resolução de tipos; isso evita tratar sua versão interna do Kotlin como compilador do aplicativo. A compilação Kotlin permanece uma verificação separada. Consulte [compatibilidade do Detekt](https://detekt.dev/docs/introduction/compatibility/).

O verificador de arquitetura não substitui revisão de comportamento e o de links não verifica âncoras, URLs externas ou links construídos em tempo de execução. Para detalhes, consulte os [scripts](../scripts/check-architecture.mjs) e [testes da política](../tests/tooling/architecture.test.mjs).
