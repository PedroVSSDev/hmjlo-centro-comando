// ============================================================
//  LÓGICA PRINCIPAL — Centro de Comando HMJLO
//  Arquivo: scripts/main.js
// ============================================================

let rawData = {
  vacinas:[], ambulancias:[], censo:[], notificacoes:[],
  pacientes:[], solucoes:[], extras:[], viagens:[], funcionarios:[], obstetricia:[]
};
let filteredData = { ...rawData };

// ── Filtros Avançados ──
window.filtrosAvancados = {}; // { pacientes: { Sexo: 'F', Status: 'Ativo' } }

function aplicarFiltrosAvancados(key, dadosAFiltrar) {
  let result = dadosAFiltrar;
  if (window.filtrosAvancados[key]) {
    for (const [coluna, valor] of Object.entries(window.filtrosAvancados[key])) {
      if (valor !== '') {
        result = result.filter(row => String(row[coluna] || '').toLowerCase().trim() === String(valor).toLowerCase().trim());
      }
    }
  }
  return result;
}

window.renderFiltroOpcoes = function(key, colunaNome, elementoId) {
  const container = document.getElementById(elementoId);
  if (!container || !rawData[key] || !rawData[key].length) return;
  
  // Extrair valores únicos
  const valores = [...new Set(rawData[key].map(r => String(r[colunaNome] || '').trim()))].filter(v => v);
  if (!valores.length) return;

  const atual = (window.filtrosAvancados[key] && window.filtrosAvancados[key][colunaNome]) || '';
  
  container.innerHTML = `
    <select onchange="window.filtrosAvancados['${key}'] = window.filtrosAvancados['${key}'] || {}; window.filtrosAvancados['${key}']['${colunaNome}'] = this.value; setPagina('${key}',1); renderAllTables();"
      class="border border-gray-200 dark:border-gray-600 rounded-lg text-xs p-1.5 bg-white dark:bg-gray-700 dark:text-gray-200 max-w-[150px]">
      <option value="">Filtro: ${colunaNome} (Todos)</option>
      ${valores.sort().map(v => `<option value="${v}" ${atual === v ? 'selected' : ''}>${v}</option>`).join('')}
    </select>
  `;
};

// ── Navegação ──
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  const tab = document.getElementById(`tab-${tabId}`);
  if (tab) tab.classList.add('active');
  if (window.innerWidth >= 768) {
    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.remove('bg-brand-50','text-brand-700','dark:bg-brand-900/30');
      b.classList.add('text-gray-600','dark:text-gray-400');
    });
    const ab = document.getElementById(`btn-${tabId}`);
    if (ab) { ab.classList.remove('text-gray-600','dark:text-gray-400'); ab.classList.add('bg-brand-50','text-brand-700','dark:bg-brand-900/30'); }
  }
  // Carregar usuários ao entrar na aba
  if (tabId === 'usuarios' && isMaster()) carregarUsuarios();
}

// ── Utilitários de dado ──
function getColValue(row, names) {
  const k = Object.keys(row).find(k => names.includes(k.toLowerCase().trim()));
  return k && row[k] ? row[k] : '';
}
function calcMinutes(start, end) {
  if (!start || !end) return null;
  const sp = start.split(':'), ep = end.split(':');
  if (sp.length < 2 || ep.length < 2) return null;
  const s = new Date(); s.setHours(+sp[0],+sp[1],0);
  const e = new Date(); e.setHours(+ep[0],+ep[1],0);
  let d = (e - s) / 60000;
  if (d < 0) d += 1440;
  return d;
}

// ── Fetch de dados ──
async function fetchData() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.remove('hidden');

  const fetchSheet = (gid, key) => {
    if (!gid) return Promise.resolve();
    return new Promise(resolve => {
      Papa.parse(getURL(gid), {
        download:true, header:true, skipEmptyLines:true,
        complete: r => { 
          if (r.data?.length) {
            // A linha 1 é o cabeçalho. Então o index 0 dos dados é a Linha 2 do Google Sheets.
            r.data.forEach((row, index) => { row._rowIndex = index + 2; });
            rawData[key] = r.data.reverse(); 
          }
          resolve(); 
        },
        error: () => resolve()
      });
    });
  };

  await Promise.all([
    fetchSheet(GID_VACINAS,'vacinas'),
    fetchSheet(GID_AMBULANCIAS,'ambulancias'),
    fetchSheet(GID_CENSO,'censo'),
    fetchSheet(GID_NOTIFICACOES,'notificacoes'),
    fetchSheet(GID_PACIENTES,'pacientes'),
    fetchSheet(GID_SOLUCOES,'solucoes'),
    fetchSheet(GID_EXTRAS,'extras'),
    fetchSheet(GID_VIAGENS,'viagens'),
    fetchSheet(GID_FUNCIONARIOS,'funcionarios'),
    fetchSheet(GID_OBSTETRICIA,'obstetricia'),
  ]);

  for (let k in rawData) filteredData[k] = [...rawData[k]];

  updateKPIs();
  renderAllTables();
  renderCharts();
  atualizarHoraSync();
  if (overlay) overlay.classList.add('hidden');
}

