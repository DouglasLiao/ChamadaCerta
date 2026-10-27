# Avaliação de provedores de reputação

Pesquisa de documentação pública em 27/10/2026. Nenhum provedor foi contratado, configurado ou incluído no APK. O aplicativo continua sem permissão de rede e mostra verificação indisponível.

## Proposta inicial

A recomendação inicial é testar **tellows** com números brasileiros representativos e licença compatível com a distribuição do aplicativo. A documentação oferece Live API, Scorelist e informações como score, categoria e relatos. Há presença e documentação local no Brasil, mas isso não comprova cobertura completa, baixa latência ou taxa de acerto no conjunto de chamadas do aplicativo. Esses pontos precisam ser medidos.

[Programa de API tellows](https://www.tellows.com/s/about-en/tellows-api-partnership-program) · [Informações de API no Brasil](https://www.tellows.com.br/c/about-tellows-pt/registro/).

Como alternativa de parceria, avaliar **Hiya Protect**. A documentação de cache descreve listas de spam/fraude e requisitos contratuais/de informação ao usuário. Não confundir esse produto com Number Reputation, voltado ao cadastro e acompanhamento de números de empresas. Acesso comercial, cobertura brasileira, atualização e redistribuição em dispositivo precisam ser confirmados com o fornecedor.

[Cache Hiya Protect](https://developer.hiya.com/docs/protect/cache/endpoints/v-1-get-spammer-cache) · [Number Reputation](https://developer.hiya.com/docs/guides/voice-protection/number-reputation/get-started).

Twilio Lookup pode complementar validação de linha, operadora e outros sinais, mas sua documentação não o apresenta como substituto direto de uma base de spam de chamadas recebidas no Brasil; Caller Name é limitado a operadoras dos EUA. Não seria a primeira integração para este requisito.

[Twilio Lookup](https://www.twilio.com/docs/lookup/v2-api).

## Critérios antes de contratar

- Cobertura e atualização para números brasileiros, precisão e tratamento de números reciclados/spoofing.
- Custo por consulta, volume, cache, disponibilidade e suporte a falhas.
- Licença para incorporar resultados/listas em aplicativo distribuído, atribuição e política de dados.
- Definição do que é enviado e clareza para o usuário; contatos conhecidos devem continuar locais.
- Amostra de avaliação independente com chamadas legítimas e suspeitas, sem classificar ausência de resultado como segurança.

## Integração sugerida

Usar uma base local atualizada em segundo plano, se a licença permitir, e proteger a credencial de fornecedor em backend próprio. A decisão de triagem não deve aguardar indiscriminadamente uma consulta externa. Manter prazo, cancelamento, cache com validade e estados de suspeita, inconclusivo, erro e indisponibilidade. Não embutir chaves no APK nem enviar a agenda inteira.

Essa é uma proposta técnica, não uma integração implementada. A escolha final depende da qualidade observada no Brasil e da proposta comercial.
