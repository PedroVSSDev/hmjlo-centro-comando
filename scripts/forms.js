// ============================================================
//  FORMULÁRIOS DE CADASTRO — Centro de Comando HMJLO
//  Arquivo: scripts/forms.js
// ============================================================

// ==========================================
// ENVIO GENÉRICO PARA O APPS SCRIPT
// ==========================================
window.modoEdicao = false;
window.linhaEdicao = null;

async function enviarFormulario(aba, dados, modalId, callback, action = 'adicionar_linha', rowIndex = null) {
  if (!temPermissao('editar')) {
    showToast('Você não tem permissão para isso.', 'error');
    return;
  }
  
  const token = localStorage.getItem('hmjlo_token');
  const payload = { action, aba, dados, token };
  if (rowIndex) payload.rowIndex = rowIndex;

  const btnText = document.querySelector(`#${modalId} button[type="submit"]`)?.textContent;
  const btn = document.querySelector(`#${modalId} button[type="submit"]`);
  if (btn) btn.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Processando...';

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    
    if (btn) btn.textContent = btnText;

    if (result.ok) {
      showToast(result.mensagem || 'Operação realizada com sucesso!', 'success');
      fecharModal(modalId);
      if (callback) callback();
      
      // Limpar modo de edição
      window.modoEdicao = false;
      window.linhaEdicao = null;
    } else {
      showToast(result.erro || 'Erro ao processar', 'error');
    }
  } catch (err) {
    if (btn) btn.textContent = btnText;
    showToast('Erro de conexão. Tente novamente.', 'error');
  }
}

async function excluirRegistro(aba, rowIndex, callback) {
  if (!temPermissao('editar')) {
    showToast('Sem permissão para excluir.', 'error');
    return;
  }
  if (!confirm('Tem certeza que deseja EXCLUIR este registro permanentemente?')) return;

  const token = localStorage.getItem('hmjlo_token');
  const payload = { action: 'excluir_linha', aba, rowIndex, token };

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.ok) {
      showToast('Registro excluído com sucesso!', 'success');
      if (callback) callback();
    } else {
      showToast(result.erro || 'Erro ao excluir.', 'error');
    }
  } catch (err) {
    showToast('Erro de conexão.', 'error');
  }
}


