let DATA = null;
// Controla qual área do dashboard está aberta neste momento.
let view = 'overview';
let analyst = 'all';
let family = 'all';
let obtentionType = 'all';
// Guarda os filtros selecionados pelo usuário para manter a navegação consistente.
let demandMonth = 'all';
let excessMonth = 'all';
// Guarda o histórico mensal carregado do ficheiro separado.
let STOCK_HISTORY = { records: [] };
// Guarda os consumíveis carregados a partir da planilha específica.
let CONSUMABLES = { items: [], months: [] };
// Lista local dos itens selecionados para o Processo de compra.
let PURCHASE_PROCESS = [];
// Mantém os conjuntos de dados fora do HTML e carrega as linhas em pequenos blocos.
const TABLE_DATASETS = new Map();
let TABLE_SEQUENCE = 0;
const TABLE_CHUNK_SIZE = 250;
const PURCHASE_STORAGE_KEY = 'pcm-processo-compra';
// Lista local dos avisos enviados pela produção. Cada navegador mantém o seu histórico offline.
let PRODUCTION_ALERTS = [];
let ALERTS_ENDPOINT = '';
let alertsSyncTimer = null;
const PRODUCTION_ALERTS_STORAGE_KEY = 'pcm-alertas-producao';

// Carrega os avisos do navegador enquanto a central não estiver configurada.
function loadLocalProductionAlerts() {
  try {
    const saved = localStorage.getItem(PRODUCTION_ALERTS_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

// Guarda uma cópia local para o uso offline e para recuperação em caso de falha.
function saveLocalProductionAlerts() {
  try { localStorage.setItem(PRODUCTION_ALERTS_STORAGE_KEY, JSON.stringify(PRODUCTION_ALERTS)); } catch (error) { /* armazenamento local indisponível */ }
}

// Lê a configuração opcional da central publicada (Google Apps Script ou API compatível).
async function loadProductionAlerts() {
  PRODUCTION_ALERTS = loadLocalProductionAlerts();
  try {
    const response = await fetch('data/alertas-config.json', { cache: 'no-store' });
    if (response.ok) {
      const config = await response.json();
      ALERTS_ENDPOINT = String(config.endpoint || '').trim().replace(/\/$/, '');
    }
  } catch (error) {
    ALERTS_ENDPOINT = '';
  }
  if (ALERTS_ENDPOINT) await syncProductionAlerts();
}

// Sincroniza os avisos entre todos os navegadores quando existe um endpoint central.
async function syncProductionAlerts() {
  if (!ALERTS_ENDPOINT) return;
  try {
    const response = await fetch(`${ALERTS_ENDPOINT}/alerts`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (Array.isArray(payload.alerts)) {
      PRODUCTION_ALERTS = payload.alerts;
      saveLocalProductionAlerts();
      if (view === 'productionAlerts') render();
    }
  } catch (error) {
    console.warn('Central de alertas indisponível; mantendo cópia local.', error);
  }
}

// Envia o estado completo ao endpoint central e conserva o modo offline como fallback.
async function saveProductionAlerts() {
  saveLocalProductionAlerts();
  if (!ALERTS_ENDPOINT) return;
  try {
    await fetch(`${ALERTS_ENDPOINT}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alerts: PRODUCTION_ALERTS })
    });
  } catch (error) {
    console.warn('Não foi possível enviar o alerta para a central.', error);
  }
}

// Soma a necessidade/demanda disponível para o item no JSON atual.
function alertDemand(item) {
  return Object.values(item?.demands || {}).reduce((sum, value) => sum + n(value), 0);
}

// Soma apenas pedidos quantitativos ainda registados no item.
function alertOrders(item) {
  return Object.values(item?.orders || {}).reduce((sum, value) => sum + n(value), 0);
}

// Usa a mesma lógica de cobertura para explicar a compra sugerida no alerta.
function alertSnapshot(item) {
  const stock = n(item?.stock);
  const safety = n(item?.safety);
  const demand = alertDemand(item);
  const orders = alertOrders(item);
  return {
    stock,
    safety,
    demand,
    orders,
    suggestedPurchase: Math.max(0, demand + safety - stock - orders),
    analyst: item?.analyst || '—',
    family: item?.family || '—',
    obtentionType: item?.obtentionType || '—',
    unit: item?.unit || 'UN'
  };
}

// Localiza um item pelo código ou por parte da descrição.
function findAlertItem(query) {
  const value = String(query || '').trim().toLowerCase();
  if (!value) return null;
  return (DATA?.items || []).find(item => String(item.code).toLowerCase() === value)
    || (DATA?.items || []).find(item => `${item.code} ${item.description}`.toLowerCase().includes(value))
    || null;
}

// Cria o retrato do material no momento em que o líder envia o aviso.
function createProductionAlert(form) {
  const item = findAlertItem(form.code);
  const snapshot = alertSnapshot(item);
  const alert = {
    id: `AL-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    leader: String(form.leader || '').trim(),
    line: String(form.line || '').trim(),
    code: item?.code || String(form.code || '').trim(),
    description: item?.description || String(form.description || '').trim(),
    message: String(form.message || '').trim(),
    status: 'Novo',
    history: [{ status: 'Novo', at: new Date().toISOString(), by: String(form.leader || '').trim() || 'Produção' }],
    ...snapshot
  };
  PRODUCTION_ALERTS.unshift(alert);
  void saveProductionAlerts();
  return alert;
}

// Atualiza o estado de um aviso e preserva o histórico da operação.
function updateProductionAlertStatus(id, status) {
  const alert = PRODUCTION_ALERTS.find(item => item.id === id);
  if (!alert) return;
  const actor = currentUser?.name || 'Responsável';
  alert.status = status;
  alert.history = Array.isArray(alert.history) ? alert.history : [];
  alert.history.push({ status, at: new Date().toISOString(), by: actor });
  void saveProductionAlerts();
}


const LOGIN_USERS = [
{
    username: 'admin',
    password: 'Next2026',
    name: 'Administrador',
    analyst: ''
  },
    {
    username: 'Edicleial',
    password: 'edi2026',
    name: 'Edicleia',
    analyst: ''
  },
    {
    username: 'compras@next',
    password: 'Next2026',
    name: 'Time compras',
    analyst: ''
  },
   {
    username: 'gabriel',
    password: 'Next2026',
    name: 'Administrador',
    analyst: ''
  },
   {
    username: 'rodrigo',
    password: 'Next2026',
    name: 'Administrador',
    analyst: ''
  },
   {
    username: 'bruno',
    password: 'Bruno2026',
    name: 'Bruno',
    analyst: 'BRUNO'
  },
  {
    username: 'kelen',
    password: 'Kelen2026',
    name: 'Kellen',
    analyst: 'KELEN'
  },
  {
    username: 'pedro',
    password: 'Pedro2026',
    name: 'Pedro',
    analyst: 'PEDRO'
  }

];

const AUTH_STORAGE_KEY = 'pcm-dashboard-session';
let currentUser = null;

const $ = selector => document.querySelector(selector);
const n = value => Number(value) || 0;
const fmt = value => n(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const money = value => n(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
function movementDate(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw.toLowerCase() === 'nao tem' || raw.toLowerCase() === 'não tem') return 'não tem';
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : raw;
}
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
}[char]));

// Remove valores repetidos e organiza opções de filtro em ordem alfabética.
function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));
}

// Verifica se um material corresponde aos três filtros globais atuais.
function matchesGlobalFilters(item) {
  const analystOk = analyst === 'all' || (item.analyst || '').toLowerCase() === analyst.toLowerCase();
  const familyOk = family === 'all' || (item.family || '') === family;
  const obtentionOk = obtentionType === 'all' || (item.obtentionType || '') === obtentionType;
  return analystOk && familyOk && obtentionOk;
}

// Retorna apenas os materiais que correspondem aos filtros globais atuais.
function scopedItems() {
  return DATA.items.filter(matchesGlobalFilters);
}

function itemByCode(code) {
  const wanted = String(code ?? '').trim();
  return DATA.items.find(item => String(item.code ?? '').trim() === wanted);
}

// Converte a quantidade de compra para um valor positivo e exportável.
function purchaseQuantity(item, kind = 'explosion') {
  if (kind === 'consumable') {
    const state = consumableStatus(item);
    if (state.label === 'Acima do máximo') return 0;
    return Math.max(0, Math.abs(n(item.purchaseQty)));
  }
  return Math.max(0, suggestedPurchase(item));
}

// Cria uma chave estável para não duplicar materiais na lista de compras.
function purchaseKey(item, kind = 'explosion') {
  return `${kind}:${String(item.code ?? '').trim()}`;
}

function isInPurchaseProcess(item, kind = 'explosion') {
  return PURCHASE_PROCESS.some(entry => entry.key === purchaseKey(item, kind));
}

function addToPurchaseProcess(item, kind = 'explosion', options = {}) {
  const quantity = purchaseQuantity(item, kind);
  if (!quantity || isInPurchaseProcess(item, kind)) return false;
  PURCHASE_PROCESS.push({ key: purchaseKey(item, kind), code: String(item.code ?? ''), description: String(item.description ?? ''), quantity, source: kind === 'consumable' ? 'Consumível' : 'Explosão' });
  savePurchaseProcess();
  if (options.refresh !== false) render();
  return true;
}

function removeFromPurchaseProcess(key) {
  PURCHASE_PROCESS = PURCHASE_PROCESS.filter(entry => entry.key !== key);
  savePurchaseProcess();
  render();
}

function savePurchaseProcess() {
  try { localStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(PURCHASE_PROCESS)); } catch (error) { console.warn('Não foi possível guardar o Processo de compra.', error); }
}

function loadPurchaseProcess() {
  try {
    const saved = JSON.parse(localStorage.getItem(PURCHASE_STORAGE_KEY) || '[]');
    PURCHASE_PROCESS = Array.isArray(saved) ? saved.filter(entry => entry && entry.key && entry.code) : [];
  } catch (error) {
    PURCHASE_PROCESS = [];
  }
}

