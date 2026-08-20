# Análise da planilha de consumíveis

Ficheiro analisado: `consumiveisPronta12.08.xlsx`.

A aba principal para integração é `consumiveis`, com 643 linhas e 26 colunas. As duas primeiras linhas contêm regras de cálculo; a linha 3 contém os cabeçalhos.

| Coluna Excel | Cabeçalho identificado | Uso no dashboard |
|---|---|---|
| A | Código | Identificador clicável do consumível |
| B | Descrição | Descrição exibida na tabela e no detalhe |
| D | Estoque | Saldo atual |
| E | Quantidade Compra | Quantidade sugerida/planeada para comprar |
| F | Estoque Mín | Limite mínimo |
| G | Estoque Max. | Limite máximo |
| M | Status Estoque | Estado mínimo, por exemplo `OK` ou `Comprar` |
| N | Status Estq. Máx. | Estado máximo, por exemplo `ok` ou `acima do maximo 🚨` |

A mesma aba também possui informação complementar útil para pedidos e follow-up: data da compra, data da próxima compra, situação da revisão e colunas de pedidos mensais `PED 08/2026` até `PED 12/2026`, além de `soma pedidos` e `Comprar`.

A aba `Planilha2` parece ser uma base auxiliar de consumos e mínimos/máximos, enquanto a aba `Cons. Solda` é uma listagem específica de consumíveis de máquinas Boxer. A integração principal deve usar a aba `consumiveis`, mantendo as outras abas disponíveis para referência.

Os dados observados são reais da planilha enviada; não foram criados valores de teste para a base.
