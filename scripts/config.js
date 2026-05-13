// ============================================================
//  CONFIGURAÇÃO — Centro de Comando HMJLO
//  Arquivo: scripts/config.js
//
//  ⚠️ ATENÇÃO: Após implantar o Apps Script, cole a URL
//  gerada no campo APPS_SCRIPT_URL abaixo.
// ============================================================

// ID da planilha principal
const SHEET_ID = "1EaupCiKZHv1LI6x0jDQVGAjCPV5g63s2k3l00581C1A";

// URL do Apps Script (preencha após a implantação)
// Exemplo: "https://script.google.com/macros/s/XXXXX/exec"
// ▼▼▼ COLE SUA URL AQUI (entre as aspas) ▼▼▼
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwu55lICRjlktgMZn161Rax2dwpq4qIHeqYA1aYOd6d5v4mHRaqRIMQ_yjLa9tFxI6OLA/exec"
// Exemplo: const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycb.../exec";

// GIDs de cada aba da planilha
const GID_PACIENTES = "1383837979";
const GID_VACINAS = "0";
const GID_AMBULANCIAS = "1792104572";
const GID_NOTIFICACOES = "2102365928";
const GID_SOLUCOES = "206556296";
const GID_CENSO = "914372478";
const GID_EXTRAS = "1794923732";
const GID_VIAGENS = "1083527311";
const GID_FUNCIONARIOS = ""; // ← Preencha o GID da aba Funcionários

// Nomes exatos das abas na planilha (para escrita via Apps Script)
const ABA_PACIENTES = "Pacientes";
const ABA_VACINAS = "Vacina DT";
const ABA_AMBULANCIAS = "Resgates Ambulância";
const ABA_NOTIFICACOES = "Notificações";
const ABA_SOLUCOES = "Soluções s/ Regulação";
const ABA_CENSO = "Censo Hospitalar";
const ABA_EXTRAS = "Extras";
const ABA_VIAGENS = "Viagens";
const ABA_FUNCIONARIOS = "Funcionários HMJLO";

// Limite de linhas por página nas tabelas
const LIMITE_TABELA = 50;

// SLA de tempo para alerta de ambulância (em minutos)
const SLA_AMBULANCIA_MINUTOS = 120;

// Intervalo de auto-refresh (em milissegundos): 5 minutos
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;

// Monta a URL de exportação CSV de uma aba
const getURL = (gid) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
