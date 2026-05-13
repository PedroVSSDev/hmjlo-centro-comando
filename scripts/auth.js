// ============================================================
//  AUTENTICAÇÃO — Centro de Comando HMJLO
//  Arquivo: scripts/auth.js
// ============================================================

const AUTH_KEY = 'hmjlo_session';

// ==========================================
// ESTADO DA SESSÃO
// ==========================================
function getSessao() {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

function setSessao(dados) {
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(dados));
}

function limparSessao() {
  sessionStorage.removeItem(AUTH_KEY);
}

function estaLogado() {
  return !!getSessao();
}

function isMaster() {
  const s = getSessao();
  return s && s.role === 'master';
}

function temPermissao(perm) {
  const s = getSessao();
  if (!s) return false;
  if (s.role === 'master') return true;
  const p = String(s.permissoes || '');
  return p.includes('tudo') || p.includes(perm);
}

// ==========================================
// LOGIN E LOGOUT
// ==========================================
async function fazerLogin(usuario, senha) {
  if (!APPS_SCRIPT_URL) {
    // Modo offline: login local simplificado para testes
    if (usuario === 'master' && senha === 'master@hmjlo') {
      setSessao({ token: 'local', role: 'master', nome: 'Administrador', permissoes: 'tudo' });
      return { ok: true };
    }
    return { ok: false, erro: 'Apps Script não configurado. Use master / master@hmjlo para teste local.' };
  }

  try {
    const resp = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'login', usuario, senha })
    });
    const data = await resp.json();
    if (data.ok) setSessao(data);
    return data;
  } catch (e) {
    return { ok: false, erro: 'Erro de conexão. Verifique a internet.' };
  }
}

async function fazerLogout() {
  const s = getSessao();
  if (s && s.token && APPS_SCRIPT_URL) {
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'logout', token: s.token })
      });
    } catch (_) {}
  }
  limparSessao();
  mostrarTelaLogin();
}

// ==========================================
// API — CHAMADAS AUTENTICADAS
// ==========================================
async function apiPost(body) {
  const s = getSessao();
  if (!s) return { ok: false, erro: 'Não autenticado.' };
  const payload = { ...body, token: s.token };

  if (!APPS_SCRIPT_URL) {
    return { ok: false, erro: 'Apps Script não configurado. Cole a URL em config.js.' };
  }

  const resp = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  return resp.json();
}

async function apiGet(params) {
  const s = getSessao();
  if (!s) return { ok: false, erro: 'Não autenticado.' };
  const qs = new URLSearchParams({ ...params, token: s.token }).toString();
  const resp = await fetch(`${APPS_SCRIPT_URL}?${qs}`);
  return resp.json();
}

// ==========================================
// RENDERIZAÇÃO DA TELA DE LOGIN
// ==========================================
function mostrarTelaLogin() {
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-error').classList.add('hidden');
  document.getElementById('login-form').reset();
}

function mostrarApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');

  const s = getSessao();
  if (s) {
    document.getElementById('user-nome').textContent = s.nome || s.usuario || 'Usuário';
    document.getElementById('user-role-badge').textContent = s.role === 'master' ? '👑 Master' : '👤 Usuário';
  }

  // Mostrar/ocultar item de gestão de usuários conforme o papel
  const btnUsuarios = document.getElementById('btn-usuarios');
  if (btnUsuarios) {
    btnUsuarios.style.display = isMaster() ? 'flex' : 'none';
  }

  // Mostrar/ocultar botões de "+ Novo" conforme permissão
  document.querySelectorAll('.btn-novo-registro').forEach(btn => {
    btn.style.display = temPermissao('editar') ? 'flex' : 'none';
  });
}

// ==========================================
// HANDLER DO FORMULÁRIO DE LOGIN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  if (!form) return;

  // Verificar se já tem sessão ativa
  if (estaLogado()) {
    mostrarApp();
  } else {
    mostrarTelaLogin();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const err = document.getElementById('login-error');

    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-spinner-gap animate-spin"></i> Entrando...';
    err.classList.add('hidden');

    const usuario = document.getElementById('login-usuario').value;
    const senha   = document.getElementById('login-senha').value;

    const res = await fazerLogin(usuario, senha);

    if (res.ok) {
      mostrarApp();
    } else {
      err.textContent = res.erro || 'Erro desconhecido.';
      err.classList.remove('hidden');
      btn.disabled = false;
      btn.innerHTML = '<i class="ph ph-sign-in"></i> Entrar';
    }
  });
});

