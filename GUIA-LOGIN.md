# Guia de login e cadastro de usuários

## Onde alterar os acessos

A lista de usuários fica no início de `assets/app.js`, no bloco identificado por:

```js
const LOGIN_USERS = [
```

Esse bloco é um conjunto de objetos JavaScript. Cada objeto representa uma pessoa autorizada a entrar no dashboard.

## Como adicionar uma pessoa

Copie um dos objetos existentes e acrescente um novo bloco antes do `];` final:

```js
{
  username: 'novo-usuario',
  password: 'NovaSenha2026!',
  name: 'Nome da pessoa',
  analyst: 'NOME DO ANALISTA'
},
```

O campo `username` é o nome digitado na tela de login. O campo `password` é a senha. O campo `name` aparece no topo do dashboard depois do acesso. O campo `analyst` define a carteira carregada inicialmente para a pessoa; use `analyst: ''` para permitir a visualização de todos os analistas.

A senha diferencia letras maiúsculas de minúsculas. Por exemplo, `Senha2026!` é diferente de `senha2026!`. Não remova as aspas, as vírgulas ou as chaves do bloco.

## Usuários incluídos nesta cópia

| Usuário | Senha | Carteira inicial |
|---|---|---|
| `admin` | `Next2026!` | Todos os analistas |
| `kellen` | `Kellen2026!` | KELEN |
| `pedro` | `Pedro2026!` | PEDRO |

Recomenda-se alterar as senhas de exemplo antes de divulgar o endereço à equipa.

## Como publicar uma alteração

Depois de alterar `assets/app.js`, salve o ficheiro. No GitHub, abra o mesmo caminho dentro do repositório, envie a nova versão ou edite o conteúdo diretamente e crie um novo commit.

Aguarde a publicação do GitHub Pages e atualize o site com `Ctrl + F5`. Se o navegador continuar conectado com o usuário anterior, clique em **Sair** ou abra o site numa janela anónima para testar a nova credencial.

## Limitação de segurança

> Este login é simples e funciona no navegador. As credenciais ficam no JavaScript, portanto não substituem uma autenticação real no servidor e não devem ser usadas como única proteção para informação confidencial.
