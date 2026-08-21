#!/usr/bin/env bash
set -e
if [ -z "$1" ]; then
  echo "Uso: ./atualizar-dados.sh /caminho/para/explosao.xlsm"
  exit 1
fi
python3 scripts/convert_excel.py "$1"
echo "Dados atualizados em data/explosao.json"