// Gera um ficheiro .xls simples que abre diretamente no Microsoft Excel.
function exportPurchaseProcess() {
  if (!PURCHASE_PROCESS.length) return;
  const rows = PURCHASE_PROCESS.map(entry => `<tr><td>${esc(entry.code)}</td><td>${esc(entry.description)}</td><td>${fmt(entry.quantity)}</td></tr>`).join('');
  const documentContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table><thead><tr><th>Código</th><th>Descrição</th><th>Quantidade de compra</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
  const blob = new Blob([`\\ufeff${documentContent}`], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `processo-de-compra-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function purchaseAction(item, kind = 'explosion') {
  const quantity = purchaseQuantity(item, kind);
  const added = isInPurchaseProcess(item, kind);
  const disabled = !quantity || added;
  const label = added ? '✓' : '+';
  const title = added ? 'Item já está no Processo de compra' : (!quantity ? 'Não existe quantidade de compra positiva' : 'Adicionar ao Processo de compra');
  return `<button class="purchase-add-btn${added ? ' added' : ''}" data-purchase-key="${esc(purchaseKey(item, kind))}" data-purchase-kind="${kind}" data-purchase-code="${esc(item.code)}" title="${title}" aria-label="${title}" ${disabled ? 'disabled' : ''}>${label}</button>`;
}

// Classifica o material comparando estoque, necessidade e pedidos em aberto.
function risk(item, demand) {
  const needed = n(demand ?? item.safety);
  const stock = n(item.stock);
  const orders = Object.values(item.orders || {}).reduce((sum, value) => sum + n(value), 0);
  if (stock >= needed) return ['Regular', 'green'];
  return [orders > 0 ? 'Em atenção' : 'Crítico', orders > 0 ? 'amber' : 'red'];
}

function monthDate(label) {
  const match = String(label || '').match(/(\d{2})\/(\d{4})/);
  return match ? new Date(Number(match[2]), Number(match[1]) - 1, 1) : null;
}

function currentMonthDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function isPastOrderMonth(label) {
  const date = monthDate(label);
  return date ? date < currentMonthDate() : false;
}

// Converte os pedidos do objeto de dados em uma lista pronta para a interface.
function orderEntries(item) {
  return Object.entries(item.orders || {})
    .map(([month, quantity]) => ({ month, quantity: n(quantity), overdue: isPastOrderMonth(month) }))
    .filter(entry => entry.quantity > 0);
}

function overdueOrders(item) {
  return orderEntries(item).filter(entry => entry.overdue);
}

function followUpItems(items = scopedItems()) {
  return items
    .map(item => ({ ...item, overdueOrders: overdueOrders(item) }))
    .filter(item => item.overdueOrders.length > 0);
}

// Calcula a compra sugerida considerando demanda, segurança, estoque e pedidos.
function suggestedPurchase(item) {
  const totalDemand = Object.values(item.demands || {}).reduce((sum, value) => sum + n(value), 0);
  const totalOrders = Object.values(item.orders || {}).reduce((sum, value) => sum + n(value), 0);
  return Math.max(0, totalDemand + n(item.safety) - n(item.stock) - totalOrders);
}

function optionList(values, selected, label) {
  return `<select class="select" id="${label.id}"><option value="all">${label.all}</option>${values.map(value => `<option value="${esc(value)}" ${selected === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select>`;
}

// Monta a barra de filtros compartilhada pelas áreas do dashboard.
function filterBar() {
  const families = DATA.families || uniqueSorted(DATA.items.map(item => item.family));
  const types = DATA.obtentionTypes || uniqueSorted(DATA.items.map(item => item.obtentionType));
  return `<div class="toolbar global-filters">
    <label class="filter-label">Carteira:</label>
    ${optionList(DATA.analysts || [], analyst, { id: 'analyst-filter', all: 'Todos os analistas' })}
    <label class="filter-label">Família:</label>
    ${optionList(families, family, { id: 'family-filter', all: 'Todas as famílias' })}
    <label class="filter-label">Obtenção:</label>
    ${optionList(types, obtentionType, { id: 'obtention-filter', all: 'Todos os tipos' })}
  </div>`;
}

function itemRows(items, limit = 200, showDemand = false, offset = 0) {
  return items.slice(offset, offset + limit).map(item => {
    const [label, color] = risk(item, showDemand ? item.need : undefined);
    const orders = Object.values(item.orders || {}).reduce((sum, value) => sum + n(value), 0);
    const demand = showDemand
      ? `<td>${fmt(item.need || 0)} ${esc(item.unit)}</td><td class="${n(item.balance) < 0 ? 'danger' : ''}">${fmt(item.balance || 0)}</td>`
      : '';
    return `<tr>
      <td><button class="material-code" data-code="${esc(item.code)}" title="Abrir detalhe do material">${esc(item.code)}</button><div class="desc" title="${esc(item.description)}">${esc(item.description)}</div></td>
      <td>${esc(item.analyst || '—')}</td>
      <td>${fmt(item.stock)} ${esc(item.unit)}</td>
      <td>${fmt(item.stockMax || 0)} ${esc(item.unit)}</td>
      <td>${fmt(item.safety)}</td>
      <td>${esc(item.family || '—')}</td>
      <td>${esc(item.obtentionType || '—')}</td>
      <td class="movement-date">${esc(movementDate(item.lastMovement))}</td>
      ${demand}<td>${fmt(orders)}</td><td><span class="status ${color}">${label}</span></td><td>${purchaseAction(item)}</td>
    </tr>`;
  }).join('');
}

function table(items, limit = TABLE_CHUNK_SIZE, showDemand = false) {
  const columns = showDemand ? 13 : 11;
  const id = `progressive-table-${++TABLE_SEQUENCE}`;
  const initialLimit = Math.min(Math.max(Number(limit) || TABLE_CHUNK_SIZE, 50), TABLE_CHUNK_SIZE);
  TABLE_DATASETS.set(id, { items, showDemand, cursor: initialLimit });
  const rows = itemRows(items, initialLimit, showDemand);
  const more = items.length > initialLimit ? `<div class="table-load-more"><span>Mostrando ${fmt(initialLimit)} de ${fmt(items.length)} itens</span><button class="secondary-btn table-more-btn" data-table-id="${id}">Carregar mais</button></div>` : `<div class="table-load-more"><span>${fmt(items.length)} itens carregados</span></div>`;
  return `<div class="progressive-table" data-progressive-table="${id}"><div class="table-wrap"><table class="data-table"><thead><tr>
    <th>Material</th><th>Analista</th><th>Estoque</th><th>Estoque máximo</th><th>Segurança</th><th>Família</th><th>Tipo de obtenção</th><th>Última movimentação</th>
    ${showDemand ? '<th>Demanda</th><th>Saldo</th>' : ''}<th>Pedidos</th><th>Situação</th><th>Processo de compra</th>
  </tr></thead><tbody>${rows || `<tr><td colspan="${columns}" class="empty">Nenhum item encontrado.</td></tr>`}</tbody></table></div>${more}</div>`;
}

// Carrega linhas adicionais com pausas curtas para manter a interface responsiva.
function bindProgressiveTables() {
  document.querySelectorAll('.table-more-btn').forEach(button => {
    button.onclick = () => {
      const id = button.dataset.tableId;
      const dataset = TABLE_DATASETS.get(id);
      const container = document.querySelector(`[data-progressive-table="${id}"]`);
      const tbody = container?.querySelector('tbody');
      if (!dataset || !container || !tbody) return;
      button.disabled = true;
      const start = dataset.cursor;
      const end = Math.min(start + TABLE_CHUNK_SIZE, dataset.items.length);
      window.setTimeout(() => {
        tbody.insertAdjacentHTML('beforeend', itemRows(dataset.items, end - start, dataset.showDemand, start));
        dataset.cursor = end;
        const label = container.querySelector('.table-load-more span');
        if (label) label.textContent = end < dataset.items.length ? `Mostrando ${fmt(end)} de ${fmt(dataset.items.length)} itens` : `${fmt(end)} itens carregados`;
        if (end < dataset.items.length) button.disabled = false;
        else button.remove();
        bindMaterialButtons();
        bindPurchaseButtons();
      }, 0);
    };
  });
}

// Cria os cartões com os principais indicadores da visão geral.
function metrics() {
  const base = scopedItems();
  const critical = base.filter(item => risk(item)[0] === 'Crítico').length;
  const attention = base.filter(item => risk(item)[0] === 'Em atenção').length;
  const followUpCount = followUpItems(base).length;
  return `<div class="metrics">
    <div class="metric" style="--metric-bg:#eaf2ff"><div class="metric-label">Materiais cadastrados</div><div class="metric-value">${fmt(base.length)}</div><div class="metric-note">Itens da explosão</div></div>
    <div class="metric" style="--metric-bg:#e8f8f0"><div class="metric-label">Valor do estoque</div><div class="metric-value">${money(base.reduce((sum, item) => sum + n(item.stockValue), 0))}</div><div class="metric-note">Valor em reais da Programacao</div></div>
    <div class="metric" style="--metric-bg:#fff4db"><div class="metric-label">Pedidos em aberto</div><div class="metric-value">${fmt(DATA.openRequests)}</div><div class="metric-note">Solicitações na obtenção</div></div>
    <div class="metric" style="--metric-bg:#ffebed"><div class="metric-label">Itens críticos</div><div class="metric-value">${fmt(critical)}</div><div class="metric-note">${fmt(attention)} em atenção</div></div>
    <button class="metric metric-clickable follow-up-metric" id="follow-up-metric" style="--metric-bg:#fff0f0"><div class="metric-label">Acompanhamento de pedidos</div><div class="metric-value">${fmt(followUpCount)}</div><div class="metric-note">Itens com pedido em atraso</div></button>
  </div>`;
}

function riskChart() {
  const base = scopedItems();
  const counts = { Crítico: 0, 'Em atenção': 0, Regular: 0 };
  base.forEach(item => counts[risk(item)[0]]++);
  const max = Math.max(...Object.values(counts), 1);
  return `<div class="panel"><div class="panel-header"><h3>Situação dos materiais</h3><span>${fmt(base.length)} itens avaliados</span></div><div class="panel-body">${[['Crítico', 'red'], ['Em atenção', 'amber'], ['Regular', 'green']].map(([label, color]) => `<div class="chart-row"><span>${label}</span><div class="bar-track"><div class="bar-fill bar-${color}" style="width:${counts[label] / max * 100}%"></div></div><b>${counts[label]}</b></div>`).join('')}<div class="legend"><span><i style="background:#e05252"></i>Sem estoque e sem pedido</span><span><i style="background:#e6aa42"></i>Com pedido previsto</span><span><i style="background:#31ae7a"></i>Estoque suficiente</span></div></div></div>`;
}

function orderGraphValue(total) {
  // Alguns totais do snapshot perderam a casa decimal na conversão do Excel.
  // Valores acima de 100 mil são apresentados na escala de unidades solicitada pela operação.
  return total >= 100000 ? total / 10 : total;
}

function orderPanel() {
  const months = DATA.months || [];
  const base = scopedItems();
  const totals = months.map(month => base.reduce((sum, item) => sum + n(item.orders?.[month]), 0));
  const displayed = totals.map(orderGraphValue);
  const max = Math.max(...displayed, 1);
  return `<div class="panel"><div class="panel-header"><h3>Itens em pedidos por mês</h3><span>Quantidade de itens/unidades nas colunas PED</span></div><div class="panel-body">${months.map((month, index) => `<div class="chart-row"><span>${esc(month.replace('PED ', ''))}</span><div class="bar-track"><div class="bar-fill" style="background:#3278df;width:${displayed[index] / max * 100}%"></div></div><b>${fmt(displayed[index])} itens</b></div>`).join('') || '<div class="empty">Sem colunas de pedidos.</div>'}</div></div>`;
}

function planMonthPanel() {
  const plan = DATA.planMonth || { models: [], months: [] };
  const models = plan.models || [];
  const months = plan.months || [];
  if (!models.length) return '<div class="panel"><div class="empty">Plano Mês não disponível neste snapshot.</div></div>';
  const totals = months.map(month => models.reduce((sum, model) => sum + n(model.quantidades?.[month]), 0));
  const max = Math.max(...totals, 1);
  return `<div class="panel plan-month-panel"><div class="panel-header"><div><h3>Plano Mês · produção prevista</h3><span>Quantidade de veículos planeados por mês</span></div><span>Fonte: aba PLANO MES</span></div><div class="panel-body"><div class="plan-month-grid">${months.map((month, index) => `<div class="plan-month-card"><span>Mês ${esc(month)}</span><strong>${fmt(totals[index])}</strong><small>veículos</small><div class="bar-track"><div class="bar-fill" style="background:#1b9a82;width:${totals[index] / max * 100}%"></div></div></div>`).join('')}</div><div class="plan-month-table-wrap"><table class="data-table plan-month-table"><thead><tr><th>Modelo</th>${months.map(month => `<th>${esc(month)}</th>`).join('')}</tr></thead><tbody>${models.map(model => `<tr><td><strong>${esc(model.modelo)}</strong></td>${months.map(month => `<td>${fmt(model.quantidades?.[month])}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div></div>`;
}

function bindMaterialButtons() {
  document.querySelectorAll('.material-code').forEach(button => {
    button.onclick = () => openMaterialDetail(button.dataset.code);
  });
}

function markPurchaseButtonAdded(button) {
  if (!button) return;
  button.disabled = true;
  button.classList.add('added');
  button.textContent = '✓';
  button.title = 'Item já está no Processo de compra';
  button.setAttribute('aria-label', button.title);
}

function markPurchaseButtonsForItem(item, kind) {
  const key = purchaseKey(item, kind);
  document.querySelectorAll('.purchase-add-btn').forEach(button => {
    if (button.dataset.purchaseKey === key) markPurchaseButtonAdded(button);
  });
}

function bindPurchaseButtons() {
  document.querySelectorAll('.purchase-add-btn:not([disabled])').forEach(button => button.onclick = () => {
    const kind = button.dataset.purchaseKind || 'explosion';
    const item = kind === 'consumable'
      ? (CONSUMABLES.items || []).find(entry => String(entry.code) === String(button.dataset.purchaseCode))
      : itemByCode(button.dataset.purchaseCode);
    if (!item) return;
    // Não reconstruir a página: isso preserva filtros, pesquisa, rolagem e posição atual.
    const added = addToPurchaseProcess(item, kind, { refresh: false });
    if (added) markPurchaseButtonsForItem(item, kind);
  });
}

// Abre o detalhe completo do material selecionado pelo usuário.
function openMaterialDetail(code) {
  const item = itemByCode(code);
  if (!item) return;
  const demands = Object.entries(item.demands || {}).filter(([, value]) => n(value) > 0);
  const orders = orderEntries(item);
  const purchase = suggestedPurchase(item);
  const overlay = document.createElement('div');
  overlay.className = 'detail-overlay';
  overlay.innerHTML = `<section class="material-detail" role="dialog" aria-modal="true" aria-label="Detalhe do material">
    <div class="material-detail-header"><div><span class="eyebrow">Detalhe do material</span><h2>${esc(item.code)}</h2><p>${esc(item.description)}</p></div><button class="icon-btn" id="close-material-detail" aria-label="Fechar">×</button></div>
    <div class="detail-metrics"><div><span>Estoque atual</span><b>${fmt(item.stock)} ${esc(item.unit)}</b></div><div><span>Estoque máximo</span><b>${fmt(item.stockMax || 0)} ${esc(item.unit)}</b></div><div><span>Segurança</span><b>${fmt(item.safety)} ${esc(item.unit)}</b></div><div><span>Compra sugerida</span><b class="detail-danger">${fmt(purchase)} ${esc(item.unit)}</b></div><div><span>Analista</span><b>${esc(item.analyst || '—')}</b></div></div>
    <div class="detail-grid"><div class="detail-section"><h3>Consumo nos meses</h3>${demands.length ? `<div class="detail-list">${demands.map(([month, value]) => `<div><span>${esc(month.replace('DEM ', ''))}</span><b>${fmt(value)} ${esc(item.unit)}</b></div>`).join('')}</div>` : '<p class="empty">Sem consumo mensal registado.</p>'}</div><div class="detail-section"><h3>Pedidos futuros e em aberto</h3>${orders.length ? `<div class="detail-list">${orders.map(order => `<div class="${order.overdue ? 'detail-overdue' : ''}"><span>${esc(order.month.replace('PED ', ''))}${order.overdue ? ' · FOLLOW-UP' : ''}</span><b>${fmt(order.quantity)} ${esc(item.unit)}</b></div>`).join('')}</div>` : '<p class="empty">Sem pedidos em aberto.</p>'}</div></div>
    <div class="detail-footer"><span>${esc(item.family || '—')} · ${esc(item.obtentionType || '—')}</span><button class="secondary-btn" id="close-material-detail-bottom">Fechar detalhe</button></div>
  </section>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  $('#close-material-detail').onclick = close;
  $('#close-material-detail-bottom').onclick = close;
  overlay.onclick = event => { if (event.target === overlay) close(); };
}

function followUpRows(items) {
  return items.map(item => `<tr><td><button class="material-code" data-code="${esc(item.code)}">${esc(item.code)}</button><div class="desc">${esc(item.description)}</div></td><td>${esc(item.analyst || '—')}</td><td>${fmt(item.stock)} ${esc(item.unit)}</td><td>${fmt(item.stockMax || 0)} ${esc(item.unit)}</td><td>${item.overdueOrders.map(order => `<span class="overdue-tag">${esc(order.month.replace('PED ', ''))}: ${fmt(order.quantity)} ${esc(item.unit)}</span>`).join(' ')}</td><td><span class="status red">Follow-UP necessario</span></td></tr>`).join('');
}

// Renderiza a tela com pedidos de meses anteriores que precisam de acompanhamento.
function followUpView() {
  const items = followUpItems();
  const rows = followUpRows(items);
  return `${filterBar()}<div class="view-title"><div><h2>Pedidos atrasados para acompanhamento</h2><p>Pedidos abertos em meses anteriores ao mês atual. Confirme o status com o time de compras.</p></div><button class="secondary-btn" id="back-to-overview">← Voltar à visão geral</button></div><div class="summary-strip"><div class="summary-box"><b class="danger">${fmt(items.length)}</b><span>Itens para acompanhamento</span></div><div class="summary-box"><b>${esc(currentMonthDate().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }))}</b><span>Mês de referência</span></div></div><div class="panel"><div class="panel-header"><h3>Lista de pedidos atrasados</h3><span>${fmt(items.length)} itens</span></div><div class="panel-body"><div class="toolbar"><input class="input" id="follow-up-search" placeholder="Pesquisar código, descrição ou analista" /></div><div id="follow-up-table"><div class="table-wrap"><table class="data-table"><thead><tr><th>Material</th><th>Analista</th><th>Estoque</th><th>Estoque máximo</th><th>Pedido em atraso</th><th>Situação</th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="empty">Nenhum pedido de mês anterior encontrado.</td></tr>'}</tbody></table></div></div></div></div>`;
}

// Formata o valor máximo do eixo vertical sem sobrecarregar o gráfico.
function chartValue(value) {
  const amount = n(value);
  if (amount >= 1000000) return `R$ ${(amount / 1000000).toFixed(1).replace('.', ',')} mi`;
  if (amount >= 1000) return `R$ ${(amount / 1000).toFixed(0)} mil`;
  return money(amount);
}

// Cria o gráfico de linha com duas séries: valor em reais e quantidade de itens.
function stockHistoryChart() {
  const records = (STOCK_HISTORY.records || []).slice(-12);
  if (!records.length) return '<div class="empty">Ainda não existe histórico registado.</div>';

  const width = 900;
  const height = 320;
  const padding = { top: 30, right: 28, bottom: 58, left: 78 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const values = records.map(record => n(record.stockValue));
  const counts = records.map(record => n(record.itemCount));
  const maxValue = Math.max(...values, 1);
  const maxCount = Math.max(...counts, 1);
  const x = index => records.length === 1 ? padding.left + plotWidth / 2 : padding.left + (index / (records.length - 1)) * plotWidth;
  const yValue = value => padding.top + plotHeight - (value / maxValue) * plotHeight;
  const yCount = value => padding.top + plotHeight - (value / maxCount) * plotHeight;
  const valuePoints = values.map((value, index) => `${x(index).toFixed(1)},${yValue(value).toFixed(1)}`).join(' ');
  const countPoints = counts.map((value, index) => `${x(index).toFixed(1)},${yCount(value).toFixed(1)}`).join(' ');
  const grid = [0, 0.5, 1].map(step => {
    const y = padding.top + plotHeight - step * plotHeight;
    return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" class="history-grid-line" /><text x="${padding.left - 12}" y="${y + 4}" text-anchor="end" class="history-axis-label">${chartValue(maxValue * step)}</text><text x="${width - padding.right + 12}" y="${y + 4}" text-anchor="start" class="history-axis-label">${fmt(maxCount * step)} itens</text>`;
  }).join('');
  const labels = records.map((record, index) => `<text x="${x(index)}" y="${height - 22}" text-anchor="middle" class="history-axis-label">${esc(record.label || record.date)}</text>`).join('');
  const dots = records.map((record, index) => `<circle cx="${x(index)}" cy="${yValue(values[index])}" r="4" class="history-dot-value"><title>${esc(record.label || record.date)} · ${money(values[index])}</title></circle><circle cx="${x(index)}" cy="${yCount(counts[index])}" r="4" class="history-dot-count"><title>${esc(record.label || record.date)} · ${fmt(counts[index])} itens</title></circle>`).join('');
  const latest = records[records.length - 1];
  return `<div class="history-chart-wrap"><div class="history-summary"><div><span>Último valor registado</span><b>${money(latest.stockValue)}</b></div><div><span>Itens no último registo</span><b>${fmt(latest.itemCount)}</b></div><div><span>Registos disponíveis</span><b>${fmt(records.length)}</b></div></div><div class="history-legend"><span><i class="history-legend-value"></i> Valor do estoque</span><span><i class="history-legend-count"></i> Quantidade de itens</span></div><div class="history-chart-scroll"><svg class="history-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Evolução do valor do estoque e da quantidade de itens"><g>${grid}</g><polyline points="${valuePoints}" class="history-line history-line-value" /><polyline points="${countPoints}" class="history-line history-line-count" />${dots}${labels}</svg></div></div>`;
}

// Renderiza uma página separada para acompanhar a evolução histórica do estoque.
function stockHistoryView() {
  return `${filterBar()}<div class="view-title"><div><h2>Estamos trabalhando pra mostar a evolução do estoque, EM TESTE</h2><p></p></div><div class="date-pill">A partir de ${esc(STOCK_HISTORY.records?.[0]?.label || 'este mês')}</div></div><div class="panel"><div class="panel-header"><h3>Histórico do estoque</h3><span>Atualização mensal</span></div><div class="panel-body">${stockHistoryChart()}</div></div><div class="panel history-help-panel"><div class="panel-header"><h3></h3></div><div class="panel-body"><p></p><p class="history-note"></p></div></div>`;
}

function overview() {
  const base = scopedItems();
  const attention = base.filter(item => risk(item)[0] !== 'Regular').length;
  const regular = base.length - attention;
  const stockValue = base.reduce((sum, item) => sum + n(item.stockValue), 0);
  return `${filterBar()}<div class="hero executive-hero"><div><span class="eyebrow"></span><h2></h2><p></p></div><div class="date-pill">Base atualizada · ${esc(DATA.generatedAt || DATA.sourceFile)}</div></div>${metrics()}<div class="dashboard-grid">${riskChart()}${orderPanel()}</div>${planMonthPanel()}`;
}

function stockView() {
  return `${filterBar()}<div class="view-title"><h2> Estoque : obs: Ultima movimentação ainda falta alguns dados que nao consta no sistema ImaisERP.</h2><p></p></div><div class="panel"><div class="panel-body"><div class="toolbar"><input class="input" id="stock-search" placeholder="Pesquisar código ou descrição" /><select class="select" id="stock-risk"><option value="all">Todas as situações</option><option value="Crítico">Críticos</option><option value="Em atenção">Em atenção</option><option value="Regular">Regular</option></select></div><div id="stock-table">${table(scopedItems(), 250)}</div></div></div>`;
}

function demandTotals(month, base) {
  return base.reduce((sum, item) => sum + n(item.demands?.[month]), 0);
}

function demandPanel(base) {
  const months = DATA.demandMonths || [];
  const chosen = demandMonth === 'all' ? months : months.filter(month => month === demandMonth);
  const values = chosen.map(month => demandTotals(month, base));
  const max = Math.max(...values, 1);
  return `<div class="panel"><div class="panel-header"><h3>Demanda mensal da explosão</h3><span>Itens/unidades nas colunas DEM da Programacao</span></div><div class="panel-body">${chosen.map((month, index) => `<div class="chart-row"><span>${month.replace('DEM ', '')}</span><div class="bar-track"><div class="bar-fill" style="background:#18a999;width:${values[index] / max * 100}%"></div></div><b>${fmt(values[index])}</b></div>`).join('') || '<div class="empty">Não foram encontradas colunas DEM.</div>'}</div></div>`;
}

function excessMonthPairs() {
  const orderMonths = DATA?.months || [];
  const demandMonths = new Set(DATA?.demandMonths || []);
  return orderMonths.map(orderMonth => {
    const suffix = String(orderMonth).replace(/^PED\s*/, '');
    const demandMonth = `DEM ${suffix}`;
    return demandMonths.has(demandMonth) ? { orderMonth, demandMonth, label: suffix } : null;
  }).filter(Boolean);
}

function excessRows(rows) {
  return rows.map(row => `<tr class="excess-row"><td><button class="material-code excess-code" data-excess-code="${esc(row.code)}" data-excess-month="${esc(row.orderMonth)}">${esc(row.code)}</button><div class="desc">${esc(row.description)}</div></td><td>${fmt(row.stock)} ${esc(row.unit)}</td><td>${fmt(row.demand)} ${esc(row.unit)}</td><td>${fmt(row.order)} ${esc(row.unit)}</td><td class="danger-text">${fmt(row.excess)} ${esc(row.unit)}</td><td>${esc(row.label)}</td><td><span class="status red">Verificar</span></td></tr>`).join('');
}

function openExcessDetail(code, selectedMonth = '') {
  const item = itemByCode(code);
  if (!item) return;
  const rows = excessMonthPairs().map(pair => {
    const demand = n(item.demands?.[pair.demandMonth]);
    const order = n(item.orders?.[pair.orderMonth]);
    const excess = Math.max(0, order - demand);
    return `<div class="detail-list-row ${excess > 0 ? 'detail-overdue' : ''}"><span>${esc(pair.label)}${pair.orderMonth === selectedMonth ? ' · mês selecionado' : ''}</span><b>Demanda ${fmt(demand)} · Pedido ${fmt(order)}${excess > 0 ? ` · Excesso ${fmt(excess)}` : ''}</b></div>`;
  }).join('');
  const overlay = document.createElement('div');
  overlay.className = 'detail-overlay';
  overlay.innerHTML = `<section class="material-detail" role="dialog" aria-modal="true"><div class="material-detail-header"><div><span class="eyebrow">Pedidos em excesso</span><h2>${esc(item.code)}</h2><p>${esc(item.description)}</p></div><button class="icon-btn" id="close-excess-detail">×</button></div><div class="detail-metrics"><div><span>Estoque atual</span><b>${fmt(item.stock)} ${esc(item.unit)}</b></div><div><span>Estoque máximo</span><b>${fmt(item.stockMax || 0)} ${esc(item.unit)}</b></div><div><span>Analista</span><b>${esc(item.analyst || '—')}</b></div><div><span>Excessos mensais</span><b>${fmt(excessMonthPairs().filter(pair => n(item.orders?.[pair.orderMonth]) > n(item.demands?.[pair.demandMonth])).length)}</b></div></div><div class="detail-section"><h3>Demanda e pedidos por mês</h3><div class="detail-list">${rows || '<p class="empty">Sem dados mensais.</p>'}</div></div><div class="detail-footer"><span class="status red">Meses vermelhos exigem follow-up com Compras</span><button class="secondary-btn" id="close-excess-detail-bottom">Fechar</button></div></section>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  $('#close-excess-detail').onclick = close;
  $('#close-excess-detail-bottom').onclick = close;
  overlay.onclick = event => { if (event.target === overlay) close(); };
}

function excessView() {
  const pairs = excessMonthPairs().filter(pair => excessMonth === 'all' || pair.orderMonth === excessMonth);
  const rows = [];
  pairs.forEach(pair => scopedItems().forEach(item => {
    const demand = n(item.demands?.[pair.demandMonth]);
    const order = n(item.orders?.[pair.orderMonth]);
    if (order > demand && order > 0) rows.push({ ...item, orderMonth: pair.orderMonth, label: pair.label, demand, order, excess: order - demand });
  }));
  rows.sort((a, b) => b.excess - a.excess);
  return `${filterBar()}<div class="view-title"><div><h2>Pedidos em excesso</h2><p></p></div><div class="date-pill">Follow-up com Compras</div></div><div class="toolbar"><label class="filter-label">Mês:</label><select class="select" id="excess-month"><option value="all">Todos os meses</option>${excessMonthPairs().map(pair => `<option value="${esc(pair.orderMonth)}" ${excessMonth === pair.orderMonth ? 'selected' : ''}>${esc(pair.label)}</option>`).join('')} </select><input class="input" id="excess-search" placeholder="Pesquisar código ou descrição" /></div><div class="summary-strip"><div class="summary-box"><b class="danger">${fmt(rows.length)}</b><span>Excessos mensais</span></div><div class="summary-box"><b>${fmt(new Set(rows.map(row => row.code)).size)}</b><span>Materiais para verificar</span></div><div class="summary-box"><b>${fmt(rows.reduce((sum, row) => sum + row.excess, 0))}</b><span>Unidades em excesso</span></div></div><div class="panel"><div class="panel-header"><h3>Pedidos acima da demanda do mês</h3><span>Clique no código para abrir os próximos meses</span></div><div class="table-wrap"><table class="data-table excess-table"><thead><tr><th>Código / descrição</th><th>Estoque</th><th>Demanda</th><th>Pedido</th><th>Excesso</th><th>Mês</th><th>Follow-up</th></tr></thead><tbody id="excess-table-body">${excessRows(rows) || '<tr><td colspan="7" class="empty">Nenhum pedido acima da demanda mensal.</td></tr>'}</tbody></table></div></div>`;
}

function ordersView() {
  const base = scopedItems();
  const overdue = base.filter(item => risk(item)[0] !== 'Regular' && Object.values(item.orders || {}).every(value => n(value) === 0));
  const open = base.filter(item => Object.values(item.orders || {}).some(value => n(value) > 0));
  const chosen = demandMonth === 'all' ? (DATA.demandMonths?.[0] || '') : demandMonth;
  const monthItems = chosen ? base.map(item => ({ ...item, need: n(item.demands?.[chosen]), balance: n(item.stock) - n(item.demands?.[chosen]) })).filter(item => n(item.need) > 0).sort((a, b) => a.balance - b.balance) : [];
  return `${filterBar()}<div class="view-title"><h2></h2><p></p></div><div class="toolbar"><label class="filter-label">Mês da demanda:</label><select class="select" id="demand-month"><option value="all">Todos os meses</option>${(DATA.demandMonths || []).map(month => `<option value="${esc(month)}" ${demandMonth === month ? 'selected' : ''}>${esc(month.replace('DEM ', ''))}</option>`).join('')}</select><input class="input" id="orders-search" placeholder="Pesquisar código ou descrição" /><select class="select" id="orders-risk"><option value="all">Todas as situações</option><option value="Crítico">Críticos</option><option value="Em atenção">Em atenção</option><option value="Regular">Regular</option></select></div><div class="summary-strip"><div class="summary-box"><b>${fmt(DATA.openRequests)}</b><span>Solicitações em obtenção</span></div><div class="summary-box"><b>${fmt(open.length)}</b><span>Itens com pedido PED</span></div><div class="summary-box"><b class="danger">${fmt(overdue.length)}</b><span>Itens sem pedido</span></div></div><div class="dashboard-grid">${demandPanel(base)}${orderPanel()}</div><div class="panel"><div class="panel-header"><h3>${chosen ? `Necessidade para ${esc(chosen)}` : 'Selecione um mês'}</h3><span>Demanda × estoque</span></div><div id="orders-table">${chosen ? table(monthItems, 150, true) : '<div class="empty">Selecione um mês para mostrar os itens e o saldo projetado.</div>'}</div></div>`;
}

function modelsView() {
  return `${filterBar()}<div class="view-title"><h2>Estrutura de modelos</h2><p>Escolha um modelo para consultar os componentes da explosão.</p></div><div class="model-grid">${Object.entries(DATA.models).map(([name, items]) => `<div class="model-card" data-model="${esc(name)}"><b>${esc(name)}</b><span>Estrutura da explosão</span><strong>${fmt(items.length)} componentes →</strong></div>`).join('')}</div><div id="model-detail" class="panel" style="margin-top:20px;display:none"></div>`;
}

function simulation() {
  const names = Object.keys(DATA.models || {});
  const defaultStart = '2026-08-01';
  const defaultEnd = '2026-08-07';
  return `${filterBar()}<div class="view-title"><div><h2>Simulação semanal e mensal de necessidade</h2><p></p></div><div class="date-pill">Planejamento por janela</div></div><div class="weekly-simulator"><div class="panel form-panel weekly-sim-config"><h3>seleciona o intervalo de datas</h3><p>Informe o intervalo e a quantidade de carros de cada modelo. A data identifica a janela de planejamento e as quantidades definem a necessidade.</p><div class="date-range-grid"><div class="field"><label for="sim-week-start">Início da semana</label><input class="input" id="sim-week-start" type="date" value="${defaultStart}" /></div><div class="field"><label for="sim-week-end">Fim da semana</label><input class="input" id="sim-week-end" type="date" value="${defaultEnd}" /></div></div><div class="field"><label>Modelos e quantidades</label><div class="sim-model-list">${names.map(name => `<label class="sim-model-option"><input type="checkbox" data-sim-model="${esc(name)}" /><span>${esc(name)}</span><input class="input sim-model-cars" data-sim-cars="${esc(name)}" type="number" min="1" value="1" aria-label="Quantidade de carros para ${esc(name)}" /></label>`).join('')}</div></div><button class="primary-btn" id="run-simulation">Calcular semana</button></div><div id="sim-result" class="panel"><div class="empty">Selecione pelo menos um modelo para mostrar a necessidade consolidada.</div></div></div>`;
}

function weeklySimulationRows(rows) {
  return rows.map(row => `<tr><td><button class="material-code simulation-code" data-sim-code="${esc(row.code)}" title="Ver em quais modelos este código é utilizado">${esc(row.code)}</button><div class="desc" title="${esc(row.description)}">${esc(row.description)}</div></td><td>${fmt(row.need)} ${esc(row.unit || 'UN')}</td><td>${fmt(row.stock)} ${esc(row.unit || 'UN')}</td><td class="${row.balance < 0 ? 'danger-text' : ''}">${fmt(row.balance)} ${esc(row.unit || 'UN')}</td><td><span class="status ${row.simRisk === 'Crítico' ? 'red' : row.simRisk === 'Em atenção' ? 'amber' : 'green'}">${esc(row.simRisk)}</span></td><td>${row.models.map(model => `<span class="model-chip">${esc(model.name)} · ${fmt(model.need)}</span>`).join('')}</td></tr>`).join('');
}

function openSimulationCodeDetail(code, rows) {
  const row = rows.find(item => String(item.code) === String(code));
  if (!row) return;
  const overlay = document.createElement('div');
  overlay.className = 'detail-overlay';
  overlay.innerHTML = `<section class="material-detail" role="dialog" aria-modal="true" aria-label="Modelos que utilizam o código"><div class="material-detail-header"><div><span class="eyebrow">Detalhe da simulação semanal</span><h2>${esc(row.code)}</h2><p>${esc(row.description)}</p></div><button class="icon-btn" id="close-simulation-detail" aria-label="Fechar">×</button></div><div class="detail-metrics"><div><span>Necessidade consolidada</span><b>${fmt(row.need)} ${esc(row.unit || 'UN')}</b></div><div><span>Estoque atual</span><b>${fmt(row.stock)} ${esc(row.unit || 'UN')}</b></div><div><span>Saldo projetado</span><b>${fmt(row.balance)} ${esc(row.unit || 'UN')}</b></div><div><span>Modelos associados</span><b>${fmt(row.models.length)}</b></div></div><div class="detail-section"><h3>Utilização por modelo</h3><div class="detail-list">${row.models.map(model => `<div><span>${esc(model.name)}</span><b>${fmt(model.need)} ${esc(row.unit || 'UN')}</b></div>`).join('')}</div></div><div class="detail-footer"><span class="status ${row.simRisk === 'Crítico' ? 'red' : row.simRisk === 'Em atenção' ? 'amber' : 'green'}">${esc(row.simRisk)}</span><button class="secondary-btn" id="close-simulation-detail-bottom">Fechar detalhe</button></div></section>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  $('#close-simulation-detail').onclick = close;
  $('#close-simulation-detail-bottom').onclick = close;
  overlay.onclick = event => { if (event.target === overlay) close(); };
}

function runWeeklySimulation() {
  const start = $('#sim-week-start')?.value || '';
  const end = $('#sim-week-end')?.value || '';
  const selections = [...document.querySelectorAll('[data-sim-model]:checked')].map(input => ({ name: input.dataset.simModel, cars: Math.max(1, n($(`[data-sim-cars="${CSS.escape(input.dataset.simModel)}"]`)?.value)) }));
  const result = $('#sim-result');
  if (!start || !end || start > end) { result.innerHTML = '<div class="empty danger-text">Informe um intervalo de datas válido.</div>'; return; }
  if (!selections.length) { result.innerHTML = '<div class="empty danger-text">Selecione pelo menos um modelo.</div>'; return; }
  const byCode = new Map();
  selections.forEach(selection => (DATA.models[selection.name] || []).forEach(component => {
    const base = itemByCode(component.code) || { code: component.code, description: component.description, stock: 0, safety: 0, orders: {}, unit: 'UN', analyst: '', family: '', obtentionType: '' };
    if (!matchesGlobalFilters(base)) return;
    const need = n(component.quantity) * selection.cars;
    const current = byCode.get(String(component.code)) || { ...base, need: 0, models: [] };
    current.need += need;
    const modelRow = current.models.find(model => model.name === selection.name);
    if (modelRow) modelRow.need += need; else current.models.push({ name: selection.name, need });
    byCode.set(String(component.code), current);
  }));
  const rows = [...byCode.values()].map(item => ({ ...item, balance: n(item.stock) - item.need, simRisk: risk(item, item.need)[0] })).sort((a, b) => (a.simRisk === b.simRisk ? b.need - a.need : a.simRisk === 'Crítico' ? -1 : b.simRisk === 'Crítico' ? 1 : a.simRisk === 'Em atenção' ? -1 : 1));
  const counts = { Crítico: 0, 'Em atenção': 0, Regular: 0 };
  rows.forEach(item => counts[item.simRisk]++);
  const startLabel = new Date(`${start}T00:00:00`).toLocaleDateString('pt-BR');
  const endLabel = new Date(`${end}T00:00:00`).toLocaleDateString('pt-BR');
  result.innerHTML = `<div class="panel-header"><div><h3>Resultado · ${startLabel} a ${endLabel}</h3><span>${selections.map(selection => `${esc(selection.name)} · ${fmt(selection.cars)} carro${selection.cars === 1 ? '' : 's'}`).join(' · ')}</span></div><span>${fmt(rows.length)} códigos consolidados</span></div><div class="panel-body"><div class="summary-strip"><div class="summary-box"><b class="danger">${counts['Crítico']}</b><span>Críticos</span></div><div class="summary-box"><b style="color:#a36a08">${counts['Em atenção']}</b><span>Em atenção</span></div><div class="summary-box"><b style="color:#19784f">${counts.Regular}</b><span>Regulares</span></div><div class="summary-box"><b>${fmt(rows.reduce((sum, row) => sum + row.need, 0))}</b><span>Necessidade total</span></div></div><div class="table-wrap"><table class="data-table weekly-simulation-table"><thead><tr><th>Código / descrição</th><th>Necessidade</th><th>Estoque</th><th>Saldo</th><th>Risco</th><th>Modelos que utilizam</th></tr></thead><tbody>${weeklySimulationRows(rows) || '<tr><td colspan="6" class="empty">Não há componentes para os filtros selecionados.</td></tr>'}</tbody></table></div></div>`;
  document.querySelectorAll('.simulation-code').forEach(button => button.onclick = () => openSimulationCodeDetail(button.dataset.simCode, rows));
}


// Define a classe visual conforme a situação calculada nas colunas M e N.
function consumableStatus(item) {
  const maxText = String(item.maxStatus || '').toLowerCase();
  const stockText = String(item.stockStatus || '').toLowerCase();
  if (maxText.includes('acima') || maxText.includes('máximo') || maxText.includes('maximo')) return { label: 'Acima do máximo', color: 'red' };
  if (stockText.includes('comprar') || String(item.buyStatus || '').toLowerCase().includes('comprar')) return { label: 'Comprar', color: 'amber' };
  return { label: 'Não comprar', color: 'green' };
}

// Verifica se existe pedido de consumível em algum mês.
function consumableHasOrder(item) {
  return Object.values(item.orders || {}).some(value => n(value) > 0);
}

// Verifica se o consumível possui pedido aberto num mês anterior ao atual.
function consumableHasOverdueOrder(item) {
  return Object.entries(item.orders || {}).some(([month, value]) => n(value) > 0 && isPastOrderMonth(month));
}

// Abre uma janela com todos os dados do consumível selecionado.
function openConsumableDetail(code) {
  const item = (CONSUMABLES.items || []).find(entry => String(entry.code) === String(code));
  if (!item) return;
  const state = consumableStatus(item);
  const orders = Object.entries(item.orders || {}).filter(([, value]) => n(value) > 0);
  const overlay = document.createElement('div');
  overlay.className = 'detail-overlay';
  overlay.innerHTML = `<section class="material-detail" role="dialog" aria-modal="true" aria-label="Detalhe do consumível">
    <div class="material-detail-header"><div><span class="eyebrow">Detalhe do consumível</span><h2>${esc(item.code)}</h2><p>${esc(item.description)}</p></div><button class="icon-btn" id="close-consumable-detail" aria-label="Fechar">×</button></div>
    <div class="detail-metrics"><div><span>Estoque atual</span><b>${fmt(item.stock)}</b></div><div><span>Quantidade de compra</span><b>${fmt(item.purchaseQty)}</b></div><div><span>Estoque mínimo</span><b>${fmt(item.minStock)}</b></div><div><span>Estoque máximo</span><b>${fmt(item.maxStock)}</b></div></div>
    <div class="detail-grid"><div class="detail-section"><h3>Situação</h3><div class="detail-list"><div><span>Status do estoque</span><b>${esc(item.stockStatus || '—')}</b></div><div><span>Status do máximo</span><b>${esc(item.maxStatus || '—')}</b></div><div><span>Revisão</span><b>${esc(item.reviewStatus || '—')}</b></div></div></div><div class="detail-section"><h3>Pedidos e acompanhamento</h3>${orders.length ? `<div class="detail-list">${orders.map(([month, value]) => `<div class="${isPastOrderMonth(month) ? 'detail-overdue' : ''}"><span>${esc(month)}${isPastOrderMonth(month) ? ' · ACOMPANHAMENTO' : ''}</span><b>${fmt(value)}</b></div>`).join('')}</div>` : '<p class="empty">Sem pedidos em aberto.</p>'}</div></div>
    <div class="detail-footer"><span class="status ${state.color}">${state.label}</span><button class="secondary-btn" id="close-consumable-detail-bottom">Fechar detalhe</button></div>
  </section>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  $('#close-consumable-detail').onclick = close;
  $('#close-consumable-detail-bottom').onclick = close;
  overlay.onclick = event => { if (event.target === overlay) close(); };
}

function consumableRows(items) {
  return items.map(item => {
    const state = consumableStatus(item);
    const hasOrder = consumableHasOrder(item);
    const overdue = consumableHasOverdueOrder(item);
          return `<tr><td><button class="material-code consumable-code" data-code="${esc(item.code)}" title="Abrir detalhe do consumível">${esc(item.code)}</button><div class="desc" title="${esc(item.description)}">${esc(item.description)}</div></td><td>${fmt(item.stock)}</td><td>${fmt(item.purchaseQty)}</td><td>${fmt(item.minStock)}</td><td>${fmt(item.maxStock)}</td><td>${esc(item.stockStatus || '—')}</td><td>${esc(item.maxStatus || '—')}</td><td>${hasOrder ? 'Sim' : 'Não'}</td><td>${overdue ? '<span class="status red">Follow-up</span>' : '<span class="status green">Sem atraso</span>'}</td><td><span class="status ${state.color}">${state.label}</span></td><td>${purchaseAction(item, 'consumable')}</td></tr>`;

  }).join('');
}

// Os consumíveis não têm campos de analista, família ou obtenção na planilha enviada.
// Por isso, os filtros globais ficam disponíveis, mas não ocultam itens sem esses campos.
function consumablesFilteredItems() {
  const items = CONSUMABLES.items || [];
  const hasClassification = items.some(item => item.analyst || item.family || item.obtentionType);
  return hasClassification ? items.filter(matchesGlobalFilters) : items;
}

function consumablesView() {
  const items = consumablesFilteredItems();
  return `${filterBar()}<div class="view-title"><div><h2></h2><p></p></div><div class="date-pill">Base: ${esc(CONSUMABLES.sourceFile || 'consumiveis')}</div></div><div class="summary-strip"><div class="summary-box"><b>${fmt(items.length)}</b><span>Consumíveis cadastrados</span></div><div class="summary-box"><b class="danger">${fmt(items.filter(item => consumableStatus(item).label === 'Comprar').length)}</b><span>Itens para comprar</span></div><div class="summary-box"><b>${fmt(items.filter(consumableHasOverdueOrder).length)}</b><span>Itens que precisa de follow-up</span></div></div><div class="panel"><div class="panel-body"><div class="toolbar"><input class="input" id="consumables-search" placeholder="Pesquisar código ou descrição" /><select class="select" id="consumables-stock-status"><option value="all">Status do estoque: todos</option><option value="OK">OK</option><option value="Comprar">Comprar</option></select><select class="select" id="consumables-max-status"><option value="all">Status do máximo: todos</option><option value="ok">Dentro do máximo</option><option value="above">Acima do máximo</option></select><select class="select" id="consumables-followup"><option value="all">Pedidos: todos (${fmt(items.length)})</option><option value="order">Com pedido (${fmt(items.filter(consumableHasOrder).length)})</option><option value="overdue">Com atraso / follow-up (${fmt(items.filter(consumableHasOverdueOrder).length)})</option><option value="none">Sem pedido (${fmt(items.filter(item => !consumableHasOrder(item)).length)})</option></select></div><div class="table-wrap"><table class="data-table consumables-table"><thead><tr><th>Código / descrição</th><th>Estoque</th><th>Qtd. compra</th><th>Mínimo</th><th>Máximo</th><th>Status</th><th>Status Estoque</th><th>Tem SC ?</th><th>Follow-up</th><th>Decisão</th><th>Processo de compra</th></tr></thead><tbody id="consumables-table-body">${consumableRows(items)}</tbody></table></div></div></div>`;
}

// Mostra os itens escolhidos e permite exportar o conjunto para Excel.
function renderPurchaseProcessPage() {
  const rows = PURCHASE_PROCESS.map(entry => `<tr><td>${esc(entry.code)}</td><td><div class="desc" title="${esc(entry.description)}">${esc(entry.description)}</div></td><td>${fmt(entry.quantity)}</td><td>${esc(entry.source)}</td><td><button class="remove-purchase-btn" data-purchase-remove="${esc(entry.key)}" title="Remover do Processo de compra">Remover</button></td></tr>`).join('');
  return `<div class="view-title"><div><h2></h2><p></p></div><div class="toolbar purchase-actions"><button class="primary-btn" id="export-purchase-process" ${PURCHASE_PROCESS.length ? '' : 'disabled'}>Exportar para Excel</button><button class="secondary-btn" id="clear-purchase-process" ${PURCHASE_PROCESS.length ? '' : 'disabled'}>Limpar lista</button></div></div><div class="summary-strip"><div class="summary-box"><b>${fmt(PURCHASE_PROCESS.length)}</b><span>Itens selecionados</span></div><div class="summary-box"><b>${fmt(PURCHASE_PROCESS.reduce((sum, entry) => sum + n(entry.quantity), 0))}</b><span>Quantidade total de compra</span></div><div class="summary-box"><b>${fmt(PURCHASE_PROCESS.filter(entry => entry.source === 'Consumível').length)}</b><span>Consumíveis selecionados</span></div></div><div class="panel"><div class="panel-header"><h3>Lista para exportação</h3><span>Dados incluídos: código, descrição e quantidade</span></div><div class="table-wrap"><table class="data-table purchase-process-table"><thead><tr><th>Código</th><th>Descrição</th><th>Quantidade de compra</th><th>Origem</th><th>Ação</th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="empty">Nenhum item foi adicionado. Use o sinal + nas tabelas.</td></tr>'}</tbody></table></div></div>`;
}

function productionAlertStatusClass(status) {
  if (status === 'Resolvido') return 'green';
  if (status === 'Em análise') return 'amber';
  if (status === 'Cancelado') return 'gray';
  return 'red';
}

function productionAlertDate(value) {
  return value ? new Date(value).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '—';
}

function productionAlertRows(items) {
  return items.map(alert => `<tr><td><span class="status ${productionAlertStatusClass(alert.status)}">${esc(alert.status)}</span></td><td><b class="alert-title">ALERTA DA PRODUÇÃO</b><div class="desc">${esc(alert.message)}</div></td><td>${esc(alert.leader || '—')}</td><td>${esc(alert.line || '—')}</td><td><button class="material-code production-alert-code" data-alert-id="${esc(alert.id)}">${esc(alert.code || '—')}</button><div class="desc" title="${esc(alert.description)}">${esc(alert.description || 'Descrição não informada')}</div></td><td>${fmt(alert.stock)} ${esc(alert.unit || 'UN')}</td><td>${fmt(alert.orders)} ${esc(alert.unit || 'UN')}</td><td class="danger-text">${fmt(alert.suggestedPurchase)} ${esc(alert.unit || 'UN')}</td><td>${esc(alert.analyst || '—')}</td><td><button class="secondary-btn alert-detail-btn" data-alert-id="${esc(alert.id)}">Ver material</button><button class="primary-btn alert-status-btn" data-alert-id="${esc(alert.id)}">${alert.status === 'Novo' ? 'Iniciar análise' : alert.status === 'Em análise' ? 'Marcar resolvido' : 'Atualizar estado'}</button></td></tr>`).join('');
}

function productionAlertsView() {
  const query = String(window.productionAlertQuery || '').toLowerCase();
  const selectedStatus = window.productionAlertStatus || 'all';
  const selectedLeader = window.productionAlertLeader || 'all';
  const selectedLine = window.productionAlertLine || 'all';
  const all = PRODUCTION_ALERTS;
  const items = all.filter(alert => {
    const text = `${alert.code} ${alert.description} ${alert.message} ${alert.leader}`.toLowerCase();
    return (!query || text.includes(query)) && (selectedStatus === 'all' || alert.status === selectedStatus) && (selectedLeader === 'all' || alert.leader === selectedLeader) && (selectedLine === 'all' || alert.line === selectedLine);
  });
  const leaders = [...new Set(all.map(alert => alert.leader).filter(Boolean))];
  const lines = [...new Set(all.map(alert => alert.line).filter(Boolean))];
  const open = all.filter(alert => !['Resolvido', 'Cancelado'].includes(alert.status));
  const critical = all.filter(alert => n(alert.suggestedPurchase) > 0 && !['Resolvido', 'Cancelado'].includes(alert.status));
  const resolvedToday = all.filter(alert => alert.status === 'Resolvido' && new Date(alert.updatedAt || alert.createdAt).toDateString() === new Date().toDateString());
  return `<div class="view-title production-alert-heading"><div><h2>Alertas da produção</h2><p>Avisos enviados pelos líderes da produção.</p></div><button class="primary-btn" id="new-production-alert">＋ Enviar aviso</button></div><div class="summary-strip alert-metrics"><div class="summary-box"><b>${fmt(open.filter(alert => alert.status === 'Novo').length)}</b><span>Novos</span></div><div class="summary-box"><b>${fmt(open.filter(alert => alert.status === 'Em análise').length)}</b><span>Em análise</span></div><div class="summary-box"><b class="danger">${fmt(critical.length)}</b><span>Críticos</span></div><div class="summary-box"><b class="success">${fmt(resolvedToday.length)}</b><span>Resolvidos hoje</span></div></div><div class="panel alert-filter-panel"><div class="toolbar"><select class="select" id="production-alert-leader"><option value="all">Todos os líderes</option>${leaders.map(value => `<option value="${esc(value)}" ${selectedLeader === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select><select class="select" id="production-alert-line"><option value="all">Todas as linhas</option>${lines.map(value => `<option value="${esc(value)}" ${selectedLine === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select><select class="select" id="production-alert-status"><option value="all">Todos os estados</option>${['Novo', 'Em análise', 'Resolvido', 'Cancelado'].map(value => `<option value="${value}" ${selectedStatus === value ? 'selected' : ''}>${value}</option>`).join('')}</select><input class="input" id="production-alert-search" value="${esc(window.productionAlertQuery || '')}" placeholder="Pesquisar código, descrição ou mensagem" /><button class="secondary-btn" id="clear-production-alert-filters">Limpar filtros</button></div></div><div class="panel"><div class="table-wrap production-alert-table-wrap"><table class="data-table production-alert-table"><thead><tr><th>Estado</th><th>Alerta</th><th>Líder</th><th>Linha</th><th>Código / descrição</th><th>Estoque</th><th>Pedidos em aberto</th><th>Compra sugerida</th><th>Analista</th><th>Ações</th></tr></thead><tbody>${productionAlertRows(items) || '<tr><td colspan="10" class="empty">Nenhum alerta encontrado.</td></tr>'}</tbody></table></div><div class="table-footer">Mostrando ${items.length} de ${all.length} alerta(s).</div></div>`;
}

function openProductionAlertForm() {
  const overlay = document.createElement('div');
  overlay.className = 'detail-overlay';
  const options = (DATA?.items || []).slice(0, 500).map(item => `<option value="${esc(item.code)}">${esc(item.description || '')}</option>`).join('');
  overlay.innerHTML = `<section class="material-detail production-alert-form-modal" role="dialog" aria-modal="true" aria-label="Enviar aviso da produção"><div class="material-detail-header"><div><span class="eyebrow">Aviso da produção</span><h2>Informar falta de material</h2><p>O aviso ficará visível para a equipa de estoque e compras.</p></div><button class="icon-btn" id="close-production-alert-form" aria-label="Fechar">×</button></div><form id="production-alert-form" class="alert-form"><div class="form-grid"><div class="field"><label for="production-alert-leader-input">Nome do líder</label><input class="input" id="production-alert-leader-input" required value="${esc(currentUser?.name || '')}" placeholder="Ex.: Elvis" /></div><div class="field"><label for="production-alert-line-input">Linha ou setor</label><input class="input" id="production-alert-line-input" required placeholder="Ex.: Linha 2" /></div></div><div class="field"><label for="production-alert-code-input">Código ou descrição do material</label><input class="input" id="production-alert-code-input" list="production-alert-items" required placeholder="Digite o código ou a descrição" /><datalist id="production-alert-items">${options}</datalist><small>Se o item existir na explosão, os dados serão preenchidos automaticamente.</small></div><div class="field"><label for="production-alert-message-input">O que aconteceu?</label><textarea class="input" id="production-alert-message-input" required rows="4" placeholder="Ex.: Item acabou na linha e a produção está parada."></textarea></div><div id="production-alert-form-error" class="form-error" role="alert"></div><div class="detail-footer"><span class="muted">Os dados do estoque são apenas informativos.</span><button class="secondary-btn" type="button" id="cancel-production-alert-form">Cancelar</button><button class="primary-btn" type="submit">Enviar aviso</button></div></form></section>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  $('#close-production-alert-form').onclick = close;
  $('#cancel-production-alert-form').onclick = close;
  overlay.onclick = event => { if (event.target === overlay) close(); };
  $('#production-alert-form').onsubmit = event => {
    event.preventDefault();
    const form = { leader: $('#production-alert-leader-input').value, line: $('#production-alert-line-input').value, code: $('#production-alert-code-input').value, message: $('#production-alert-message-input').value };
    if (!form.leader.trim() || !form.line.trim() || !form.code.trim() || !form.message.trim()) { $('#production-alert-form-error').textContent = 'Preencha todos os campos antes de enviar.'; return; }
    createProductionAlert(form);
    close();
    render();
    alert('Aviso enviado com sucesso. A equipa já pode consultá-lo na central.');
  };
}

function openProductionAlertDetail(id) {
  const alertData = PRODUCTION_ALERTS.find(alert => alert.id === id);
  if (!alertData) return;
  const overlay = document.createElement('div');
  overlay.className = 'detail-overlay';
  const history = (alertData.history || []).map(entry => `<div class="detail-list-row"><span>${esc(entry.status)} · ${productionAlertDate(entry.at)}</span><b>${esc(entry.by || '—')}</b></div>`).join('');
  overlay.innerHTML = `<section class="material-detail production-alert-detail" role="dialog" aria-modal="true" aria-label="Detalhe do alerta"><div class="material-detail-header"><div><span class="eyebrow">Detalhe do material</span><h2>${esc(alertData.code || 'Código não informado')}</h2><p>${esc(alertData.description || 'Descrição não informada')}</p></div><button class="icon-btn" id="close-production-alert-detail" aria-label="Fechar">×</button></div><div class="detail-metrics"><div><span>Estoque atual</span><b>${fmt(alertData.stock)} ${esc(alertData.unit || 'UN')}</b></div><div><span>Segurança</span><b>${fmt(alertData.safety)} ${esc(alertData.unit || 'UN')}</b></div><div><span>Compra sugerida</span><b class="danger-text">${fmt(alertData.suggestedPurchase)} ${esc(alertData.unit || 'UN')}</b></div><div><span>Analista</span><b>${esc(alertData.analyst || '—')}</b></div></div><div class="detail-grid"><div class="detail-section"><h3>Informação do aviso</h3><div class="detail-list"><div class="detail-list-row"><span>Líder</span><b>${esc(alertData.leader || '—')}</b></div><div class="detail-list-row"><span>Linha</span><b>${esc(alertData.line || '—')}</b></div><div class="detail-list-row"><span>Mensagem</span><b>${esc(alertData.message || '—')}</b></div><div class="detail-list-row"><span>Enviado em</span><b>${productionAlertDate(alertData.createdAt)}</b></div></div></div><div class="detail-section"><h3>Cálculo e pedidos</h3><div class="detail-list"><div class="detail-list-row"><span>Demanda considerada</span><b>${fmt(alertData.demand)} ${esc(alertData.unit || 'UN')}</b></div><div class="detail-list-row"><span>Pedidos em aberto</span><b>${fmt(alertData.orders)} ${esc(alertData.unit || 'UN')}</b></div><div class="detail-list-row"><span>Família / obtenção</span><b>${esc(alertData.family)} · ${esc(alertData.obtentionType)}</b></div><div class="detail-list-row"><span>Regra</span><b>demanda + segurança − estoque − pedidos</b></div></div></div></div><div class="detail-section"><h3>Histórico de estados</h3>${history || '<p class="empty">Ainda não existe histórico.</p>'}</div><div class="detail-footer"><span class="status ${productionAlertStatusClass(alertData.status)}">${esc(alertData.status)}</span><button class="secondary-btn" id="close-production-alert-detail-bottom">Fechar detalhe</button></div></section>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  $('#close-production-alert-detail').onclick = close;
  $('#close-production-alert-detail-bottom').onclick = close;
  overlay.onclick = event => { if (event.target === overlay) close(); };
}

// Reconstrói o conteúdo da tela sempre que uma área ou filtro muda.
function render() {
  if (!DATA) return;
  const titles = { overview: 'Visão geral', stock: 'Estoque', orders: 'Pedidos e demanda', models: 'Modelos', simulation: 'Simulação', followup: 'Acompanhamento', history: 'Evolução do estoque', consumables: 'Consumíveis', purchaseProcess: 'Processo de compra', excess: 'Pedidos em excesso', productionAlerts: 'Aviso da produção' };
  $('#page-title').textContent = titles[view];
  const pages = { overview, stock: stockView, orders: ordersView, models: modelsView, simulation, followup: followUpView, history: stockHistoryView, consumables: consumablesView, purchaseProcess: renderPurchaseProcessPage, excess: excessView, productionAlerts: productionAlertsView };
  const renderPage = pages[view];
  if (typeof renderPage !== 'function') {
    $('#app').innerHTML = '<div class="panel empty">A vista selecionada não foi encontrada. Volte à Visão geral e tente novamente.</div>';
    return;
  }
  $('#app').innerHTML = view === 'followup' ? followUpView() : (view === 'history' ? stockHistoryView() : renderPage());
  bindView();
}

// Liga os eventos dos campos, botões, tabelas e filtros recém-renderizados.
function bindView() {
  const globalFilters = [
    ['#analyst-filter', value => { analyst = value; }],
    ['#family-filter', value => { family = value; }],
    ['#obtention-filter', value => { obtentionType = value; }],
  ];
  globalFilters.forEach(([selector, update]) => {
    const element = $(selector);
    if (element) element.onchange = () => { update(element.value); render(); };
  });

  bindMaterialButtons();
  bindPurchaseButtons();
  bindProgressiveTables();
  document.querySelectorAll('[data-go-view]').forEach(button => button.onclick = () => {
    view = button.dataset.goView;
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === view));
    render();
  });
  document.querySelectorAll('.consumable-code').forEach(button => button.onclick = () => openConsumableDetail(button.dataset.code));

  document.querySelectorAll('[data-purchase-remove]').forEach(button => button.onclick = () => removeFromPurchaseProcess(button.dataset.purchaseRemove));
  const exportButton = $('#export-purchase-process');
  if (exportButton) exportButton.onclick = exportPurchaseProcess;
  const clearButton = $('#clear-purchase-process');
  if (clearButton) clearButton.onclick = () => { PURCHASE_PROCESS = []; savePurchaseProcess(); render(); };

  const followUpMetric = $('#follow-up-metric');
  if (followUpMetric) followUpMetric.onclick = () => { view = 'followup'; render(); };

  if (view === 'followup') {
    $('#back-to-overview').onclick = () => { view = 'overview'; render(); };
    $('#follow-up-search').oninput = () => {
      const query = ($('#follow-up-search').value || '').toLowerCase();
      const items = followUpItems().filter(item => `${item.code} ${item.description} ${item.analyst || ''}`.toLowerCase().includes(query));
      const target = $('#follow-up-table tbody');
      if (target) target.innerHTML = followUpRows(items) || '<tr><td colspan="5" class="empty">Nenhum item encontrado.</td></tr>';
      bindMaterialButtons();
    };
  }

  const demandSelector = $('#demand-month');
  if (demandSelector) demandSelector.onchange = () => { demandMonth = demandSelector.value; render(); };

  if (view === 'excess') {
    const monthSelector = $('#excess-month');
    if (monthSelector) monthSelector.onchange = () => { excessMonth = monthSelector.value; render(); };
    const search = $('#excess-search');
    if (search) search.oninput = () => {
      const query = search.value.toLowerCase();
      document.querySelectorAll('#excess-table-body .excess-row').forEach(row => { row.hidden = !row.textContent.toLowerCase().includes(query); });
    };
    document.querySelectorAll('.excess-code').forEach(button => button.onclick = () => openExcessDetail(button.dataset.excessCode, button.dataset.excessMonth));
  }

  if (view === 'consumables') {
    const filter = () => {
      const query = ($('#consumables-search').value || '').toLowerCase();
      const stockFilter = $('#consumables-stock-status').value;
      const maxFilter = $('#consumables-max-status').value;
      const followupFilter = $('#consumables-followup').value;
      const items = consumablesFilteredItems().filter(item => {
        const text = `${item.code} ${item.description}`.toLowerCase();
        const state = consumableStatus(item);
        const stockOk = stockFilter === 'all' || String(item.stockStatus || '').toLowerCase() === stockFilter.toLowerCase();
        const maxText = String(item.maxStatus || '').toLowerCase();
        const maxOk = maxFilter === 'all' || (maxFilter === 'above' ? maxText.includes('acima') || maxText.includes('maximo') || maxText.includes('máximo') : !(maxText.includes('acima') || maxText.includes('maximo') || maxText.includes('máximo')));
        const hasOrder = consumableHasOrder(item);
        const overdue = consumableHasOverdueOrder(item);
        const followOk = followupFilter === 'all' || (followupFilter === 'order' && hasOrder) || (followupFilter === 'overdue' && overdue) || (followupFilter === 'none' && !hasOrder);
        return text.includes(query) && stockOk && maxOk && followOk;
      });
      $('#consumables-table-body').innerHTML = consumableRows(items) || '<tr><td colspan="11" class="empty">Nenhum consumível encontrado.</td></tr>';
      document.querySelectorAll('.consumable-code').forEach(button => button.onclick = () => openConsumableDetail(button.dataset.code));
      bindPurchaseButtons();
    };
    $('#consumables-search').oninput = filter;
    $('#consumables-stock-status').onchange = filter;
    $('#consumables-max-status').onchange = filter;
    $('#consumables-followup').onchange = filter;
  }

  if (view === 'stock') {
    const filter = () => {
      const query = ($('#stock-search').value || '').toLowerCase();
      const selectedRisk = $('#stock-risk').value;
      const items = scopedItems().filter(item => (!query || `${item.code} ${item.description}`.toLowerCase().includes(query)) && (selectedRisk === 'all' || risk(item)[0] === selectedRisk));
      $('#stock-table').innerHTML = table(items, 250);
      bindMaterialButtons();
      bindPurchaseButtons();
    };
    $('#stock-search').oninput = filter;
    $('#stock-risk').onchange = filter;
  }

  if (view === 'orders') {
    const monthSelect = $('#demand-month');
    if (monthSelect) monthSelect.onchange = () => { demandMonth = monthSelect.value; render(); };
    const filterOrders = () => {
      const query = ($('#orders-search').value || '').toLowerCase();
      const selectedRisk = $('#orders-risk').value;
      const chosen = demandMonth === 'all' ? (DATA.demandMonths?.[0] || '') : demandMonth;
      const items = chosen ? scopedItems().map(item => ({ ...item, need: n(item.demands?.[chosen]), balance: n(item.stock) - n(item.demands?.[chosen]) })).filter(item => n(item.need) > 0).filter(item => (!query || `${item.code} ${item.description}`.toLowerCase().includes(query)) && (selectedRisk === 'all' || risk(item, item.need)[0] === selectedRisk)).sort((a, b) => a.balance - b.balance) : [];
      if ($('#orders-table')) {
        $('#orders-table').innerHTML = chosen ? table(items, 150, true) : '<div class="empty">Selecione um mês para mostrar os itens e o saldo projetado.</div>';
        bindMaterialButtons();
        bindPurchaseButtons();
      }
    };
    $('#orders-search').oninput = filterOrders;
    $('#orders-risk').onchange = filterOrders;
  }

  if (view === 'models') {
    document.querySelectorAll('.model-card').forEach(card => card.onclick = () => {
      const name = card.dataset.model;
      const box = $('#model-detail');
      const list = DATA.models[name] || [];
      const modelItems = list.map(component => ({ ...(itemByCode(component.code) || { code: component.code, description: component.description, stock: 0, safety: 0, analyst: '', family: '', obtentionType: '', orders: {}, unit: 'UN' }), requirement: component.quantity })).filter(matchesGlobalFilters);
      box.style.display = 'block';
      box.innerHTML = `<div class="panel-header"><h3>${esc(name)}</h3><span>${list.length} componentes</span></div><div class="toolbar"><select class="select" id="model-risk"><option value="all">Todas as situações</option><option value="Crítico">Críticos</option><option value="Em atenção">Em atenção</option><option value="Regular">Regular</option></select></div><div id="model-table">${table(modelItems, 100)}</div>`;
      $('#model-risk').onchange = () => { const selectedRisk = $('#model-risk').value; $('#model-table').innerHTML = table(selectedRisk === 'all' ? modelItems : modelItems.filter(item => risk(item)[0] === selectedRisk), 100); bindMaterialButtons(); };
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (view === 'purchaseProcess') {
    document.querySelectorAll('[data-purchase-remove]').forEach(button => button.onclick = () => removeFromPurchaseProcess(button.dataset.purchaseRemove));
  }

  if (view === 'productionAlerts') {
    const search = $('#production-alert-search');
    const leaderFilter = $('#production-alert-leader');
    const lineFilter = $('#production-alert-line');
    const statusFilter = $('#production-alert-status');
    const rerenderAlerts = () => {
      window.productionAlertQuery = search?.value || '';
      window.productionAlertLeader = leaderFilter?.value || 'all';
      window.productionAlertLine = lineFilter?.value || 'all';
      window.productionAlertStatus = statusFilter?.value || 'all';
      render();
    };
    if (search) search.oninput = rerenderAlerts;
    if (leaderFilter) leaderFilter.onchange = rerenderAlerts;
    if (lineFilter) lineFilter.onchange = rerenderAlerts;
    if (statusFilter) statusFilter.onchange = rerenderAlerts;
    const clearFilters = $('#clear-production-alert-filters');
    if (clearFilters) clearFilters.onclick = () => { window.productionAlertQuery = ''; window.productionAlertLeader = 'all'; window.productionAlertLine = 'all'; window.productionAlertStatus = 'all'; render(); };
    const newAlert = $('#new-production-alert');
    if (newAlert) newAlert.onclick = openProductionAlertForm;
    document.querySelectorAll('.production-alert-code, .alert-detail-btn').forEach(button => button.onclick = () => openProductionAlertDetail(button.dataset.alertId));
    document.querySelectorAll('.alert-status-btn').forEach(button => button.onclick = () => {
      const alertData = PRODUCTION_ALERTS.find(item => item.id === button.dataset.alertId);
      if (!alertData) return;
      const nextStatus = alertData.status === 'Novo' ? 'Em análise' : alertData.status === 'Em análise' ? 'Resolvido' : 'Em análise';
      updateProductionAlertStatus(alertData.id, nextStatus);
      render();
    });
  }

  if (view === 'simulation') {
    $('#run-simulation').onclick = runWeeklySimulation;
  }
}

// Oculta o login e mostra o dashboard depois que o usuário é validado.
function setAuthenticatedView(user) {
  currentUser = user;
  // O login identifica a pessoa, mas não limita a consulta à carteira dela.
  analyst = 'all';
  $('#login-screen').hidden = true;
  $('#dashboard-shell').hidden = false;
  $('#current-user-label').textContent = `Acesso: ${user.name}`;
  sessionStorage.setItem(AUTH_STORAGE_KEY, user.username);
}

function showLogin(message = '') {
  currentUser = null;
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  $('#dashboard-shell').hidden = true;
  $('#login-screen').hidden = false;
  $('#login-error').textContent = message;
  $('#login-password').value = '';
  $('#login-username').focus();
}

function findLoginUser(username, password) {
  return LOGIN_USERS.find(user => user.username.toLowerCase() === username.trim().toLowerCase() && user.password === password);
}

// Recupera a sessão do navegador e configura o envio do formulário de login.
function startAuthentication() {
  const loginForm = $('#login-form');
  const savedUsername = sessionStorage.getItem(AUTH_STORAGE_KEY);
  const savedUser = LOGIN_USERS.find(user => user.username === savedUsername);

  if (savedUser) {
    setAuthenticatedView(savedUser);
    load();
  } else {
    showLogin();
  }

  loginForm.onsubmit = event => {
    event.preventDefault();
    const username = $('#login-username').value;
    const password = $('#login-password').value;
    const user = findLoginUser(username, password);

    if (!user) {
      $('#login-error').textContent = 'Utilizador ou senha inválidos.';
      $('#login-password').select();
      return;
    }

    $('#login-error').textContent = '';
     alert(`Bem-vindo, ${user.name}! O painel será carregado agora, peço que se atentem alguns dados carregados, faze de teste pode ter alguns erros, por isso estamos fazendo dupla checagem, e trabalhando pra que todos os dados estejam 100% corretos. Epuipe de desenvolvimento PCP`);
    setAuthenticatedView(user);
    load();
  };
}

// Lê o JSON local e inicia a primeira renderização do dashboard.
async function load() {
  try {
    const [dataResponse, historyResponse, consumablesResponse, planoResponse] = await Promise.all([
      fetch('data/explosao.json'),
      fetch('data/historico-estoque.json'),
      fetch('data/consumiveis.json'),
      fetch('data/plano-mes.json')
    ]);
    DATA = await dataResponse.json();
    STOCK_HISTORY = historyResponse.ok ? await historyResponse.json() : { records: [] };
    CONSUMABLES = consumablesResponse.ok ? await consumablesResponse.json() : { items: [], months: [] };
    DATA.planMonth = planoResponse.ok ? await planoResponse.json() : { models: [], months: [] };
    $('#source-file').textContent = DATA.sourceFile;
    $('#updated-at').textContent = `Base carregada · ${DATA.generatedAt}`;
    render();
  } catch (error) {
    $('#app').innerHTML = '<div class="panel empty">Não foi possível carregar data/explosao.json. Abra a pasta com um servidor local, como a extensão Live Server do VS Code.</div>';
  }
}

document.querySelectorAll('.nav-item').forEach(button => button.onclick = () => {
  view = button.dataset.view;
  document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item === button));
  render();
  if (innerWidth < 900) $('#sidebar').classList.remove('open');
});

$('#mobile-menu').onclick = () => $('#sidebar').classList.toggle('open');
$('#refresh-data').onclick = load;
$('#logout-button').onclick = () => showLogin('Sessão terminada.');
loadPurchaseProcess();
void loadProductionAlerts();
if (alertsSyncTimer) clearInterval(alertsSyncTimer);
alertsSyncTimer = setInterval(() => { if (document.visibilityState !== 'hidden') void syncProductionAlerts(); }, 20000);
startAuthentication();
