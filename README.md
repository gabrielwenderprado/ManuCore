# Dashboard de Estoque e Planejamento de Compras

Esta é uma cópia independente do dashboard baseado na planilha de explosão. O projeto funciona no navegador, não utiliza OAuth, banco de dados remoto, tRPC ou serviços externos, e mantém os dados no ficheiro `data/explosao.json`.

## Como abrir no VS Code

Abra a pasta deste projeto no VS Code ou no Explorador de Ficheiros. No Windows, dê dois cliques em `start-local.bat`. O script verifica o Python, inicia o servidor local na porta 5502 e abre automaticamente o navegador no endereço correto. Se o servidor já estiver ligado, ele não cria outro servidor e apenas abre o dashboard. O script também procura automaticamente o `index.html` dentro das subpastas e inicia o Python com essa pasta como diretório de trabalho explícito, evitando o erro 404 quando o ZIP é extraído dentro de uma pasta adicional.

Também é possível usar a extensão **Live Server** do VS Code. Abra `index.html`, clique com o botão direito sobre o ficheiro e escolha **Open with Live Server**. Nesse caso, utilize a porta mostrada no canto inferior direito do VS Code.

Quando usar o script do projeto, abra:

```text
http://127.0.0.1:5502/index.html
```

Não abra o ficheiro diretamente com `file://`. O navegador bloqueia a leitura de `data/explosao.json` quando a página não é servida por um servidor local. Se aparecer `404 File not found`, feche a janela antiga do servidor e use o `start-local.bat` da nova versão.

Para permitir acesso pela mesma rede Wi‑Fi, descubra o IPv4 do computador com `ipconfig` no Windows. Os colegas poderão abrir `http://SEU_IPV4:5502/index.html`, por exemplo `http://192.168.1.25:5502/index.html`. A janela do servidor pode permanecer aberta enquanto o dashboard estiver em uso. Se ela for fechada, dê novamente dois cliques em `start-local.bat`.

## Como atualizar os dados da planilha

O navegador não lê automaticamente uma planilha Excel local por motivos de segurança. Para atualizar os dados no Windows, arraste o novo ficheiro `.xlsm` sobre `atualizar-dados.bat`. O script executa o conversor e grava o resultado em `data/explosao.json`.

No Linux ou macOS, execute:

```bash
./atualizar-dados.sh /caminho/para/explosao.xlsm
```

Também é possível executar o conversor diretamente:

```bash
python scripts/convert_excel.py /caminho/para/explosao.xlsm
```

O conversor lê as abas `Estoque`, `Obtencao`, `Programacao`, `familia`, `estoque segurança` e as abas de modelos. Ele extrai, entre outros dados, família, tipo de obtenção, estoque, estoque de segurança, pedidos `PED`, demanda `DEM` e valor do estoque. O resultado é salvo em `data/explosao.json`.

Depois de atualizar o JSON, recarregue o dashboard com `Ctrl + F5`.

## O que o dashboard apresenta

A visão geral mostra materiais cadastrados, valor total do estoque, solicitações de obtenção em aberto, classificação de risco e pedidos previstos por mês. Os filtros globais combinam **Carteira**, **Família** e **Tipo de obtenção**.

A área **Estoque** permite pesquisar por código ou descrição e filtrar materiais críticos, em atenção ou regulares. A área **Pedidos e demanda** separa pedidos `PED` da demanda mensal `DEM` calculada na aba `Programacao`, mostrando o saldo projetado por item.

A área **Modelos** permite consultar os componentes de cada modelo. A área **Simulação** calcula a necessidade total de cada peça a partir do modelo escolhido e da quantidade de veículos informada. Os modelos de guindastes utilizam as colunas `Código`, `Descrição` e `Quantidade` da explosão.

Ao clicar em um código de material, o dashboard mostra estoque, segurança, consumo mensal, pedidos e quantidade sugerida para compra. O cartão de **Follow-up** abre a relação de pedidos de meses anteriores que precisam ser verificados com o time de compras.

## Organização dos ficheiros

| Ficheiro ou pasta | Função |
|---|---|
| `index.html` | Estrutura da tela de login e do dashboard |
| `assets/styles.css` | Cores, layout, responsividade e estilos dos componentes |
| `assets/app.js` | Login, filtros, cálculos, tabelas, detalhes e navegação |
| `assets/login-pcp.png` | Imagem usada na tela de login |
| `NEXT - Logo_edited.avif` | Logo exibido na barra lateral |
| `data/explosao.json` | Dados convertidos da planilha Excel |
| `data/consumiveis.json` | Dados convertidos da planilha de Consumíveis |
| `scripts/convert_consumiveis.py` | Conversor da planilha de Consumíveis para JSON |
| `atualizar-consumiveis.bat` | Atualização dos Consumíveis no Windows por arrastar e soltar |
| `scripts/convert_excel.py` | Conversor da explosão Excel para JSON |
| `scripts/list_sheets.py` | Ferramenta auxiliar para listar abas da planilha |
| `scripts/sample_core.py` | Ferramenta auxiliar para visualizar amostras das abas principais |
| `scripts/sample_sheets.py` | Ferramenta auxiliar para visualizar amostras de abas selecionadas |
| `atualizar-dados.bat` | Atualização dos dados no Windows |
| `atualizar-dados.sh` | Atualização dos dados no Linux ou macOS |
| `start-local.bat` | Inicialização do servidor local no Windows |
| `start-local.sh` | Inicialização do servidor local no Linux ou macOS |
| `GUIA-LOGIN.md` | Instruções para cadastrar e alterar acessos |
| `todo.md` | Histórico e lista de tarefas do projeto |

## Observação sobre segurança

O login desta cópia é uma camada simples no navegador. Os utilizadores e senhas ficam dentro de `assets/app.js`. Isso é útil para controlar o acesso informal da equipa, mas não equivale a uma autenticação segura de servidor. Não utilize esta proteção como única barreira para informação altamente confidencial.
