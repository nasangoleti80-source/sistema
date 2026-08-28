const BASE = '/api';

export function getToken() {
  return localStorage.getItem('token') || '';
}

export function getSessao() {
  try {
    return JSON.parse(localStorage.getItem('sessao') || 'null');
  } catch {
    return null;
  }
}

export function salvarSessao(token, sessao) {
  localStorage.setItem('token', token);
  localStorage.setItem('sessao', JSON.stringify(sessao));
}

export function limparSessao() {
  localStorage.removeItem('token');
  localStorage.removeItem('sessao');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) {
    limparSessao();
    window.dispatchEvent(new Event('sessao-expirada'));
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro na requisição (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function requestUpload(path, formData) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (res.status === 401) {
    limparSessao();
    window.dispatchEvent(new Event('sessao-expirada'));
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro na requisição (${res.status})`);
  }
  return res.json();
}

export const api = {
  // Autenticação
  statusAuth: () => request('/auth/status'),
  setupTreinador: (senha) => request('/auth/setup-treinador', { method: 'POST', body: JSON.stringify({ senha }) }),
  loginTreinador: (senha) => request('/auth/login-treinador', { method: 'POST', body: JSON.stringify({ senha }) }),
  loginAluno: (usuario, senha) => request('/auth/login-aluno', { method: 'POST', body: JSON.stringify({ usuario, senha }) }),
  trocarSenhaTreinador: (senhaAtual, novaSenha) =>
    request('/auth/trocar-senha-treinador', { method: 'POST', body: JSON.stringify({ senhaAtual, novaSenha }) }),
  redefinirSenhaAluno: (alunoId) => request(`/alunos/${alunoId}/redefinir-senha`, { method: 'POST' }),

  // Avaliações
  listarAvaliacoes: (alunoId) => request(`/avaliacoes?alunoId=${alunoId}`),
  criarAvaliacao: (dados) => request('/avaliacoes', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarAvaliacao: (id, dados) => request(`/avaliacoes/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerAvaliacao: (id) => request(`/avaliacoes/${id}`, { method: 'DELETE' }),
  enviarFoto: (avaliacaoId, alunoId, arquivo, tipo) => {
    const fd = new FormData();
    fd.append('foto', arquivo);
    fd.append('tipo', tipo);
    return requestUpload(`/avaliacoes/${avaliacaoId}/fotos/${alunoId}`, fd);
  },
  atualizarFoto: (avaliacaoId, fotoId, dados) =>
    request(`/avaliacoes/${avaliacaoId}/fotos/${fotoId}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerFoto: (avaliacaoId, fotoId) => request(`/avaliacoes/${avaliacaoId}/fotos/${fotoId}`, { method: 'DELETE' }),
  urlFoto: (alunoId, arquivo) => `${BASE}/avaliacoes/fotos/${alunoId}/${arquivo}?token=${encodeURIComponent(getToken())}`,

  // Treinos
  obterTreino: (alunoId) => request(`/treinos?alunoId=${alunoId}`),
  salvarTreino: (alunoId, dados) => request(`/treinos/${alunoId}`, { method: 'PUT', body: JSON.stringify(dados) }),

  // Chat (treinadora)
  listarConversas: () => request('/mensagens'),
  naoLidasTreinador: () => request('/mensagens/nao-lidas'),
  obterConversa: (alunoId) => request(`/mensagens/${alunoId}`),
  enviarMensagem: (alunoId, texto) => request(`/mensagens/${alunoId}`, { method: 'POST', body: JSON.stringify({ texto }) }),
  enviarMensagemMidia: (alunoId, arquivo) => {
    const fd = new FormData();
    fd.append('arquivo', arquivo);
    return requestUpload(`/mensagens/${alunoId}/midia`, fd);
  },

  // Banco de alimentos
  listarGruposAlimentos: () => request('/alimentos'),
  criarGrupoAlimentos: (nome) => request('/alimentos', { method: 'POST', body: JSON.stringify({ nome }) }),
  renomearGrupoAlimentos: (id, nome) => request(`/alimentos/${id}`, { method: 'PUT', body: JSON.stringify({ nome }) }),
  removerGrupoAlimentos: (id) => request(`/alimentos/${id}`, { method: 'DELETE' }),
  adicionarItemAlimento: (grupoId, dados) => request(`/alimentos/${grupoId}/itens`, { method: 'POST', body: JSON.stringify(dados) }),
  removerItemAlimento: (grupoId, itemId) => request(`/alimentos/${grupoId}/itens/${itemId}`, { method: 'DELETE' }),

  // Dieta
  obterDieta: (alunoId) => request(`/dietas?alunoId=${alunoId}`),
  salvarDieta: (alunoId, dados) => request(`/dietas/${alunoId}`, { method: 'PUT', body: JSON.stringify(dados) }),

  // Vídeos Premium
  listarVideos: () => request('/videos'),
  criarVideo: (titulo, descricao, categoria, arquivo) => {
    const fd = new FormData();
    fd.append('titulo', titulo);
    fd.append('descricao', descricao);
    fd.append('categoria', categoria);
    fd.append('arquivo', arquivo);
    return requestUpload('/videos', fd);
  },
  removerVideo: (id) => request(`/videos/${id}`, { method: 'DELETE' }),

  // Planos e preços
  listarPlanos: () => request('/planos'),
  criarPlano: (nome) => request('/planos', { method: 'POST', body: JSON.stringify({ nome }) }),
  renomearPlano: (id, nome) => request(`/planos/${id}`, { method: 'PUT', body: JSON.stringify({ nome }) }),
  removerPlano: (id) => request(`/planos/${id}`, { method: 'DELETE' }),
  salvarPrecoPlano: (id, periodicidade, dados) =>
    request(`/planos/${id}/precos/${periodicidade}`, { method: 'PUT', body: JSON.stringify(dados) }),

  // Portal do aluno
  meuTreino: () => request('/meu/treino'),
  minhaEvolucao: () => request('/meu/evolucao'),
  minhaDieta: () => request('/meu/dieta'),
  meuPremium: () => request('/meu/premium'),
  meuChat: () => request('/meu/mensagens'),
  minhasNaoLidas: () => request('/meu/mensagens/nao-lidas'),
  enviarMinhaMensagem: (texto) => request('/meu/mensagens', { method: 'POST', body: JSON.stringify({ texto }) }),
  enviarMinhaMidia: (arquivo) => {
    const fd = new FormData();
    fd.append('arquivo', arquivo);
    return requestUpload('/meu/mensagens/midia', fd);
  },

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

export const PERIODICIDADES = {
  mensal: 'Mensal',
  bimestral: 'Bimestral',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
};

export const CATEGORIAS_VIDEO = {
  cardio: 'Cardio',
  gluteos: 'Glúteos',
  tecnica: 'Como fazer o exercício',
  ajustes: 'Ajustes de postura',
  dicas: 'Dicas',
  desafio: 'Desafio da semana',
};

export const STATUS_AULA = {
  presente: 'Presente',
  falta: 'Falta',
  reposicao: 'Reposição',
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
