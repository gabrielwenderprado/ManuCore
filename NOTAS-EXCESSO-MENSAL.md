# Notas da análise de pedidos em excesso

A base da atualização é o ZIP `PCM-ATT_9.0(3).zip`, extraído em `/tmp/pcm-excesso-base/PCM-ATT_9.0`.

A aplicação usa `assets/app.js`. Os pedidos ficam em `item.orders`, as demandas em `item.demands`, e os meses são chaves como `PED 09/2026` e `DEM 09/2026`. A página Follow-up usa `followUpView()` e `followUpRows()`; o detalhe geral usa `openMaterialDetail(code)`.

A página existente `ordersView()` seleciona um mês pela variável `demandMonth`, mas ainda não tem uma análise que compare `orders[PED mês]` com `demands[DEM mês]` no mesmo mês.

Regra solicitada: não acumular meses. Para cada par do mesmo mês, calcular excesso quando o pedido do mês for maior que a demanda do mesmo mês. A área deve mostrar código, descrição, estoque, demanda do mês, pedido do mês e indicador de excesso. Ao clicar no código, abrir detalhe com estoque, demanda e pedidos dos meses seguintes, com o mês excedente destacado em vermelho.

Consumíveis ficam fora da nova análise; a estrutura específica de `CONSUMABLES` não deve ser alterada.
