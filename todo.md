# TODO — PCM-ATT_9.0

- [x] Extrair e auditar o projeto real PCM-ATT_9.0
- [x] Preservar login, filtros, estoque, consumíveis, pedidos, evolução, simulação e processo de compra
- [x] Adicionar acesso à ferramenta Aviso da Produção
- [x] Criar formulário para líderes informarem falta de material
- [x] Guardar alertas no navegador para uso local/offline
- [x] Relacionar o alerta ao código e consultar estoque, pedidos, analista e compra sugerida
- [x] Criar central de alertas semelhante ao mockup aprovado
- [x] Adicionar filtros por estado, líder, linha e código
- [x] Adicionar detalhe do material e estados de tratamento
- [x] Adicionar testes de regressão e do novo fluxo
- [x] Validar desktop, telemóvel e execução local
- [x] Empacotar o PCM atualizado em ZIP
- [x] Auditar a estrutura do Plano Mês na nova planilha XLSM
- [x] Transformar a Visão geral numa página informativa sem repetir a tabela de itens
- [x] Adicionar Plano Mês por modelo e mês na Visão geral
- [x] Permitir selecionar meses anteriores em Pedidos e Demanda
- [x] Preservar follow-up para meses anteriores ao mês atual
- [x] Congelar cabeçalhos das tabelas com nomes das colunas
- [x] Clarificar gráficos como itens/unidades, não quantidade de pedidos
- [x] Executar mais de dez testes e validações de regressão
- [x] Empacotar a nova versão do PCM
- [x] Escolher a arquitetura central para receber os formulários dos líderes
- [x] Substituir o localStorage por armazenamento centralizado dos alertas
- [x] Atualizar o formulário e a central para sincronização entre dispositivos
- [ ] Testar envio num dispositivo e recebimento no painel noutro dispositivo

- [x] Remover o bloco de Leitura rápida/Indicadores de acompanhamento da Visão geral conforme solicitado.
- [x] Mover o acesso ao Follow-up para baixo de Processo de compra no menu.
- [x] Corrigir a escala/normalização dos valores de Itens em pedidos por mês, especialmente setembro.
- [x] Manter modelo e quantidade selecionados na Simulação após adicionar item ao Processo de compra.
- [x] Revalidar a versão corrigida com testes de sintaxe, regressão e fluxo funcional.

- [x] Extrair a última movimentação da coluna AS da Explosão para cada material.
- [x] Exibir a data de movimentação em tamanho compacto nas tabelas, com “não tem” quando vazia.
- [x] Validar a conversão dos valores e o funcionamento das tabelas após a nova coluna.

- [x] Substituir a renderização de até 15.000 linhas por carregamento progressivo em blocos.
- [x] Manter filtros, pesquisa, detalhes e Processo de compra funcionais com a tabela progressiva.
- [x] Validar o desempenho e evitar travamentos ao consultar todos os materiais.

- [x] Confirmar se o Excel atualizado foi convertido novamente para `data/plano-mes.json`.
- [x] Corrigir o fluxo de atualização do Plano Mês para regenerar o snapshot automaticamente.
- [x] Validar que os valores exibidos no dashboard correspondem à planilha mais recente.

- [x] Usar o ZIP enviado como base da atualização.
- [x] Identificar a coluna de estoque máximo na nova Explosão 18.08.
- [x] Integrar estoque máximo nas abas gerais aplicáveis, exceto Consumíveis.
- [x] Exibir estoque máximo nas tabelas, detalhes e simulação da Explosão.
- [x] Validar dados, regras e empacotar a nova versão.

- [x] Usar o ZIP PCM-ATT_9.0(3) como base desta atualização.
- [x] Criar a área mensal de Pedidos em excesso, sem acumular meses.
- [x] Exibir código, descrição, estoque, demanda, pedido e indicador de excesso.
- [x] Abrir detalhe por código com os próximos meses e destacar em vermelho o mês excedente.
- [x] Validar filtros, cálculo mensal, modal e regressão antes de entregar.

- [x] Preservar filtros e posição da tela ao clicar no `+` em Estoque.
- [x] Preservar o contexto ao adicionar itens nas demais tabelas filtradas.
- [x] Testar filtros críticos, situação, analista, família, obtenção e pesquisa de código.
- [x] Validar todos os botões `+` e gerar o ZIP corrigido.

- [x] Reproduzir o caso do material 01.11.01.0000000019 na área Pedidos em excesso.
- [x] Corrigir a área Pedidos em excesso para usar os pares mensais reais de pedido e demanda.
- [x] Garantir que o botão `+` preserve filtros e posição no projeto efetivamente publicado.
- [x] Testar o fluxo completo com filtros, detalhe por código e Processo de compra.

## Correção do mapa da produção
- [x] Verificar se o snapshot `data/plano-mes.json` existe no pacote.
- [x] Confirmar a origem e o formato esperado dos dados do Plano Mês.
- [x] Restaurar ou gerar o snapshot sem inventar dados de produção.
- [x] Validar o carregamento do mapa na aplicação.

## Ajuste visual solicitado
- [x] Reduzir a largura dos campos de data na configuração semanal.
- [x] Reduzir a largura dos campos de quantidade por modelo.
- [x] Validar o comportamento responsivo da lista de modelos.