// ==========================================
// PREENCHER FORMULÁRIO PARA EDIÇÃO
// ==========================================
window.preencherFormularioEditar = function(aba, rowIndex) {
  if (!temPermissao('editar')) { showToast('Sem permissão para editar.', 'error'); return; }
  
  const linha = rawData[aba].find(r => r._rowIndex === rowIndex);
  if (!linha) { showToast('Registro não encontrado.', 'error'); return; }

  window.modoEdicao = true;
  window.linhaEdicao = rowIndex;

  if (aba === 'pacientes') {
    document.getElementById('fp-codigo').value = linha['Código Cadastro'] || '';
    document.getElementById('fp-nome').value = linha['Nome do Paciente'] || '';
    if (linha['Data Nascimento']) {
      const parts = linha['Data Nascimento'].split('/');
      if(parts.length===3) document.getElementById('fp-nascimento').value = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    document.getElementById('fp-cns').value = linha['CNS'] || '';
    document.getElementById('fp-cpf').value = linha['CPF'] || '';
    document.getElementById('fp-sexo').value = linha['Sexo'] || 'M';
    document.getElementById('fp-mae').value = linha['Nome da Mãe'] || '';
    document.getElementById('fp-cidade').value = linha['CIdade'] || '';
    document.getElementById('fp-contato').value = linha['Contato'] || '';
    abrirModal('modal-paciente');
  } 
  else if (aba === 'ambulancias') {
    document.getElementById('fa-data').value = linha['Data'] || '';
    document.getElementById('fa-veiculo').value = linha['Ambulância'] || '';
    document.getElementById('fa-hora-saida').value = linha['Hora Saída'] || '';
    document.getElementById('fa-hora-chegada').value = linha['Hora Chegada'] || '';
    document.getElementById('fa-condutor').value = linha['Condutor'] || '';
    document.getElementById('fa-paciente').value = linha['Nome do Paciente'] || '';
    document.getElementById('fa-local').value = linha['Local Ocorrência'] || '';
    document.getElementById('fa-tipo-local').value = linha['Tipo de Local'] || '';
    document.getElementById('fa-situacao').value = linha['Situação da Ocorrência'] || 'Concluída';
    abrirModal('modal-ambulancia');
  }
  else if (aba === 'vacinas') {
    document.getElementById('fv-mes').value = linha['Mês referência'] || '';
    document.getElementById('fv-codigo').value = linha['Código da aplicação'] || '';
    document.getElementById('fv-nome').value = linha['Nome do Paciente'] || '';
    document.getElementById('fv-cnscpf').value = linha['CNS ou CPF'] || '';
    if (linha['Data Nasc.']) {
      const parts = linha['Data Nasc.'].split('/');
      if(parts.length===3) document.getElementById('fv-nasc').value = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    document.getElementById('fv-motivo').value = linha['Motivo'] || '';
    document.getElementById('fv-aplicador').value = linha['Profissional Aplicador'] || '';
    abrirModal('modal-vacina');
  }
  else if (aba === 'notificacoes') {
    if (linha['Data']) {
      const parts = linha['Data'].split('/');
      if(parts.length===3) document.getElementById('fn-data').value = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    document.getElementById('fn-cnscpf').value = linha['CNS/CPF'] || '';
    document.getElementById('fn-nome').value = linha['Nome do Paciente'] || '';
    document.getElementById('fn-agravo').value = linha['Agravo'] || '';
    document.getElementById('fn-tipo').value = linha['Tipo de Notificação'] || '';
    document.getElementById('fn-situacao').value = linha['Situação'] || 'Aberta';
    document.getElementById('fn-obs').value = linha['Observações'] || '';
    abrirModal('modal-notificacao');
  }
  else if (aba === 'censo') {
    if(linha['Data Internação']) document.getElementById('fc-data').value = linha['Data Internação'].split('/').reverse().join('-');
    document.getElementById('fc-leito').value = linha['Leito'] || '';
    document.getElementById('fc-nome').value = linha['Nome do Paciente'] || '';
    document.getElementById('fc-cnscpf').value = linha['CNS ou CPF'] || '';
    document.getElementById('fc-medico').value = linha['Médico'] || '';
    document.getElementById('fc-diag').value = linha['Diagnóstico'] || '';
    document.getElementById('fc-status').value = linha['Situação'] || 'Internado';
    abrirModal('modal-censo');
  }
  else if (aba === 'viagens') {
    document.getElementById('fvg-data').value = linha['Data'] || '';
    document.getElementById('fvg-veiculo').value = linha['Veículo'] || '';
    document.getElementById('fvg-saida').value = linha['Hora Saída'] || '';
    document.getElementById('fvg-chegada').value = linha['Hora Chegada'] || '';
    document.getElementById('fvg-motorista').value = linha['Motorista'] || '';
    document.getElementById('fvg-paciente').value = linha['Paciente / Responsável'] || '';
    document.getElementById('fvg-destino').value = linha['Destino'] || '';
    document.getElementById('fvg-finalidade').value = linha['Finalidade'] || '';
    document.getElementById('fvg-obs').value = linha['Observações'] || '';
    abrirModal('modal-viagem');
  }
  else if (aba === 'obstetricia') {
    document.getElementById('fob-registro').value = linha['Número Registro'] || '';
    document.getElementById('fob-data').value = linha['Data admissão'] || '';
    document.getElementById('fob-nome').value = linha['Nome da Paciente'] || '';
    document.getElementById('fob-hora').value = linha['Hora do Parto'] || '';
    document.getElementById('fob-tipo').value = linha['Tipo de Parto'] || 'Normal';
    document.getElementById('fob-sexorn').value = linha['Sexo RN'] || 'Indefinido';
    document.getElementById('fob-resp').value = linha['Responsável pelo parto'] || '';
    document.getElementById('fob-dnv').value = linha['DNV'] || '';
    abrirModal('modal-obstetricia');
  }
  // Para outras abas dinâmicas, mostraremos um aviso
  else {
    showToast('A edição para esta aba não está totalmente configurada ainda.', 'warn');
  }
};

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
  if (!dados['Nome do Paciente']) { showToast('Nome é obrigatório.', 'warn'); return; }
  
  const action = window.modoEdicao ? 'editar_linha' : 'adicionar_linha';
  await enviarFormulario(ABA_PACIENTES, dados, 'modal-paciente', () => fetchData(), action, window.linhaEdicao);
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
  
  const action = window.modoEdicao ? 'editar_linha' : 'adicionar_linha';
  await enviarFormulario(ABA_AMBULANCIAS, dados, 'modal-ambulancia', () => fetchData(), action, window.linhaEdicao);
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
  if (!dados['Nome do Paciente']) { showToast('Nome é obrigatório.', 'warn'); return; }
  
  const action = window.modoEdicao ? 'editar_linha' : 'adicionar_linha';
  await enviarFormulario(ABA_VACINAS, dados, 'modal-vacina', () => fetchData(), action, window.linhaEdicao);
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
  if (!dados['Nome do Paciente']) { showToast('Nome é obrigatório.', 'warn'); return; }
  
  const action = window.modoEdicao ? 'editar_linha' : 'adicionar_linha';
  await enviarFormulario(ABA_NOTIFICACOES, dados, 'modal-notificacao', () => fetchData(), action, window.linhaEdicao);
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
  
  const action = window.modoEdicao ? 'editar_linha' : 'adicionar_linha';
  await enviarFormulario(ABA_CENSO, dados, 'modal-censo', () => fetchData(), action, window.linhaEdicao);
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
  
  const action = window.modoEdicao ? 'editar_linha' : 'adicionar_linha';
  await enviarFormulario(ABA_VIAGENS, dados, 'modal-viagem', () => fetchData(), action, window.linhaEdicao);
}

// ==========================================
// FORMULÁRIO: NOVA OCORRÊNCIA OBSTÉTRICA
// ==========================================
function abrirFormObstetricia() {
  if (!temPermissao('editar')) { showToast('Sem permissão.', 'error'); return; }
  document.getElementById('form-obstetricia').reset();
  document.getElementById('fob-data').value = new Date().toLocaleDateString('pt-BR');
  abrirModal('modal-obstetricia');
}

async function salvarObstetricia() {
  const dados = {
    'Número Registro': document.getElementById('fob-registro').value,
    'Data admissão': document.getElementById('fob-data').value,
    'Nome da Paciente': document.getElementById('fob-nome').value,
    'Hora do Parto': document.getElementById('fob-hora').value,
    'Tipo de Parto': document.getElementById('fob-tipo').value,
    'Sexo RN': document.getElementById('fob-sexorn').value,
    'Responsável pelo parto': document.getElementById('fob-resp').value,
    'DNV': document.getElementById('fob-dnv').value,
  };
  if (!dados['Nome da Paciente']) { showToast('Nome da paciente é obrigatório.', 'warn'); return; }
  
  const action = window.modoEdicao ? 'editar_linha' : 'adicionar_linha';
  await enviarFormulario(ABA_OBSTETRICIA, dados, 'modal-obstetricia', () => fetchData(), action, window.linhaEdicao);
}

