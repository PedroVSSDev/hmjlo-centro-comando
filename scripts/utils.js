// ============================================================
//  UTILITÁRIOS — Centro de Comando HMJLO
//  Arquivo: scripts/utils.js
//  Contém: Toast, Modal, Dark Mode, Sort, Paginação, Export, Filtro de Data
// ============================================================

// ==========================================
// TOAST / NOTIFICAÇÃO
// ==========================================
function showToast(msg, tipo = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const cores = {
    success: 'bg-green-600',
    error:   'bg-red-600',
    info:    'bg-blue-600',
    warn:    'bg-orange-500'
  };
  const icones = { success: 'check-circle', error: 'x-circle', info: 'info', warn: 'warning' };

  toast.className = `flex items-center gap-3 ${cores[tipo] || cores.info} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium translate-x-0 transition-all duration-300 opacity-0`;
  toast.innerHTML = `<i class="ph ph-${icones[tipo] || 'info'} text-xl"></i><span>${msg}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => { toast.classList.remove('opacity-0'); });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-x-full');
    setTimeout(() => toast.remove(), 350);
  }, 3500);
}

// ==========================================
// MODAL
// ==========================================
function abrirModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('hidden');
  requestAnimationFrame(() => m.querySelector('.modal-box')?.classList.add('scale-100', 'opacity-100'));
}

function fecharModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.querySelector('.modal-box')?.classList.remove('scale-100', 'opacity-100');
  setTimeout(() => m.classList.add('hidden'), 200);
}

// Fechar modal ao clicar fora
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    fecharModal(e.target.id);
  }
});

// ==========================================
// DARK MODE
// ==========================================
function initDarkMode() {
  const saved = localStorage.getItem('hmjlo_dark');
  if (saved === 'true') document.documentElement.classList.add('dark');
  atualizarIconeDark();
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('hmjlo_dark', isDark);
  atualizarIconeDark();
}

function atualizarIconeDark() {
  const isDark = document.documentElement.classList.contains('dark');
  const btn = document.getElementById('btn-dark-mode');
  if (btn) btn.innerHTML = isDark
    ? '<i class="ph ph-sun text-lg"></i>'
    : '<i class="ph ph-moon text-lg"></i>';
}

// ==========================================
// ORDENAÇÃO DE TABELAS
// ==========================================
let sortState = {}; // { tableId: { col: 0, asc: true } }

function sortTable(tableId, colIndex) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const st = sortState[tableId] || { col: -1, asc: true };
  const asc = st.col === colIndex ? !st.asc : true;
  sortState[tableId] = { col: colIndex, asc };

  const tbody = table.querySelector('tbody');
  const rows  = Array.from(tbody.querySelectorAll('tr'));

  rows.sort((a, b) => {
    const ca = a.cells[colIndex]?.innerText.trim() || '';
    const cb = b.cells[colIndex]?.innerText.trim() || '';
    const na = parseFloat(ca.replace(',', '.')), nb = parseFloat(cb.replace(',', '.'));
    const cmp = (!isNaN(na) && !isNaN(nb)) ? na - nb : ca.localeCompare(cb, 'pt-BR');
    return asc ? cmp : -cmp;
  });

  rows.forEach(r => tbody.appendChild(r));

  // Atualizar ícones nos cabeçalhos
  table.querySelectorAll('th').forEach((th, i) => {
    th.querySelectorAll('.sort-icon').forEach(ic => ic.remove());
    if (i === colIndex) {
      const ic = document.createElement('i');
      ic.className = `ph ph-caret-${asc ? 'up' : 'down'} sort-icon ml-1 text-brand-500`;
      th.appendChild(ic);
    }
  });
}

// Torna cabeçalhos de tabela clicáveis para ordenação
function ativarSortNaTabela(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  table.querySelectorAll('thead th').forEach((th, i) => {
    th.style.cursor = 'pointer';
    th.title = 'Clique para ordenar';
    th.addEventListener('click', () => sortTable(tableId, i));
  });
}

// ==========================================
// PAGINAÇÃO
// ==========================================
const paginacaoState = {};

function getPagina(key) { return paginacaoState[key]?.pagina || 1; }
function getLimite(key) { return paginacaoState[key]?.limite || LIMITE_TABELA; }

function setPagina(key, p) {
  if (!paginacaoState[key]) paginacaoState[key] = { pagina: 1, limite: LIMITE_TABELA };
  paginacaoState[key].pagina = p;
}

function setLimite(key, l) {
  if (!paginacaoState[key]) paginacaoState[key] = { pagina: 1, limite: LIMITE_TABELA };
  paginacaoState[key].limite = l;
  paginacaoState[key].pagina = 1;
}

function getPaginados(key, dados) {
  const p = getPagina(key);
  const l = getLimite(key);
  const inicio = (p - 1) * l;
  return dados.slice(inicio, inicio + l);
}

function renderPaginacao(key, dados, onMudar) {
  const container = document.getElementById(`paginacao-${key}`);
  if (!container) return;

  const p = getPagina(key);
  const l = getLimite(key);
  const total = dados.length;
  const totalPags = Math.ceil(total / l);
  const inicio = Math.min((p - 1) * l + 1, total);
  const fim    = Math.min(p * l, total);

  const btnClass = 'px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-gray-600 hover:bg-brand-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  container.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
      <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        Exibindo <strong class="text-gray-700 dark:text-gray-200">${inicio}–${fim}</strong> de <strong class="text-gray-700 dark:text-gray-200">${total}</strong> registros
        <select onchange="setLimite('${key}', +this.value); ${onMudar}()"
          class="ml-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs p-1 bg-white dark:bg-gray-700 dark:text-gray-200">
          <option ${l===25?'selected':''} value="25">25 por pág</option>
          <option ${l===50?'selected':''} value="50">50 por pág</option>
          <option ${l===100?'selected':''} value="100">100 por pág</option>
        </select>
      </div>
      <div class="flex items-center gap-1">
        <button onclick="setPagina('${key}',1); ${onMudar}()" ${p===1?'disabled':''} class="${btnClass}"><i class="ph ph-caret-double-left"></i></button>
        <button onclick="setPagina('${key}',${p-1}); ${onMudar}()" ${p===1?'disabled':''} class="${btnClass}"><i class="ph ph-caret-left"></i></button>
        <span class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300">${p} / ${totalPags}</span>
        <button onclick="setPagina('${key}',${p+1}); ${onMudar}()" ${p===totalPags?'disabled':''} class="${btnClass}"><i class="ph ph-caret-right"></i></button>
        <button onclick="setPagina('${key}',${totalPags}); ${onMudar}()" ${p===totalPags?'disabled':''} class="${btnClass}"><i class="ph ph-caret-double-right"></i></button>
      </div>
    </div>
  `;
}

