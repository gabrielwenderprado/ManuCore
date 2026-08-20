# Atualizar Consumíveis

Para atualizar a planilha de Consumíveis, mantenha a aba chamada `consumiveis` e coloque o cabeçalho na linha 3.

Depois, arraste o ficheiro Excel sobre `atualizar-consumiveis.bat`, localizado na pasta principal do projeto. O script procura o Python instalado, executa `scripts/convert_consumiveis.py` e atualiza automaticamente `data/consumiveis.json`.

Quando a mensagem de sucesso aparecer, abra ou atualize o dashboard e pressione `Ctrl+F5`. Se o site estiver publicado no GitHub Pages, envie o ficheiro `data/consumiveis.json` atualizado para o repositório.

O script aceita ficheiros `.xlsx` e `.xlsm`, desde que a estrutura da aba permaneça compatível com a planilha original. Se a conversão falhar, confirme o nome da aba, a linha do cabeçalho e se o Python com `openpyxl` está instalado.
