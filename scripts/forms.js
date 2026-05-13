// ============================================================
//  FORMULÁRIOS DE CADASTRO — Centro de Comando HMJLO
//  Arquivo: scripts/forms.js
// ============================================================

// ==========================================
// ENVIO GENÉRICO PARA O APPS SCRIPT
// ==========================================
async function enviarFormulario(aba, dados, modalId, onSucesso) {
  const btn = document.querySelector(`#${modalId} .btn-salvar`);
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ph ph-spinner-gap animate-spin"></i> Salvando...'; }

  const res = await apiPost({ action: 'adicionar_linha', aba, dados });

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ph ph-check"></i> Salvar'; }

  if (res.ok) {
    fecharModal(modalId);
    showToast(res.mensagem || 'Registro salvo com sucesso!', 'success');
    if (onSucesso) onSucesso();
  } else {
    showToast(res.erro || 'Erro ao salvar.', 'error');
  }
}

// ==========================================
// FORMULÁRIO: NOVO PACIENTE
// ==========================================
function abrirFormPaciente() {
  if (!temPermissao('editar')) { showToast('Sem permissão para adicionar registros.', 'error'); return; }
  document.getElementById('form-paciente').reset();
  abrirModal('modal-paciente');
}

const fData = (val) => {
  if (!val) return '';
  const [y, m, d] = val.split('-');
  return y && m && d ? `${d}/${m}/${y}` : val;
};

async function salvarPaciente() {
  const dados = {
    'Código Cadastro': document.getElementById('fp-codigo').value,
    'Nome do Paciente': document.getElementById('fp-nome').value,
    'Data Nascimento': fData(document.getElementById('fp-nascimento').value),
    'CNS': document.getElementById('fp-cns').value,
    'CPF': document.getElementById('fp-cpf').value,
    'Sexo': document.getElementById('fp-sexo').value,
    'Nome da Mãe': document.getElementById('fp-mae').value,
    'CIdade': document.getElementById('fp-cidade').value,
    'Contato': document.getElementById('fp-contato').value,
  };
  if (!dados['Nome do Paciente']) { showToast('Nome do paciente é obrigatório.', 'warn'); return; }
  await enviarFormulario(ABA_PACIENTES, dados, 'modal-paciente', () => fetchData());
}

// ==========================================
// FORMULÁRIO: NOVO RESGATE / AMBULÂNCIA
// ==========================================
function abrirFormAmbulancia() {
  if (!temPermissao('editar')) { showToast('Sem permissão.', 'error'); return; }
  document.getElementById('form-ambulancia').reset();
  document.getElementById('fa-data').value = new Date().toLocaleDateString('pt-BR');
  abrirModal('modal-ambulancia');
}

async function salvarAmbulancia() {
  const dados = {
    'Data': document.getElementById('fa-data').value,
    'Hora Saída': document.getElementById('fa-hora-saida').value,
    'Hora Chegada': document.getElementById('fa-hora-chegada').value,
    'Condutor': document.getElementById('fa-condutor').value,
    'Ambulância': document.getElementById('fa-veiculo').value,
    'Nome do Paciente': document.getElementById('fa-paciente').value,
    'Local Ocorrência': document.getElementById('fa-local').value,
    'Tipo de Local': document.getElementById('fa-tipo-local').value,
    'Situação da Ocorrência': document.getElementById('fa-situacao').value
  };
  if (!dados['Condutor']) { showToast('Condutor é obrigatório.', 'warn'); return; }
  await enviarFormulario(ABA_AMBULANCIAS, dados, 'modal-ambulancia', () => fetchData());
}

// ==========================================
// FORMULÁRIO: NOVA VACINA DT
// ==========================================
function abrirFormVacina() {
  if (!temPermissao('editar')) { showToast('Sem permissão.', 'error'); return; }
  document.getElementById('form-vacina').reset();
  abrirModal('modal-vacina');
}

