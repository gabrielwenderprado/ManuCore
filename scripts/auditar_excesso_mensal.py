import json
from pathlib import Path

root = Path('/tmp/pcm-excesso-base/PCM-ATT_9.0')
data = json.loads((root / 'data' / 'explosao.json').read_text(encoding='utf-8'))
print('itens', len(data.get('items', [])))
for item in data.get('items', []):
    if item.get('orders') or item.get('demands'):
        print('codigo', item.get('code'))
        print('orders', list(item.get('orders', {}).items())[:8])
        print('demands', list(item.get('demands', {}).items())[:8])
        break
print('demandMonths', data.get('demandMonths'))
print('months', data.get('months'))