// ==========================================
// FILTRO POR DATA
// ==========================================
const filtroData = {};

function aplicarFiltroPorData(key, dados, campoData) {
  const de  = filtroData[key]?.de  || '';
  const ate = filtroData[key]?.ate || '';
  if (!de && !ate) return dados;

  return dados.filter(row => {
    const val = row[campoData] || '';
    // Tenta parsear datas no formato DD/MM/YYYY ou YYYY-MM-DD
    const partes = val.split('/');
    let d;
    if (partes.length === 3) {
      d = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
    } else {
      d = new Date(val);
    }
    if (isNaN(d)) return true; // Não filtra se não souber parsear
    if (de  && d < new Date(de))  return false;
    if (ate && d > new Date(ate + 'T23:59:59')) return false;
    return true;
  });
}

function renderFiltroData(key, onMudar, campoLabel = 'Data') {
  return `
    <div class="flex items-center gap-2 flex-wrap">
      <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">${campoLabel}:</span>
      <input type="date" id="fd-de-${key}"
        onchange="filtroData['${key}'] = filtroData['${key}'] || {}; filtroData['${key}'].de = this.value; setPagina('${key}',1); ${onMudar}()"
        class="border border-gray-200 dark:border-gray-600 rounded-lg text-xs px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:border-brand-500">
      <span class="text-xs text-gray-400">até</span>
      <input type="date" id="fd-ate-${key}"
        onchange="filtroData['${key}'] = filtroData['${key}'] || {}; filtroData['${key}'].ate = this.value; setPagina('${key}',1); ${onMudar}()"
        class="border border-gray-200 dark:border-gray-600 rounded-lg text-xs px-2 py-1.5 bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:border-brand-500">
      <button onclick="filtroData['${key}']={de:'',ate:''}; document.getElementById('fd-de-${key}').value=''; document.getElementById('fd-ate-${key}').value=''; ${onMudar}()"
        class="text-xs text-gray-400 hover:text-red-500 transition-colors" title="Limpar filtro de data">
        <i class="ph ph-x-circle"></i>
      </button>
    </div>
  `;
}

// ==========================================
// EXPORTAÇÃO CSV
// ==========================================
function exportarCSV(dados, nomeArquivo) {
  if (!dados || dados.length === 0) { showToast('Nenhum dado para exportar.', 'warn'); return; }

  const headers = Object.keys(dados[0]);
  const linhas  = [
    headers.join(';'),
    ...dados.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(';'))
  ];

  const blob = new Blob(['\uFEFF' + linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${nomeArquivo}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exportado com sucesso!', 'success');
}

// ==========================================
// AUTO-REFRESH
// ==========================================
let refreshTimer = null;
let refreshCountdown = AUTO_REFRESH_INTERVAL / 1000;

function iniciarAutoRefresh(fn) {
  refreshCountdown = AUTO_REFRESH_INTERVAL / 1000;
  atualizarContadorRefresh();

  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    refreshCountdown--;
    if (refreshCountdown <= 0) {
      refreshCountdown = AUTO_REFRESH_INTERVAL / 1000;
      fn();
    }
    atualizarContadorRefresh();
  }, 1000);
}

function atualizarContadorRefresh() {
  const el = document.getElementById('refresh-countdown');
  if (!el) return;
  const m = String(Math.floor(refreshCountdown / 60)).padStart(2, '0');
  const s = String(refreshCountdown % 60).padStart(2, '0');
  el.textContent = `${m}:${s}`;
}

function atualizarHoraSync() {
  const el = document.getElementById('ultima-atualizacao');
  if (el) el.textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ==========================================
// INDICADOR DE CONEXÃO
// ==========================================
async function verificarConexao() {
  const dot = document.getElementById('status-dot');
  const txt = document.getElementById('status-txt');
  if (!dot || !txt) return;

  try {
    if (APPS_SCRIPT_URL) {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=ping`, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      if (data.ok) {
        dot.className = 'w-2 h-2 rounded-full bg-green-400';
        txt.textContent = 'Conectado';
        return;
      }
    }
    dot.className = 'w-2 h-2 rounded-full bg-yellow-400';
    txt.textContent = 'Scripts não configurado';
  } catch (_) {
    dot.className = 'w-2 h-2 rounded-full bg-red-400';
    txt.textContent = 'Sem conexão';
  }
}

// Inicializar dark mode ao carregar
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  verificarConexao();
});