// ── Busca ──
function applyFilter(key, term) {
  const t = term.toLowerCase().trim();
  filteredData[key] = !t ? [...rawData[key]] :
    rawData[key].filter(r => Object.values(r).some(v => v && String(v).toLowerCase().includes(t)));
  setPagina(key, 1);
  renderAllTables();
}

// ── KPIs e Alertas ──
function updateKPIs() {
  const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  set('kpi-internados', rawData.censo.length);
  set('kpi-notif', rawData.notificacoes.length);
  set('kpi-pacientes', rawData.pacientes.length);
  set('kpi-resgates', rawData.ambulancias.length);
  set('kpi-vacinas', rawData.vacinas.length);

  let total = 0, cnt = 0;
  rawData.ambulancias.forEach(a => {
    const d = calcMinutes(getColValue(a,['hora saída','hora saida']), getColValue(a,['hora chegada','chegada']));
    if (d !== null) { total += d; cnt++; }
  });
  set('kpi-tempo-resgate', cnt > 0 ? Math.round(total/cnt) : 0);

  // Alertas
  const ac = document.getElementById('alertas-container');
  if (!ac) return;
  let html = '';
  const slow = rawData.ambulancias.filter(a => {
    const d = calcMinutes(getColValue(a,['hora saída','hora saida']), getColValue(a,['hora chegada','chegada']));
    return d !== null && d > SLA_AMBULANCIA_MINUTOS;
  });
  if (slow.length > 0)
    html += `<div class="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-red-100 flex items-start gap-3 alert-pulse">
      <i class="ph ph-ambulance text-red-500 text-xl mt-0.5"></i>
      <div><p class="text-xs font-bold text-red-800 uppercase">SLA Estourado</p>
      <p class="text-xs text-red-600 mt-1"><b>${slow.length} resgate(s)</b> passaram de 2h.</p></div></div>`;
  if (rawData.censo.length > 10)
    html += `<div class="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-red-100 flex items-start gap-3">
      <i class="ph ph-bed text-orange-500 text-xl mt-0.5"></i>
      <div><p class="text-xs font-bold text-orange-800 uppercase">Alta Ocupação</p>
      <p class="text-xs text-orange-600 mt-1"><b>${rawData.censo.length} pacientes</b> no censo atual.</p></div></div>`;
  ac.innerHTML = html || '<div class="text-sm text-green-600 font-medium col-span-3">✅ Nenhum alerta crítico no momento.</div>';
}

// ── Render centralizado ──
function renderAllTables() {
  // Inicializar Filtros Dinâmicos
  window.renderFiltroOpcoes('vacinas', 'Sexo', 'filtro-sexo-vacinas');
  window.renderFiltroOpcoes('funcionarios', 'Situação de Vínculo', 'filtro-status-funcionarios');
  window.renderFiltroOpcoes('funcionarios', 'Registro Classe', 'filtro-classe-funcionarios');

  renderCenso(); renderAmbulancias(); renderVacinas(); renderNotificacoes();
  renderDynamic('container-dinamico-pacientes','pacientes');
  renderDynamic('container-dinamico-solucoes','solucoes');
  renderDynamic('container-dinamico-extras','extras');
  renderDynamic('container-dinamico-viagens','viagens');
  renderDynamic('container-dinamico-funcionarios','funcionarios');
  renderDynamic('container-dinamico-obstetricia','obstetricia');
}

const emptyRow = (cols=6) => `<tr><td colspan="${cols}" class="px-6 py-6 text-center text-gray-400 dark:text-gray-500">Nenhum registro encontrado.</td></tr>`;

