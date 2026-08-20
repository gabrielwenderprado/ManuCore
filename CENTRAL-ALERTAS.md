# Central de Avisos da Produção

A ferramenta continua a funcionar offline por padrão. Nesse modo, cada navegador guarda os avisos no próprio `localStorage`, o que permite testar sem internet, mas não compartilha os avisos com outros computadores.

Para receber avisos em tempo real entre a linha de produção e o planeamento, use o endpoint Google Apps Script incluído em `scripts/google-apps-script-alertas.gs`. Ele grava os alertas numa aba chamada `Alertas` de uma Google Sheet e disponibiliza os mesmos dados para todos os acessos ao dashboard.

## Ativação

Crie uma Google Sheet vazia, abra **Extensões > Apps Script**, cole o conteúdo de `scripts/google-apps-script-alertas.gs` e guarde o projeto. Em seguida, use **Implantar > Nova implantação**, selecione **Aplicativo da Web**, escolha executar como a sua conta e permita acesso a qualquer pessoa com o link. Copie a URL gerada.

Abra `data/alertas-config.json` e preencha o campo `endpoint` com essa URL. O campo `modo` pode ser alterado para `central`. Depois de publicar os ficheiros atualizados no GitHub Pages, todos os dispositivos que abrirem o dashboard passarão a consultar a mesma central aproximadamente a cada 20 segundos.

> A configuração inicial permanece vazia de propósito. Assim, o sistema não envia dados para nenhum serviço externo antes de o responsável escolher e publicar a sua própria planilha.

## Contrato da API

| Operação | URL | Finalidade |
|---|---|---|
| `GET` | `{endpoint}/alerts` | Ler todos os alertas partilhados |
| `POST` | `{endpoint}/alerts` | Gravar o conjunto atualizado de alertas |

O dashboard mantém uma cópia local para operar durante uma indisponibilidade temporária. Quando a central volta a responder, a leitura seguinte atualiza o painel.

## Segurança e operação

O login existente é uma proteção simples no cliente e não deve ser tratado como autenticação forte. Para dados sensíveis, restrinja o acesso da Google Sheet e avalie uma API com autenticação por utilizador. Não coloque chaves privadas no JavaScript publicado no GitHub Pages.
