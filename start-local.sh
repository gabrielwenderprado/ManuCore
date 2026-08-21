#!/usr/bin/env bash
set -e

# Entra na pasta do próprio script para que todos os caminhos relativos funcionem.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Verifica se a página principal está disponível antes de iniciar o servidor.
if [ ! -f "$SCRIPT_DIR/index.html" ]; then
  echo "ERRO: index.html não foi encontrado em $SCRIPT_DIR"
  exit 1
fi

echo "Pasta servida: $SCRIPT_DIR"
echo "Abra neste computador: http://127.0.0.1:5502/index.html"
echo "Para outros computadores: http://SEU_IPV4:5502/index.html"
echo "Para parar o servidor, pressione Ctrl+C."

# Inicia o servidor local usando a pasta do projeto como raiz do site.
python3 -m http.server 5502 --bind 127.0.0.1 --directory "$SCRIPT_DIR"
