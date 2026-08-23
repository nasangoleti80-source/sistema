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

  // Exercícios
  listarExercicios: (grupo) => request(`/exercicios${grupo ? `?grupo=${grupo}` : ''}`),
  criarExercicio: (dados) => request('/exercicios', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarExercicio: (id, dados) => request(`/exercicios/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerExercicio: (id) => request(`/exercicios/${id}`, { method: 'DELETE' }),
  removerMidia: (id, midiaId) => request(`/exercicios/${id}/midia/${midiaId}`, { method: 'DELETE' }),

  /** O corpo é o arquivo cru — o servidor grava em fluxo, sem carregar na memória. */
  enviarMidia: (id, blob, { legenda = '', capaDe } = {}) => {
    const qs = new URLSearchParams();
    if (legenda) qs.set('legenda', legenda);
    if (capaDe) qs.set('capaDe', capaDe);
    return request(`/exercicios/${id}/midia${qs.toString() ? `?${qs}` : ''}`, {
      method: 'POST',
      headers: { 'Content-Type': blob.type },
      body: blob,
    });
  },

  // Treinos
  listarTreinos: (alunoId) => request(`/treinos${alunoId ? `?alunoId=${alunoId}` : ''}`),
  obterTreino: (id) => request(`/treinos/${id}`),
  criarTreino: (dados) => request('/treinos', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarTreino: (id, dados) => request(`/treinos/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerTreino: (id) => request(`/treinos/${id}`, { method: 'DELETE' }),
  duplicarTreino: (id, dados = {}) => request(`/treinos/${id}/duplicar`, { method: 'POST', body: JSON.stringify(dados) }),

  criarSessao: (treinoId, dados) => request(`/treinos/${treinoId}/sessoes`, { method: 'POST', body: JSON.stringify(dados) }),
  atualizarSessao: (treinoId, sessaoId, dados) =>
    request(`/treinos/${treinoId}/sessoes/${sessaoId}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerSessao: (treinoId, sessaoId) => request(`/treinos/${treinoId}/sessoes/${sessaoId}`, { method: 'DELETE' }),

  criarItem: (treinoId, sessaoId, dados) =>
    request(`/treinos/${treinoId}/sessoes/${sessaoId}/itens`, { method: 'POST', body: JSON.stringify(dados) }),
  atualizarItem: (treinoId, sessaoId, itemId, dados) =>
    request(`/treinos/${treinoId}/sessoes/${sessaoId}/itens/${itemId}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerItem: (treinoId, sessaoId, itemId) =>
    request(`/treinos/${treinoId}/sessoes/${sessaoId}/itens/${itemId}`, { method: 'DELETE' }),
  reordenarItens: (treinoId, sessaoId, ordem) =>
    request(`/treinos/${treinoId}/sessoes/${sessaoId}/ordem`, { method: 'PUT', body: JSON.stringify({ ordem }) }),
};

export const GRUPOS_MUSCULARES = {
  peitoral: 'Peitoral',
  dorsais: 'Dorsais',
  ombros: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  quadriceps: 'Quadríceps',
  posteriores: 'Posteriores de coxa',
  gluteo: 'Glúteo',
  panturrilha: 'Panturrilha',
  abdomen: 'Abdômen',
  cardio: 'Cardio',
  outro: 'Outro',
};

export const EQUIPAMENTOS = {
  maquina: 'Máquina',
  polia: 'Polia / cabo',
  barra: 'Barra',
  halter: 'Halter',
  peso_corpo: 'Peso do corpo',
  elastico: 'Elástico',
  livre: 'Sem equipamento',
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

/** Semana começando na segunda, como a academia pensa. 0 é domingo no JS. */
export const DIAS_SEMANA = [
  { valor: 1, letra: 'S', nome: 'Segunda' },
  { valor: 2, letra: 'T', nome: 'Terça' },
  { valor: 3, letra: 'Q', nome: 'Quarta' },
  { valor: 4, letra: 'Q', nome: 'Quinta' },
  { valor: 5, letra: 'S', nome: 'Sexta' },
  { valor: 6, letra: 'S', nome: 'Sábado' },
  { valor: 0, letra: 'D', nome: 'Domingo' },
];

/**
 * Séries por grupo muscular na semana — a conta que diz se o treino está
 * equilibrado. Uma sessão que roda duas vezes na semana conta duas vezes.
 *
 * A faixa de 10 a 20 séries semanais por grupo é a referência usual para
 * hipertrofia; abaixo disso o estímulo costuma ser pouco.
 */
export function volumeSemanal(treino, exercicios) {
  const porId = new Map(exercicios.map((e) => [e.id, e]));
  const total = {};
  for (const sessao of treino.sessoes) {
    const vezes = Math.max(1, sessao.dias.length);
    for (const item of sessao.itens) {
      const grupo = porId.get(item.exercicioId)?.grupo || 'outro';
      total[grupo] = (total[grupo] || 0) + item.series * vezes;
    }
  }
  return Object.entries(total).sort((a, b) => b[1] - a[1]);
}

/** Séries por grupo dentro de uma sessão só. */
export function volumeSessao(sessao, exercicios) {
  const porId = new Map(exercicios.map((e) => [e.id, e]));
  const total = {};
  for (const item of sessao.itens) {
    const grupo = porId.get(item.exercicioId)?.grupo || 'outro';
    total[grupo] = (total[grupo] || 0) + item.series;
  }
  return Object.entries(total).sort((a, b) => b[1] - a[1]);
}

/** Estimativa grosseira, só para ela ter noção do tempo em quadra. */
export function duracaoEstimada(sessao) {
  const segundos = sessao.itens.reduce(
    (soma, i) => soma + i.series * (40 + (i.descanso || 0)),
    0
  );
  return Math.round(segundos / 60);
}

export function formatarTamanho(bytes) {
  if (!bytes) return '';
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export function somarMes(mes, delta) {
  const [ano, m] = mes.split('-').map(Number);
  const data = new Date(ano, m - 1 + delta, 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}
