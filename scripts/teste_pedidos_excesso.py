import json
import re
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
data = json.loads((BASE / 'data' / 'explosao.json').read_text(encoding='utf-8'))
item = next(item for item in data['items'] if str(item['code']).strip() == '01.11.01.0000000019')

pairs = []
for order_month in data.get('months', []):
    suffix = re.sub(r'^PED\s*', '', str(order_month))
    demand_month = f'DEM {suffix}'
    if demand_month in set(data.get('demandMonths', [])):
        pairs.append((order_month, demand_month))

assert ('PED 08/2026', 'DEM 08/2026') in pairs
assert ('PED 09/2026', 'DEM 09/2026') in pairs
assert ('PED 10/2026', 'DEM 10/2026') in pairs
assert ('PED 11/2026', 'DEM 11/2026') in pairs

rows = []
for order_month, demand_month in pairs:
    order = float(item['orders'].get(order_month, 0) or 0)
    demand = float(item['demands'].get(demand_month, 0) or 0)
    if order > demand and order > 0:
        rows.append((order_month, order - demand))

assert dict(rows)['PED 08/2026'] == 177
assert dict(rows)['PED 09/2026'] == 3138
assert dict(rows)['PED 10/2026'] == 1785
assert dict(rows)['PED 11/2026'] == 1800

source = (BASE / 'assets' / 'app.js').read_text(encoding='utf-8')
assert "addToPurchaseProcess(item, kind, { refresh: false })" in source
assert "if (added) markPurchaseButtonsForItem(item, kind);" in source
print('PEDIDOS_EXCESSO_OK', len(rows), sum(value for _, value in rows))
print('PROCESSO_COMPRA_PRESERVA_CONTEXTO_OK')