// ==========================================
// GESTÃO DE USUÁRIOS (MASTER)
// ==========================================
async function carregarUsuarios() {
  const res = await apiGet({ action: 'listar_usuarios' });
  if (!res.ok) { showToast(res.erro, 'error'); return; }

  const tbody = document.getElementById('tabela-usuarios');
  if (!tbody) return;

  tbody.innerHTML = res.usuarios.map(u => `
    <tr class="hover:bg-brand-50/40 dark:hover:bg-gray-700/40">
      <td class="px-6 py-3 font-medium dark:text-gray-200">${u.usuario}</td>
      <td class="px-6 py-3 dark:text-gray-300">${u.nome_exibicao}</td>
      <td class="px-6 py-3">
        <span class="${u.role === 'master' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-700'} px-2 py-1 rounded text-xs font-bold">
          ${u.role === 'master' ? '👑 Master' : '👤 Usuário'}
        </span>
      </td>
      <td class="px-6 py-3 text-xs dark:text-gray-400">${u.permissoes}</td>
      <td class="px-6 py-3">
        ${u.usuario !== 'master' ? `
          <button onclick="abrirEditarUsuario('${u.usuario}','${u.nome_exibicao}','${u.role}','${u.permissoes}')"
            class="text-brand-600 hover:text-brand-700 text-xs mr-3"><i class="ph ph-pencil"></i> Editar</button>
          <button onclick="confirmarExcluirUsuario('${u.usuario}')"
            class="text-red-500 hover:text-red-700 text-xs"><i class="ph ph-trash"></i> Excluir</button>
        ` : '<span class="text-xs text-gray-400">—</span>'}
      </td>
    </tr>
  `).join('');
}

async function salvarNovoUsuario() {
  const usuario = document.getElementById('nu-usuario').value.trim();
  const nome    = document.getElementById('nu-nome').value.trim();
  const senha   = document.getElementById('nu-senha').value;
  const role    = document.getElementById('nu-role').value;
  const perms   = Array.from(document.querySelectorAll('.nu-perm:checked')).map(c => c.value).join(',');

  if (!usuario || !senha || !nome) { showToast('Preencha todos os campos obrigatórios.', 'error'); return; }

  const res = await apiPost({ action: 'criar_usuario', usuario, senha, role, nome_exibicao: nome, permissoes: perms || 'visualizar' });
  if (res.ok) {
    fecharModal('modal-novo-usuario');
    showToast('Usuário criado com sucesso!', 'success');
    carregarUsuarios();
  } else {
    showToast(res.erro, 'error');
  }
}

async function confirmarExcluirUsuario(usuario) {
  if (!confirm(`Tem certeza que deseja excluir o usuário "${usuario}"?`)) return;
  const res = await apiPost({ action: 'excluir_usuario', usuario });
  if (res.ok) { showToast('Usuário excluído.', 'success'); carregarUsuarios(); }
  else { showToast(res.erro, 'error'); }
}

function abrirEditarUsuario(usuario, nome, role, perms) {
  document.getElementById('eu-usuario').value = usuario;
  document.getElementById('eu-nome').value    = nome;
  document.getElementById('eu-role').value    = role;
  document.querySelectorAll('.eu-perm').forEach(cb => {
    cb.checked = perms.includes(cb.value);
  });
  abrirModal('modal-editar-usuario');
}

async function salvarEdicaoUsuario() {
  const usuario    = document.getElementById('eu-usuario').value;
  const nome       = document.getElementById('eu-nome').value.trim();
  const nova_senha = document.getElementById('eu-nova-senha').value;
  const role       = document.getElementById('eu-role').value;
  const perms      = Array.from(document.querySelectorAll('.eu-perm:checked')).map(c => c.value).join(',');

  const payload = { action: 'editar_usuario', usuario, nome_exibicao: nome, role, permissoes: perms };
  if (nova_senha) payload.nova_senha = nova_senha;

  const res = await apiPost(payload);
  if (res.ok) {
    fecharModal('modal-editar-usuario');
    showToast('Usuário atualizado!', 'success');
    carregarUsuarios();
  } else {
    showToast(res.erro, 'error');
  }
}
