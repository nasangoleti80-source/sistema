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
  /** Gera várias aulas de uma vez, num padrão de dias da semana dentro de um período. */
  programarAulas: (dados) => request('/aulas/programar', { method: 'POST', body: JSON.stringify(dados) }),

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
  obterHistoricoFinanceiro: () => request('/dashboard/historico'),

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
  removerMensagem: (id) => request(`/mensagens/${id}`, { method: 'DELETE' }),

  /** Foto ou vídeo dentro da conversa — mesmo envio em fluxo cru usado nos exercícios. */
  enviarMidiaMensagem: (id, blob, { capaDe } = {}) => {
    const qs = new URLSearchParams();
    if (capaDe) qs.set('capaDe', 'true');
    return request(`/mensagens/${id}/midia${qs.toString() ? `?${qs}` : ''}`, {
      method: 'POST',
      headers: { 'Content-Type': blob.type },
      body: blob,
    });
  },

  // Dietas
  listarDietas: (alunoId) => request(`/dietas?alunoId=${alunoId}`),
  criarDieta: (dados) => request('/dietas', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarDieta: (id, dados) => request(`/dietas/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerDieta: (id) => request(`/dietas/${id}`, { method: 'DELETE' }),

  // Alimentos (catálogo para montar as dietas)
  listarAlimentos: (params) => request(`/alimentos${params ? `?${new URLSearchParams(params)}` : ''}`),
  buscarNaTabela: (q, fonte) =>
    request(`/tabelas?${new URLSearchParams({ q, ...(fonte ? { fonte } : {}) })}`),
  listarFontesTabela: () => request('/tabelas/fontes'),
  criarAlimento: (dados) => request('/alimentos', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarAlimento: (id, dados) => request(`/alimentos/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerAlimento: (id) => request(`/alimentos/${id}`, { method: 'DELETE' }),

  // Grupos de troca (blocos prontos de substituição reaproveitáveis num item)
  listarGruposTroca: () => request('/grupos-troca'),
  criarGrupoTroca: (dados) => request('/grupos-troca', { method: 'POST', body: JSON.stringify(dados) }),
  removerGrupoTroca: (id) => request(`/grupos-troca/${id}`, { method: 'DELETE' }),

  // Bancos de opções (grupos de refeições completas intercambiáveis)
  listarBancosOpcoes: () => request('/bancos-opcoes'),
  criarBancoOpcoes: (dados) => request('/bancos-opcoes', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarBancoOpcoes: (id, dados) => request(`/bancos-opcoes/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerBancoOpcoes: (id) => request(`/bancos-opcoes/${id}`, { method: 'DELETE' }),

  // Modelos de dieta reutilizáveis
  listarModelosDieta: () => request('/modelos-dieta'),
  criarModeloDieta: (dados) => request('/modelos-dieta', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarModeloDieta: (id, dados) => request(`/modelos-dieta/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerModeloDieta: (id) => request(`/modelos-dieta/${id}`, { method: 'DELETE' }),

  // Conteúdos (vídeos estilo "Netflix" para os alunos)
  listarConteudos: () => request('/conteudos'),
  criarConteudo: (dados) => request('/conteudos', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarConteudo: (id, dados) => request(`/conteudos/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerConteudo: (id) => request(`/conteudos/${id}`, { method: 'DELETE' }),

  // Planos (vitrine de preços do PlayFlix)
  listarPlanos: () => request('/planos'),
  criarPlano: (dados) => request('/planos', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarPlano: (id, dados) => request(`/planos/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerPlano: (id) => request(`/planos/${id}`, { method: 'DELETE' }),

  // Desafios (treino ou dieta, por prazo)
  listarDesafios: (alunoId) => request(`/desafios${alunoId ? `?alunoId=${alunoId}` : ''}`),
  criarDesafio: (dados) => request('/desafios', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarDesafio: (id, dados) => request(`/desafios/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerDesafio: (id) => request(`/desafios/${id}`, { method: 'DELETE' }),

  // Anotações particulares sobre o aluno (nunca aparecem no portal)
  listarNotas: (alunoId) => request(`/notas?alunoId=${alunoId}`),
  criarNota: (dados) => request('/notas', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarNota: (id, dados) => request(`/notas/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerNota: (id) => request(`/notas/${id}`, { method: 'DELETE' }),
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

export const TIPOS_DESAFIO = { treino: 'Treino', dieta: 'Dieta' };

/** Aniversariantes do mês atual, com quantos dias faltam (0 = hoje, negativo
 * nunca aparece — vira o próximo ano). Ordenado por quem está mais perto. */
export function aniversariantesDoMes(alunos) {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const hojeSemHora = new Date(anoAtual, hoje.getMonth(), hoje.getDate());
  return alunos
    .filter((a) => a.ativo && a.dataNascimento)
    .map((a) => {
      const [, mes, dia] = a.dataNascimento.split('-').map(Number);
      let proxima = new Date(anoAtual, mes - 1, dia);
      if (proxima < hojeSemHora) proxima = new Date(anoAtual + 1, mes - 1, dia);
      const diasRestantes = Math.round((proxima - hojeSemHora) / 86400000);
      return { aluno: a, mes, dia, diasRestantes };
    })
    .filter((a) => a.mes === hoje.getMonth() + 1)
    .sort((a, b) => a.dia - b.dia);
}

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

/** Soma meses a uma data completa (YYYY-MM-DD) — usado para sugerir o fim de
 * um treino a partir do início (padrão: 1 mês de duração). */
export function somarMeses(dataISO, meses) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  const data = new Date(ano, mes - 1 + meses, dia);
  return data.toISOString().slice(0, 10);
}

export const NIVEIS_ATIVIDADE = {
  sedentario: 'Sedentário', leve: 'Leve', moderado: 'Moderado', intenso: 'Intenso',
};

export const GRUPOS_MUSCULARES = {
  peitoral: 'Peitoral', dorsais: 'Dorsais', trapezio: 'Trapézio', lombar: 'Lombar',
  deltoide_anterior: 'Deltoide Anterior', deltoide_medial: 'Deltoide Medial', deltoide_posterior: 'Deltoide Posterior',
  biceps: 'Bíceps', triceps: 'Tríceps', antebraco: 'Antebraço',
  quadriceps: 'Quadríceps', isquiotibiais: 'Isquiotibiais', gluteo: 'Glúteo', adutor: 'Adutor',
  panturrilha: 'Panturrilha', abdomen: 'Abdômen', cardio: 'Cardio/Aeróbio',
  // mantidos por compatibilidade com exercícios cadastrados antes desta lista ficar mais detalhada
  peito: 'Peito', costas: 'Costas', ombro: 'Ombro', posterior: 'Posterior de coxa',
  outro: 'Outro',
};

export const METODOS_TREINO = {
  convencional: 'Tradicional',
  drop_set: 'Drop-Set',
  cluster: 'Cluster',
  rest_pause: 'Rest-Pause',
  myo_reps: 'Myo-Reps',
  super_slow: 'Super Slow',
  negativo: 'Negativo',
  piramide_crescente: 'Pirâmide Crescente',
  piramide_decrescente: 'Pirâmide Decrescente',
};

export const METODOS_TREINO_DESC = {
  convencional: 'Séries e repetições padrão',
  drop_set: 'Reduções progressivas de carga',
  cluster: 'Micro-séries com pausas curtas',
  rest_pause: 'Pausas curtas até atingir o alvo',
  myo_reps: 'Série de ativação + mini-séries',
  super_slow: 'Cadência ultra lenta para máxima tensão',
  negativo: 'Ênfase na fase excêntrica (descida controlada)',
  piramide_crescente: 'Peso aumenta, repetições diminuem',
  piramide_decrescente: 'Peso diminui, repetições aumentam',
};

/** Config padrão de cada método — o que preenche os campos ao trocar de método. */
export function configPadraoMetodo(metodo) {
  switch (metodo) {
    case 'drop_set':
      return { series: 3, repsAlvo: 12, numDrops: 3, reducaoPercentual: 20, descansoSeriesSeg: 90, pesoInicialKg: '' };
    case 'cluster':
      return { series: 3, clusters: 5, repsPorCluster: 3, pausaIntraClusterSeg: 15, descansoSeriesSeg: 90, pesoKg: '' };
    case 'rest_pause':
      return { repsAlvo: 30, pausaSeg: 15 };
    case 'myo_reps':
      return { repsAtivacao: 15, pausaSeg: 5, repsMiniSerie: 5, maxMiniSeries: 5 };
    case 'super_slow':
      return { series: 3, repsAlvo: 8, faseConcentricaSeg: 4, faseExcentricaSeg: 4, descansoSeg: 60 };
    case 'negativo':
      return { series: 3, repsAlvo: 6, tempoFaseNegativaSeg: 4, descansoSeg: 90 };
    case 'piramide_crescente':
    case 'piramide_decrescente':
      return {
        seriesPiramide: metodo === 'piramide_decrescente'
          ? [{ reps: 6, cargaKg: 80 }, { reps: 8, cargaKg: 70 }, { reps: 10, cargaKg: 60 }, { reps: 12, cargaKg: 50 }]
          : [{ reps: 12, cargaKg: 40 }, { reps: 10, cargaKg: 50 }, { reps: 8, cargaKg: 60 }, { reps: 6, cargaKg: 70 }],
      };
    default:
      return {};
  }
}

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

// tipo da aula/registro na agenda de presença
export const TIPOS_AULA = {
  presencial: 'Aula',
  consulta: 'Consulta/avaliação',
  reposicao: 'Reposição de aula',
  consultoria_ajuste: 'Ajuste de consultoria',
};

export const MENSAGENS_PRONTAS = {
  'Boas-vindas': [
    'Oi {nome}! Seja muito bem-vinda(o) 🎉 Fico muito feliz em te acompanhar nessa jornada. Qualquer dúvida sobre o treino ou a dieta, me chama por aqui.',
    'Oi {nome}, tudo certo por aí? Já deixei seu treino e sua dieta liberados no app. Dá uma olhada com calma e me avisa se ficar alguma dúvida!',
  ],
  Cobrança: [
    'Oi {nome}, passando para lembrar que o pagamento do seu pacote vence em breve. Qualquer coisa me avisa 🙂',
    'Oi {nome}, tudo bem? Notei que o pagamento deste mês ainda está pendente. Pode verificar para mim quando puder?',
    'Oi {nome}! Seu pacote está perto de vencer, quer que eu já deixe o próximo period renovado?',
  ],
  Treino: [
    'Oi {nome}, como foi o treino de hoje? Conseguiu fazer todas as séries?',
    'Oi {nome}, notei que faz alguns dias que você não registra treino. Está tudo bem? Precisa ajustar algo na agenda?',
    'Oi {nome}, seu treino foi atualizado! Já pode conferir no app 💪',
  ],
  Avaliação: [
    'Oi {nome}, chegou a hora da sua reavaliação física! Vamos marcar um horário essa semana?',
    'Oi {nome}, parabéns pela evolução na última avaliação! Vamos continuar firme para o próximo objetivo.',
  ],
  Motivação: [
    'Oi {nome}, só passando para lembrar que cada treino é um passo mais perto do seu objetivo. Continue assim! 💪',
    'Bom dia, {nome}! Semana nova, energia nova. Vamos com tudo nos treinos dessa semana!',
  ],
  Falta: [
    'Oi {nome}, senti sua falta na aula de hoje! Está tudo bem? Quer remarcar?',
    'Oi {nome}, vi que faltou hoje. Sem problemas, só me avisa quando quiser remarcar 🙂',
  ],
};

export const TIPOS_REFEICAO = {
  cafe_manha: 'Café da manhã',
  pre_treino: 'Pré-treino',
  cafe_manha_2: 'Café da manhã 2',
  cafe_tarde: 'Café da tarde',
  cafe_tarde_2: 'Café da tarde 2',
  almoco: 'Almoço',
  janta: 'Janta',
  ceia: 'Ceia',
};

export const UNIDADES_ALIMENTO = {
  g: 'g', ml: 'ml', unidade: 'unidade(s)', fatia: 'fatia(s)', dose: 'dose(s)',
  colher_sopa: 'colher(es) de sopa', colher_cha: 'colher(es) de chá',
  xicara: 'xícara(s)', porcao: 'porção',
};

/** Unidades contadas: precisam do peso de uma unidade para virar caloria. */
export const UNIDADES_CONTADAS = ['unidade', 'fatia', 'dose', 'colher_sopa', 'colher_cha', 'xicara', 'porcao'];

/**
 * De onde saiu o valor nutricional. O nutricionista trabalha com a TACO
 * (Unicamp) e a USDA; rótulo é o que vem na embalagem e estimado é chute
 * assumido — fica marcado para ninguém confundir com tabela.
 */
export const FONTES_ALIMENTO = {
  TACO: 'TACO (Unicamp)', USDA: 'USDA', rotulo: 'Rótulo do produto', estimado: 'Estimado',
};

export const CATEGORIAS_ALIMENTO = {
  proteina: 'Proteína', carboidrato: 'Carboidrato', gordura: 'Gordura',
  fruta: 'Fruta', vegetal: 'Vegetal/legume', laticinio: 'Laticínio',
  suplemento: 'Suplemento', outro: 'Outro',
};

export const MEDIDAS_CAMPOS = [
  ['ombro', 'Ombro'], ['torax', 'Tórax'], ['cintura', 'Cintura'], ['abdomen', 'Abdômen'],
  ['quadril', 'Quadril'], ['bracoDireito', 'Braço direito'], ['bracoEsquerdo', 'Braço esquerdo'],
  ['antebracoDireito', 'Antebraço direito'], ['antebracoEsquerdo', 'Antebraço esquerdo'],
  ['coxaDireita', 'Coxa direita'], ['coxaEsquerda', 'Coxa esquerda'],
  ['panturrilhaDireita', 'Panturrilha direita'], ['panturrilhaEsquerda', 'Panturrilha esquerda'],
];

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

/* --------------------------------------------------------- bonequinho muscular */

/** Segunda a domingo da semana atual, no formato YYYY-MM-DD usado nos registros. */
export function semanaAtualIntervalo() {
  const hoje = new Date();
  const seg = new Date(hoje);
  seg.setDate(hoje.getDate() - ((hoje.getDay() + 6) % 7));
  const dom = new Date(seg);
  dom.setDate(seg.getDate() + 6);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { inicio: fmt(seg), fim: fmt(dom) };
}

// Grupos musculares detalhados agrupados nas zonas visíveis de frente no
// bonequinho. O que não aparece de frente (costas, glúteo, posterior de
// coxa, tríceps) entra só no total de "costas", mostrado à parte.
const ZONAS_FRENTE = {
  ombros: ['deltoide_anterior', 'deltoide_medial', 'ombro'],
  peito: ['peitoral', 'peito'],
  biceps: ['biceps', 'antebraco'],
  abdomen: ['abdomen'],
  quadriceps: ['quadriceps', 'adutor'],
  panturrilha: ['panturrilha'],
};
const GRUPOS_COSTAS = ['dorsais', 'trapezio', 'lombar', 'deltoide_posterior', 'triceps', 'gluteo', 'isquiotibiais', 'posterior', 'costas'];

/** Quantas séries cada zona do corpo já treinou nesta semana, a partir dos
 * treinos que o aluno já marcou como feitos (registrosTreino). */
export function volumeSemanalPorZona(registros, treinos) {
  const { inicio, fim } = semanaAtualIntervalo();
  const porGrupo = {};
  for (const r of registros) {
    if (r.data < inicio || r.data > fim) continue;
    const treino = treinos.find((t) => t.id === r.treinoId);
    const dia = treino?.dias?.find((d) => d.letra === r.diaLetra);
    if (!dia) continue;
    for (const [grupo, series] of volumeDoDia(dia)) {
      porGrupo[grupo] = (porGrupo[grupo] || 0) + series;
    }
  }
  const frente = {};
  for (const [zona, grupos] of Object.entries(ZONAS_FRENTE)) {
    frente[zona] = grupos.reduce((s, g) => s + (porGrupo[g] || 0), 0);
  }
  const costas = GRUPOS_COSTAS.reduce((s, g) => s + (porGrupo[g] || 0), 0);
  return { frente, costas };
}

/** Resumo de uma linha do que fazer, no vocabulário de cada método — o que a
 * aluna lê no treino em vez de só "3×8-12" para todo método. */
export function resumoMetodo(ex) {
  const c = ex.config || {};
  switch (ex.metodo) {
    case 'drop_set':
      return `${c.series ?? ex.series}x${c.repsAlvo ?? ex.repeticoes} · ${c.numDrops ?? 0} drops de ${c.reducaoPercentual ?? 0}%`;
    case 'cluster':
      return `${c.series ?? ex.series} séries · ${c.clusters ?? 0}x${c.repsPorCluster ?? 0} reps (pausa ${c.pausaIntraClusterSeg ?? 0}s)`;
    case 'rest_pause':
      return `Até a falha, pausa ${c.pausaSeg ?? 0}s, repita até ${c.repsAlvo ?? 0} reps`;
    case 'myo_reps':
      return `Ativação ${c.repsAtivacao ?? 0} reps + até ${c.maxMiniSeries ?? 0} mini-séries de ${c.repsMiniSerie ?? 0}`;
    case 'super_slow':
      return `${c.series ?? ex.series}x${c.repsAlvo ?? ex.repeticoes} · cadência ${c.faseConcentricaSeg ?? 0}/${c.faseExcentricaSeg ?? 0}s`;
    case 'negativo':
      return `${c.series ?? ex.series}x${c.repsAlvo ?? ex.repeticoes} · descida em ${c.tempoFaseNegativaSeg ?? 0}s, subida com ajuda`;
    case 'piramide_crescente':
    case 'piramide_decrescente':
      return (c.seriesPiramide || []).map((s) => `${s.reps}x${s.cargaKg}kg`).join(' → ');
    default:
      return `${ex.series}×${ex.repeticoes}`;
  }
}

/** Total de séries de um dia (soma de todos os exercícios). */
export function seriesDoDia(dia) {
  return (dia.exercicios || []).reduce((s, ex) => s + (Number(ex.series) || 0), 0);
}

/**
 * Estimativa grosseira de duração da sessão: ~45s de execução por série,
 * mais o descanso configurado de cada exercício.
 */
export function duracaoEstimadaDia(dia) {
  const segundos = (dia.exercicios || []).reduce((s, ex) => {
    const series = Number(ex.series) || 1;
    const descanso = Number(ex.descansoSeg) || 60;
    return s + series * (45 + descanso);
  }, 0);
  return Math.round(segundos / 60);
}

// Dias da semana no formato curto usado nos círculos "S T Q Q S S D".
export const DIAS_SEMANA_SESSAO = [
  { chave: 'seg', letra: 'S' }, { chave: 'ter', letra: 'T' }, { chave: 'qua', letra: 'Q' },
  { chave: 'qui', letra: 'Q' }, { chave: 'sex', letra: 'S' }, { chave: 'sab', letra: 'S' },
  { chave: 'dom', letra: 'D' },
];

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

/** O aluno "tem assinatura ativa" quando tem algum pacote ainda não vencido —
 * usado para travar conteúdo exclusivo sem criar um sistema de cobrança novo,
 * já que o pagamento em si continua sendo registrado à mão em Pacotes. */
export function temPacoteAtivo(pacotes) {
  const hoje = new Date().toISOString().slice(0, 10);
  return (pacotes || []).some((p) => p.dataFim >= hoje);
}

export function formatarTamanho(bytes) {
  if (!bytes) return '';
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}
