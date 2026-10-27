# Documentação

Escopo: aplicativo Android independente ChamadaCerta, versão 2.3.0. Revisão: 27/10/2026.

| Documento                               | Conteúdo                                       |
| --------------------------------------- | ---------------------------------------------- |
| [Arquitetura](architecture.md)          | Camadas, responsabilidades e limites           |
| [Configuração](configuration.md)        | Ambiente, opções públicas e ferramentas locais |
| [Desenvolvimento](development.md)       | Instalação, comandos e diagnóstico             |
| [Padrões](standards.md)                 | Código, revisão e tratamento de falhas         |
| [Ponte Android](bridge.md)              | Mensagens, métodos, validação e prazos         |
| [Permissões e dados](android.md)        | Papéis, persistência e ciclo de vida           |
| [Contatos e performance](contacts.md)   | Agrupamento, busca, edição e benchmark         |
| [Testes](testing.md)                    | Cobertura automatizada e roteiro em aparelho   |
| [Qualidade](quality.md)                 | Linters, exceções e verificações               |
| [Entrega](release.md)                   | CI, assinatura e publicação                    |
| [ADRs](adr/README.md)                   | Decisões e alternativas                        |
| [Provedores de spam](spam-providers.md) | Pesquisa para uma futura integração            |

Altere a documentação no mesmo conjunto de mudanças do comportamento. Uma mudança estrutural exige um novo ADR ou a substituição explícita de um ADR anterior. Links locais são conferidos por `npm run check:docs`; links externos e âncoras exigem revisão humana.