async function salvarVacina() {
  const dados = {
    'Mês referência': document.getElementById('fv-mes').value,
    'Código da aplicação': document.getElementById('fv-codigo').value,
    'Nome do Paciente': document.getElementById('fv-nome').value,
    'CNS ou CPF': document.getElementById('fv-cnscpf').value,
    'Data Nasc.': fData(document.getElementById('fv-nasc').value),
    'Motivo': document.getElementById('fv-motivo').value,
    'Profissional Aplicador': document.getElementById('fv-aplicador').value,
  };
  if (!dados['Nome do Paciente']) { showToast('Nome do paciente é obrigatório.', 'warn'); return; }
  await enviarFormulario(ABA_VACINAS, dados, 'modal-vacina', () => fetchData());
}

// ==========================================
// FORMULÁRIO: NOVA NOTIFICAÇÃO
// ==========================================
function abrirFormNotificacao() {
  if (!temPermissao('editar')) { showToast('Sem permissão.', 'error'); return; }
  document.getElementById('form-notificacao').reset();
  document.getElementById('fn-data').value = new Date().toISOString().split('T')[0];
  abrirModal('modal-notificacao');
}

async function salvarNotificacao() {
  const dados = {
    'Data': fData(document.getElementById('fn-data').value),
    'CNS/CPF': document.getElementById('fn-cnscpf').value,
    'Nome do Paciente': document.getElementById('fn-nome').value,
    'Agravo': document.getElementById('fn-agravo').value,
    'Tipo de Notificação': document.getElementById('fn-tipo').value,
    'Situação': document.getElementById('fn-situacao').value,
    'Observações': document.getElementById('fn-obs').value,
  };
  if (!dados['Nome do Paciente']) { showToast('Nome do paciente é obrigatório.', 'warn'); return; }
  await enviarFormulario(ABA_NOTIFICACOES, dados, 'modal-notificacao', () => fetchData());
}

// ==========================================
// FORMULÁRIO: NOVO CENSO
// ==========================================
function abrirFormCenso() {
  if (!temPermissao('editar')) { showToast('Sem permissão.', 'error'); return; }
  document.getElementById('form-censo').reset();
  document.getElementById('fc-data').value = new Date().toISOString().split('T')[0];
  abrirModal('modal-censo');
}

async function salvarCenso() {
  const dados = {
    'Data Internação': document.getElementById('fc-data').value,
    'Leito': document.getElementById('fc-leito').value,
    'CNS ou CPF': document.getElementById('fc-cnscpf').value,
    'Nome do Paciente': document.getElementById('fc-nome').value,
    'Médico': document.getElementById('fc-medico').value,
    'Diagnóstico': document.getElementById('fc-diag').value,
    'Situação': document.getElementById('fc-status').value
  };
  if (!dados['Leito'] || !dados['Nome do Paciente']) { showToast('Leito e Paciente são obrigatórios.', 'warn'); return; }
  await enviarFormulario(ABA_CENSO, dados, 'modal-censo', () => fetchData());
}

// ==========================================
// FORMULÁRIO: NOVA VIAGEM
// ==========================================
function abrirFormViagem() {
  if (!temPermissao('editar')) { showToast('Sem permissão.', 'error'); return; }
  document.getElementById('form-viagem').reset();
  document.getElementById('fvg-data').value = new Date().toLocaleDateString('pt-BR');
  abrirModal('modal-viagem');
}

async function salvarViagem() {
  const dados = {
    'Data': document.getElementById('fvg-data').value,
    'Hora Saída': document.getElementById('fvg-saida').value,
    'Hora Chegada': document.getElementById('fvg-chegada').value,
    'Veículo': document.getElementById('fvg-veiculo').value,
    'Motorista': document.getElementById('fvg-motorista').value,
    'Paciente / Responsável': document.getElementById('fvg-paciente').value,
    'Destino': document.getElementById('fvg-destino').value,
    'Finalidade': document.getElementById('fvg-finalidade').value,
    'Observações': document.getElementById('fvg-obs').value,
  };
  if (!dados['Motorista']) { showToast('Motorista é obrigatório.', 'warn'); return; }
  await enviarFormulario(ABA_VIAGENS, dados, 'modal-viagem', () => fetchData());
}