function renderCenso() {
  const tb = document.getElementById('tabela-censo'); if (!tb) return;
  const data = getPaginados('censo', aplicarFiltroPorData('censo', filteredData.censo, 'data'));
  if (!data.length) { tb.innerHTML = emptyRow(6); renderPaginacao('censo', filteredData.censo, 'renderAllTables'); return; }
  tb.innerHTML = data.map(c => {
    const leito=getColValue(c,['leito','quarto']), pac=getColValue(c,['paciente','nome do paciente','nome']),
      dt=getColValue(c,['data internação','data internacao','data']), diag=getColValue(c,['diagnóstico','diagnostico','motivo']),
      med=getColValue(c,['médico','medico']), st=getColValue(c,['status','situação','situacao']);
    return `<tr class="hover:bg-brand-50/40 dark:hover:bg-gray-700/30">
      <td class="px-6 py-3 font-bold text-gray-500 dark:text-gray-400">${leito}</td>
      <td class="px-6 py-3 font-medium dark:text-gray-200">${pac}</td>
      <td class="px-6 py-3 text-xs dark:text-gray-400">${dt}</td>
      <td class="px-6 py-3 dark:text-gray-300">${diag}</td>
      <td class="px-6 py-3 dark:text-gray-300">${med}</td>
      <td class="px-6 py-3"><span class="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs dark:bg-blue-900/30 dark:text-blue-300">${st}</span></td>
      <td class="px-6 py-3">
        <button onclick="preencherFormularioEditar('censo', ${c._rowIndex})" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple"></i></button>
        <button onclick="excluirRegistro(ABA_CENSO, ${c._rowIndex}, () => fetchData())" class="text-red-500 hover:text-red-700"><i class="ph ph-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
  renderPaginacao('censo', filteredData.censo, 'renderAllTables');
}

function renderAmbulancias() {
  const tb = document.getElementById('tabela-ambulancias'); if (!tb) return;
  const data = getPaginados('ambulancias', aplicarFiltroPorData('ambulancias', filteredData.ambulancias, 'dd/mm/yyyy'));
  if (!data.length) { tb.innerHTML = emptyRow(5); renderPaginacao('ambulancias', filteredData.ambulancias, 'renderAllTables'); return; }
  tb.innerHTML = data.map(a => {
    const dt=getColValue(a,['dd/mm/yyyy','data']), start=getColValue(a,['hora saída','hora saida']),
      end=getColValue(a,['hora chegada','chegada']), diff=calcMinutes(start,end),
      vei=getColValue(a,['ambulância','ambulancia']), cond=getColValue(a,['condutor','motorista']),
      pac=getColValue(a,['nome do paciente','paciente']), loc=getColValue(a,['local ocorrência','local','tipo de local']),
      sit=getColValue(a,['situação da ocorrência','situação']);
    const badge = diff!==null && diff>SLA_AMBULANCIA_MINUTOS ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    const diffTxt = diff !== null ? `${Math.round(diff)} min` : 'Em andamento';
    return `<tr class="hover:bg-brand-50/40 dark:hover:bg-gray-700/30">
      <td class="px-6 py-3 dark:text-gray-300">${dt}<br><span class="text-xs text-gray-400">Saída: ${start}</span></td>
      <td class="px-6 py-3"><span class="${badge} px-2 py-1 rounded text-xs font-bold">${diffTxt}</span></td>
      <td class="px-6 py-3 dark:text-gray-200">${vei}<br><span class="text-xs text-gray-500">${cond}</span></td>
      <td class="px-6 py-3 font-medium dark:text-gray-200">${pac}<br><span class="text-xs font-normal text-gray-500">${loc}</span></td>
      <td class="px-6 py-3"><span class="bg-green-50 text-green-700 px-2 py-1 rounded text-xs dark:bg-green-900/30 dark:text-green-300">${sit}</span></td>
      <td class="px-6 py-3">
        <button onclick="preencherFormularioEditar('ambulancias', ${a._rowIndex})" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple"></i></button>
        <button onclick="excluirRegistro(ABA_AMBULANCIAS, ${a._rowIndex}, () => fetchData())" class="text-red-500 hover:text-red-700"><i class="ph ph-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
  renderPaginacao('ambulancias', filteredData.ambulancias, 'renderAllTables');
}

function renderVacinas() {
  const tb = document.getElementById('tabela-vacinas'); if (!tb) return;
  const dataAFiltrar = aplicarFiltrosAvancados('vacinas', filteredData.vacinas);
  const data = getPaginados('vacinas', dataAFiltrar);
  if (!data.length) { tb.innerHTML = emptyRow(5); renderPaginacao('vacinas', dataAFiltrar, 'renderAllTables'); return; }
  tb.innerHTML = data.map(v => {
    const dt=getColValue(v,['mês referência','mes','data']), pac=getColValue(v,['nome do paciente','nome']),
      mot=getColValue(v,['motivo','motivo da aplicacao']), ap=getColValue(v,['profissional aplicador','aplicador']);
    return `<tr class="hover:bg-brand-50/40 dark:hover:bg-gray-700/30">
      <td class="px-6 py-3 dark:text-gray-300">${dt}</td><td class="px-6 py-3 font-medium dark:text-gray-200">${pac}</td>
      <td class="px-6 py-3 dark:text-gray-300">${mot}</td><td class="px-6 py-3 dark:text-gray-300">${ap}</td>
      <td class="px-6 py-3">
        <button onclick="preencherFormularioEditar('vacinas', ${v._rowIndex})" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple"></i></button>
        <button onclick="excluirRegistro(ABA_VACINAS, ${v._rowIndex}, () => fetchData())" class="text-red-500 hover:text-red-700"><i class="ph ph-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
  renderPaginacao('vacinas', dataAFiltrar, 'renderAllTables');
}

function renderNotificacoes() {
  const tb = document.getElementById('tabela-notificacoes'); if (!tb) return;
  const data = getPaginados('notificacoes', filteredData.notificacoes);
  if (!data.length) { tb.innerHTML = emptyRow(4); renderPaginacao('notificacoes', filteredData.notificacoes, 'renderAllTables'); return; }
  tb.innerHTML = data.map(n => {
    const dt=getColValue(n,['data','data notificação']), pac=getColValue(n,['paciente','nome do paciente','nome']),
      tp=getColValue(n,['tipo','tipo notificação','agravo']), st=getColValue(n,['status','situação']);
    return `<tr class="hover:bg-brand-50/40 dark:hover:bg-gray-700/30">
      <td class="px-6 py-3 dark:text-gray-300">${dt}</td><td class="px-6 py-3 font-medium dark:text-gray-200">${pac}</td>
      <td class="px-6 py-3 dark:text-gray-300">${tp}</td>
      <td class="px-6 py-3"><span class="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-bold dark:bg-orange-900/30 dark:text-orange-300">${st}</span></td>
      <td class="px-6 py-3">
        <button onclick="preencherFormularioEditar('notificacoes', ${n._rowIndex})" class="text-blue-500 hover:text-blue-700 mr-2"><i class="ph ph-pencil-simple"></i></button>
        <button onclick="excluirRegistro(ABA_NOTIFICACOES, ${n._rowIndex}, () => fetchData())" class="text-red-500 hover:text-red-700"><i class="ph ph-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
  renderPaginacao('notificacoes', filteredData.notificacoes, 'renderAllTables');
}

function renderDynamic(containerId, key) {
  const c = document.getElementById(containerId); if (!c) return;
  const data = getPaginados(key, aplicarFiltrosAvancados(key, filteredData[key]));
  if (!filteredData[key].length) {
    c.innerHTML = '<div class="p-8 text-center text-gray-400 dark:text-gray-500">Nenhum registro encontrado. Adicione dados na planilha.</div>';
    return;
  }
  const headers = Object.keys(filteredData[key][0]).filter(h => h !== '_rowIndex');
  c.innerHTML = `<div class="overflow-x-auto custom-scrollbar"><table class="w-full text-left text-sm whitespace-nowrap">
    <thead class="bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 uppercase text-[10px] font-bold tracking-wider">
      <tr>
        ${headers.map((h,i) => `<th class="px-6 py-4 cursor-pointer hover:text-brand-600" onclick="sortTableData('${key}',${i},'${containerId}')">${h}<i class="ph ph-caret-up-down ml-1 opacity-40"></i></th>`).join('')}
        <th class="px-6 py-4">Ações</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
      ${data.map(row => `<tr class="hover:bg-brand-50/40 dark:hover:bg-gray-700/30">
        ${headers.map(h => `<td class="px-6 py-3">${row[h]||'-'}</td>`).join('')}
        <td class="px-6 py-3">
          <button onclick="preencherFormularioEditar('${key}', ${row._rowIndex})" class="text-blue-500 hover:text-blue-700 mr-2" title="Editar"><i class="ph ph-pencil-simple"></i></button>
          <button onclick="excluirRegistro(ABA_${key.toUpperCase()}, ${row._rowIndex}, () => fetchData())" class="text-red-500 hover:text-red-700" title="Excluir"><i class="ph ph-trash"></i></button>
        </td>
      </tr>`).join('')}
    </tbody>
  </table></div>`;
  renderPaginacao(key, aplicarFiltrosAvancados(key, filteredData[key]), 'renderAllTables');
}

// Sort para tabelas dinâmicas
let sortStates = {};
function sortTableData(key, colIdx, containerId) {
  const headers = Object.keys(filteredData[key][0] || {});
  const h = headers[colIdx];
  const prev = sortStates[key];
  const asc = prev?.col === h ? !prev.asc : true;
  sortStates[key] = { col: h, asc };
  filteredData[key].sort((a,b) => {
    const va = String(a[h]||''), vb = String(b[h]||'');
    const na = parseFloat(va.replace(',','.')), nb = parseFloat(vb.replace(',','.'));
    const cmp = !isNaN(na)&&!isNaN(nb) ? na-nb : va.localeCompare(vb,'pt-BR');
    return asc ? cmp : -cmp;
  });
  renderDynamic(containerId, key);
}

// ── Gráficos ──
let charts = {};
function buildChart(id, type, dataObj, colors) {
  const ctx = document.getElementById(id); if (!ctx) return;
  if (charts[id]) charts[id].destroy();
  const keys = Object.keys(dataObj);
  if (!keys.length) { ctx.parentElement.innerHTML = '<span class="text-sm text-gray-400 dark:text-gray-500">Sem dados suficientes</span>'; return; }
  charts[id] = new Chart(ctx, {
    type, data: { labels: keys, datasets: [{ data: Object.values(dataObj), backgroundColor: colors, borderWidth: type==='doughnut'?2:0, borderColor:'#fff', borderRadius: type==='bar'?4:0 }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:type!=='bar', position:'right', labels:{color:'#64748b',font:{size:11}} } }, scales: type==='bar' ? { y:{beginAtZero:true,grid:{color:'rgba(0,0,0,.05)'}}, x:{grid:{display:false}} } : undefined }
  });
}

function renderCharts() {
  const topN = (obj, n=5) => Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,n).reduce((acc,[k,v])=>(acc[k]=v,acc),{});
  const COLORS = ['#14b8a6','#0ea5e9','#f43f5e','#8b5cf6','#f59e0b','#10b981','#6366f1'];

  // Censo: diagnósticos
  const diags = {};
  rawData.censo.forEach(c => { const d=getColValue(c,['diagnóstico','diagnostico','motivo']); if(d) diags[d]=(diags[d]||0)+1; });
  buildChart('chart-censo-diag','doughnut',topN(diags),COLORS);

  // Ambulâncias: tempo por condutor
  const tempos={}, cnts={};
  rawData.ambulancias.forEach(a => {
    const cond=getColValue(a,['condutor','motorista']), d=calcMinutes(getColValue(a,['hora saída','hora saida']),getColValue(a,['hora chegada','chegada']));
    if(d!==null&&cond){tempos[cond]=(tempos[cond]||0)+d; cnts[cond]=(cnts[cond]||0)+1;}
  });
  const avg={};for(let c in tempos) avg[c]=Math.round(tempos[c]/cnts[c]);
  buildChart('chart-amb-tempo','bar',avg,COLORS);

  // Notificações: tipos
  const tipos={};
  rawData.notificacoes.forEach(n=>{ const t=getColValue(n,['tipo','agravo','tipo notificação']); if(t) tipos[t]=(tipos[t]||0)+1; });
  buildChart('chart-notif-tipos','doughnut',topN(tipos),COLORS);

  // Ambulâncias: situações
  const sits={};
  rawData.ambulancias.forEach(a=>{ const s=getColValue(a,['situação da ocorrência','situação','situacao']); if(s) sits[s]=(sits[s]||0)+1; });
  buildChart('chart-amb-situacoes','bar',sits,COLORS);
}

// ── Inicialização ──
window.addEventListener('DOMContentLoaded', () => {
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.color = '#64748b';
  if (estaLogado()) {
    fetchData();
    iniciarAutoRefresh(fetchData);
    verificarConexao();
  }
});
