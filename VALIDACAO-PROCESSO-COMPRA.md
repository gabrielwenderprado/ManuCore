# Validação do Processo de compra

A funcionalidade foi validada antes da entrega da nova versão.

## Verificações concluídas

| Verificação | Resultado |
|---|---|
| Presença de `index.html` na raiz do projeto | Aprovado |
| Presença de `assets`, `data` e `scripts` | Aprovado |
| Presença de `start-local.bat` | Aprovado |
| Ausência de `--directory` no arranque | Aprovado |
| `index.html` por HTTP | 200 |
| `assets/app.js` por HTTP | 200 |
| `assets/styles.css` por HTTP | 200 |
| `data/explosao.json` por HTTP | 200 |
| `data/consumiveis.json` por HTTP | 200 |
| Sintaxe JavaScript | Aprovado |
| Menu Processo de compra | Aprovado |
| Botão `+` nas tabelas | Aprovado por inspeção e estrutura |
| Deduplicação por código e origem | Aprovado por inspeção |
| Persistência em `localStorage` | Aprovado por inspeção |
| Exportação para `.xls` compatível com Excel | Aprovado por inspeção e estrutura |

O arranque continua a usar a pasta do projeto como diretório de trabalho e testa a resposta de `index.html` antes de abrir o navegador.
