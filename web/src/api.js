const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro na requisição (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Alunos
  listarAlunos: (ativo) => request(`/alunos${ativo !== undefined ? `?ativo=${ativo}` : ''}`),
  obterAluno: (id) => request(`/alunos/${id}`),
  criarAluno: (dados) => request('/alunos', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarAluno: (id, dados) => request(`/alunos/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerAluno: (id) => request(`/alunos/${id}`, { method: 'DELETE' }),

  // Aulas / presença
  listarAulas: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/aulas${qs ? `?${qs}` : ''}`);
  },
  registrarAula: (dados) => request('/aulas', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarAula: (id, dados) => request(`/aulas/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerAula: (id) => request(`/aulas/${id}`, { method: 'DELETE' }),

  // Pagamentos
  listarPagamentos: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/pagamentos${qs ? `?${qs}` : ''}`);
  },
  gerarCobrancas: (mes) => request('/pagamentos/gerar', { method: 'POST', body: JSON.stringify({ mes }) }),
  atualizarPagamento: (id, dados) => request(`/pagamentos/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerPagamento: (id) => request(`/pagamentos/${id}`, { method: 'DELETE' }),

  // Dashboard
  obterDashboard: (mes) => request(`/dashboard?mes=${mes}`),
};

export const TIPOS_ALUNO = {
  presencial_domicilio: 'Presencial (residência)',
  presencial_academia: 'Presencial (academia)',
  consultoria: 'Consultoria semi-presencial',
};

export const CANAIS_CAPTACAO = {
  indicacao: 'Indicação',
  instagram: 'Instagram',
  academia: 'Dentro da academia',
  anuncio: 'Anúncio pago',
  outro: 'Outro',
  nao_informado: 'Não informado',
};

export function mesAtual() {
  return new Date().toISOString().slice(0, 7);
}

export function formatarMoeda(valor) {
  return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarMesLabel(mes) {
  const [ano, m] = mes.split('-').map(Number);
  const data = new Date(ano, m - 1, 1);
  const texto = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function somarMes(mes, delta) {
  const [ano, m] = mes.split('-').map(Number);
  const data = new Date(ano, m - 1 + delta, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}
