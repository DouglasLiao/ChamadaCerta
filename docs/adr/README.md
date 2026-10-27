# Decisões de arquitetura

ADRs registram contexto, alternativas e consequências. Registros retrospectivos descrevem decisões já implementadas; decisões novas identificam a refatoração. Todos os registros aceitos abaixo correspondem ao código atual.

| Número | Decisão                                                                                 | Status |
| ------ | --------------------------------------------------------------------------------------- | ------ |
| 0001   | [Interface local React e telefonia Kotlin](0001-hybrid-android.md)                      | Aceito |
| 0002   | [Portas, casos de uso e dependências para dentro](0002-clean-architecture.md)           | Aceito |
| 0003   | [Ponte restrita à origem local e dados validados](0003-local-bridge.md)                 | Aceito |
| 0004   | [Telecom como autoridade e autorização explícita](0004-telecom-roles.md)                | Aceito |
| 0005   | [Persistência local limitada e agenda do sistema](0005-local-storage.md)                | Aceito |
| 0006   | [Triagem permite chamada em falha e não inventa reputação](0006-fail-open-screening.md) | Aceito |
| 0007   | [Build com assets gerados e ferramentas fixadas](0007-packaged-build.md)                | Aceito |
| 0008   | [Qualidade automatizada e exceções documentadas](0008-quality-gates.md)                 | Aceito |
| 0009   | [Índice de contatos e agrupamento](0009-contact-directory.md)                           | Aceito |
| 0010   | [Edição pelo editor Android](0010-system-contact-editor.md)                             | Aceito |
| 0011   | [Configuração validada por ambiente](0011-environment-configuration.md)                 | Aceito |

Para propor uma decisão, copie o [template](template.md), use o próximo número e status Proposto. Após implementação e revisão, marque Aceito. Para reverter, crie outro ADR, marque o anterior Substituído e ligue os dois; preserve o contexto histórico.
