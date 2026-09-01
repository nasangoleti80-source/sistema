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

  // Avaliações físicas
  listarAvaliacoes: (alunoId) => request(`/avaliacoes${alunoId ? `?alunoId=${alunoId}` : ''}`),
  criarAvaliacao: (dados) => request('/avaliacoes', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarAvaliacao: (id, dados) => request(`/avaliacoes/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerAvaliacao: (id) => request(`/avaliacoes/${id}`, { method: 'DELETE' }),

  // Exercícios
  listarExercicios: () => request('/exercicios'),
  criarExercicio: (dados) => request('/exercicios', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarExercicio: (id, dados) => request(`/exercicios/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerExercicio: (id, confirmar) =>
    request(`/exercicios/${id}${confirmar ? '?confirmar=true' : ''}`, { method: 'DELETE' }),
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

  // Treinos (musculação)
  listarTreinos: (alunoId) => request(`/treinos${alunoId ? `?alunoId=${alunoId}` : ''}`),
  obterTreino: (id) => request(`/treinos/${id}`),
  criarTreino: (dados) => request('/treinos', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarTreino: (id, dados) => request(`/treinos/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerTreino: (id) => request(`/treinos/${id}`, { method: 'DELETE' }),
  gerarTreinoIA: (dados) => request('/treinos/gerar-ia', { method: 'POST', body: JSON.stringify(dados) }),

  // Endurance
  listarEndurance: (alunoId) => request(`/endurance${alunoId ? `?alunoId=${alunoId}` : ''}`),
  criarEndurance: (dados) => request('/endurance', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarEndurance: (id, dados) => request(`/endurance/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerEndurance: (id) => request(`/endurance/${id}`, { method: 'DELETE' }),
  gerarEnduranceIA: (dados) => request('/endurance/gerar-ia', { method: 'POST', body: JSON.stringify(dados) }),

  // Registros de treino realizado
  listarRegistrosTreino: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/registros-treino${qs ? `?${qs}` : ''}`);
  },
  historicoCarga: (alunoId, exercicioNome) =>
    request(`/registros-treino/historico-carga?alunoId=${alunoId}&exercicioNome=${encodeURIComponent(exercicioNome)}`),
  registrarTreino: (dados) => request('/registros-treino', { method: 'POST', body: JSON.stringify(dados) }),
  removerRegistroTreino: (id) => request(`/registros-treino/${id}`, { method: 'DELETE' }),

  // Pacotes / planos financeiros
  listarPacotes: (alunoId) => request(`/pacotes${alunoId ? `?alunoId=${alunoId}` : ''}`),
  criarPacote: (dados) => request('/pacotes', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarPacote: (id, dados) => request(`/pacotes/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerPacote: (id) => request(`/pacotes/${id}`, { method: 'DELETE' }),

  // Mensagens
  listarMensagens: (alunoId) => request(`/mensagens?alunoId=${alunoId}`),
  enviarMensagem: (dados) => request('/mensagens', { method: 'POST', body: JSON.stringify(dados) }),

  // Dietas
  listarDietas: (alunoId) => request(`/dietas?alunoId=${alunoId}`),
  criarDieta: (dados) => request('/dietas', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarDieta: (id, dados) => request(`/dietas/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerDieta: (id) => request(`/dietas/${id}`, { method: 'DELETE' }),
};

export const TIPOS_ALUNO = {
  presencial: 'Presencial',
  consultoria_online: 'Consultoria online',
  consultoria_semipresencial: 'Consultoria semi-presencial',
  consultoria_online_treino_dieta: 'Consultoria online (treino + dieta)',
  dieta: 'Dieta',
};

export const PERIODICIDADES = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
};

const MESES_POR_PERIODICIDADE = { mensal: 1, trimestral: 3, semestral: 6, anual: 12 };

export function calcularVencimentoPlano(dataInicio, periodicidade) {
  if (!dataInicio) return '';
  const meses = MESES_POR_PERIODICIDADE[periodicidade] || 1;
  const [ano, mes, dia] = dataInicio.split('-').map(Number);
  const data = new Date(ano, mes - 1 + meses, dia);
  return data.toISOString().slice(0, 10);
}

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

export const NIVEIS_ATIVIDADE = {
  sedentario: 'Sedentário', leve: 'Leve', moderado: 'Moderado', intenso: 'Intenso',
};

export const GRUPOS_MUSCULARES = {
  peito: 'Peito', costas: 'Costas', ombro: 'Ombro', biceps: 'Bíceps', triceps: 'Tríceps',
  antebraco: 'Antebraço', quadriceps: 'Quadríceps', posterior: 'Posterior de coxa',
  gluteo: 'Glúteo', panturrilha: 'Panturrilha', abdomen: 'Abdômen', cardio: 'Cardio/Aeróbio', outro: 'Outro',
};

export const METODOS_TREINO = {
  convencional: 'Convencional', cluster_set: 'Cluster-set', rest_pause: 'Rest-pause',
  drop_set: 'Drop-set', tri_set: 'Tri-set', bi_set: 'Bi-set (super-série)',
  piramide: 'Pirâmide', german_volume: 'German Volume Training', isometria: 'Isometria',
  excentrica: 'Ênfase excêntrica',
};

export const OBJETIVOS_TREINO = { hipertrofia: 'Hipertrofia', emagrecimento: 'Emagrecimento', saude: 'Saúde/condicionamento' };
export const TIPOS_PERIODIZACAO = { linear: 'Linear', ondulatoria: 'Ondulatória', linear_inversa: 'Linear inversa', blocos: 'Blocos' };
export const NIVEIS_ALUNO = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado', atleta: 'Atleta' };
export const DIVISOES_TREINO = { full_body: 'Full body', AB: 'AB', ABC: 'ABC', ABCD: 'ABCD', ABCDE: 'ABCDE' };
export const DURACOES_SESSAO = [30, 45, 60, 75];
export const SEMANAS_MESOCICLO = [4, 5, 6];
export const MODALIDADES_TREINO = { musculacao: 'Musculação', peso_corpo: 'Peso do corpo', hibrido: 'Híbrido' };
export const OPCOES_AEROBIO = { automatico: 'Automático', incluir: 'Incluir', sem: 'Sem aeróbio' };

export const NIVEIS_ENDURANCE = { iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado', elite: 'Elite' };
export const MODALIDADES_ENDURANCE = { corrida: 'Corrida', ciclismo: 'Ciclismo', natacao: 'Natação', triathlon: 'Triathlon' };
export const OBJETIVOS_ENDURANCE = {
  '5k': '5km', '10k': '10km', '15k': '15km', meia_maratona: 'Meia maratona (21km)',
  maratona: 'Maratona (42,2km)', ultra_50: 'Ultra 50km', ultra_100: 'Ultra 100km', base: 'Base, sem prova',
};
export const PERIODIZACOES_ENDURANCE = { linear: 'Linear (progressão constante)', blocos: 'Blocos (múltiplos picos)', polarizado: 'Polarizado', '80_20': '80/20' };
export const DIAS_SEMANA = { segunda: 'Segunda', terca: 'Terça', quarta: 'Quarta', quinta: 'Quinta', sexta: 'Sexta', sabado: 'Sábado', domingo: 'Domingo' };

export const INTENSIDADES_TREINO = { leve: 'Leve', moderada: 'Moderada', intensa: 'Intensa', muito_intensa: 'Muito intensa' };

export const FORMAS_PAGAMENTO = { pix: 'PIX', cartao: 'Cartão de crédito (parcelado)', dinheiro: 'Dinheiro' };

export function formatarData(data) {
  if (!data) return '';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}


/* ------------------------------------------------------------------ volume */

/**
 * Séries por grupo muscular no treino inteiro. Nos treinos daqui o exercício é
 * guardado pelo nome, e o grupo vem junto no próprio item — então a conta não
 * depende do catálogo.
 */
export function volumeDoTreino(treino) {
  const total = {};
  for (const dia of treino.dias || []) {
    for (const ex of dia.exercicios || []) {
      const grupo = ex.grupoMuscular || 'outro';
      total[grupo] = (total[grupo] || 0) + (Number(ex.series) || 0);
    }
  }
  return Object.entries(total).sort((a, b) => b[1] - a[1]);
}

/** Séries por grupo em um dia só. */
export function volumeDoDia(dia) {
  const total = {};
  for (const ex of dia.exercicios || []) {
    const grupo = ex.grupoMuscular || 'outro';
    total[grupo] = (total[grupo] || 0) + (Number(ex.series) || 0);
  }
  return Object.entries(total).sort((a, b) => b[1] - a[1]);
}

/** Faixa de referência para hipertrofia: 10 a 20 séries por grupo na semana. */
export const FAIXA_HIPERTROFIA = { minimo: 10, maximo: 20 };

/**
 * Liga o exercício do treino ao catálogo pelo nome, para puxar foto, vídeo e a
 * dica de onde o aparelho fica. Comparação sem acento e sem caixa, porque o
 * nome vem digitado à mão ou gerado pela IA.
 */
const normalizar = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // tira acento
    .replace(/\s+/g, ' ')               // "puxada  alta" vira "puxada alta"
    .toLowerCase()
    .trim();

export function indexarCatalogo(exercicios) {
  return new Map(exercicios.map((e) => [normalizar(e.nome), e]));
}

export function acharNoCatalogo(indice, nome) {
  return indice.get(normalizar(nome)) || null;
}

/** A imagem que representa o exercício: capa do vídeo, ou a primeira foto. */
export function capaDoExercicio(exercicio) {
  if (!exercicio?.midia?.length) return null;
  const foto = exercicio.midia.find((m) => m.tipo === 'foto');
  const item = foto || exercicio.midia[0];
  return `/midia/${item.capa || item.arquivo}`;
}

export function formatarTamanho(bytes) {
  if (!bytes) return '';
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}
