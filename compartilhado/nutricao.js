/**
 * Cálculo nutricional e escala de bases calóricas.
 *
 * Como o Dr. Guilherme monta os substitutos (lido dos planos de 540 e 600 kcal):
 * a proteína fica ancorada e o que escala é o carboidrato/gordura. Comparando
 * as duas bases, opção por opção:
 *
 *   Crepioca:  3 ovos + 75g tapioca + 100g recheio  →  3 ovos + 85g + 125g
 *   Whey+fruta: 1 dose + 3 porções + 50g aveia      →  1 dose + 4 porções + 50g
 *   Oleaginosa: 1 dose + 70g                        →  1 dose + 80g
 *
 * Nas bases baixas a âncora também cede, e é ele quem define o quanto:
 * para 200 kcal na opção do ovo, 2 ovos (140) + 1 fruta (70) = 210.
 *
 * Daí os três papéis que um item pode ter numa opção:
 *   ancora  — a proteína; só muda se o nutricionista mexer
 *   escala  — o que o motor ajusta para fechar a base
 *   fixo    — acompanhamento que não entra na conta da escala (tempero, café)
 */

/** Papéis possíveis de um item dentro de uma opção. */
export const PAPEIS = { ANCORA: 'ancora', ESCALA: 'escala', FIXO: 'fixo' };

/** Bases calóricas de café da manhã e lanche da tarde. */
export const BASES_KCAL = [200, 270, 370, 450, 540, 600];

/** O que o app conta. Fibra entra porque ele acompanha, não por causa da base. */
export const NUTRIENTES = ['kcal', 'proteina', 'carboidrato', 'gordura', 'fibra'];

/**
 * De onde veio o valor. TACO e USDA são as tabelas que ele usa; rótulo é o
 * que vem na embalagem (whey, pão de forma) e estimado é chute assumido —
 * marcado justamente para não se confundir com tabela.
 */
export const FONTES = ['TACO', 'USDA', 'rotulo', 'estimado'];

/**
 * Unidades que já são peso ou volume. Todo o resto é contagem — fatia, dose,
 * colher, xícara, porção — e só vira grama com o peso cadastrado no alimento.
 */
const UNIDADES_DE_MEDIDA = new Set(['g', 'ml']);

/** Se a unidade é contada (ovo, fatia, dose) em vez de pesada. */
export const ehContagem = (unidade) => !UNIDADES_DE_MEDIDA.has(unidade || 'g');

/**
 * Converte a quantidade do item para gramas (ou mL).
 * Alimento contado — ovo, fatia de pão, dose de whey — precisa de
 * gramasPorUnidade; sem ele a conta dá zero em vez de chutar um peso.
 */
export function emGramas(item, alimento) {
  const qtd = Number(item.quantidade) || 0;
  const unidade = item.unidade || alimento?.unidade || 'g';
  if (!ehContagem(unidade)) return qtd;
  return qtd * (Number(alimento?.gramasPorUnidade) || 0);
}

/** Nutrientes de um item só. Alimento sem valor cadastrado conta como zero. */
export function nutrientesDoItem(item, alimento) {
  const g = emGramas(item, alimento);
  const por100 = alimento?.porcao100 || {};
  const fora = {};
  for (const n of NUTRIENTES) fora[n] = ((Number(por100[n]) || 0) * g) / 100;
  return fora;
}

/**
 * Soma os nutrientes de uma opção inteira.
 *
 * Devolve também `incompleto`: a lista de alimentos sem valor nutricional
 * cadastrado. Sem isso o total apareceria menor do que é de verdade, e uma
 * opção pela metade passaria por pronta.
 */
export function calcular(itens = [], catalogo = new Map()) {
  const total = Object.fromEntries(NUTRIENTES.map((n) => [n, 0]));
  const incompleto = [];

  for (const item of itens) {
    const alimento = catalogo.get(item.alimentoId);
    if (!alimento) {
      incompleto.push({ alimentoId: item.alimentoId, motivo: 'fora do catálogo' });
      continue;
    }
    if (!alimento.porcao100 || !Number(alimento.porcao100.kcal)) {
      incompleto.push({ alimentoId: item.alimentoId, nome: alimento.nome, motivo: 'sem valor nutricional' });
      continue;
    }
    const n = nutrientesDoItem(item, alimento);
    for (const k of NUTRIENTES) total[k] += n[k];
  }

  for (const k of NUTRIENTES) total[k] = Math.round(total[k] * 10) / 10;
  return { ...total, incompleto, confiavel: incompleto.length === 0 };
}

/**
 * Ajusta os itens de papel "escala" para a opção fechar na base pedida.
 *
 * Mantém a proporção entre os itens que escalam, arredonda para o passo do
 * alimento (ovo vai de 1 em 1; farinha, de 5 em 5 gramas) e respeita mínimo
 * e máximo quando cadastrados.
 *
 * Devolve os itens novos e um diagnóstico. Quando a âncora sozinha já passa da
 * base, avisa em vez de devolver quantidade negativa — é o caso do "5 ovos +
 * 3 frutas" tentando virar 200 kcal, que precisa de decisão clínica.
 */
export function escalarParaBase(itens, baseAlvo, catalogo, { tolerancia = 0.05 } = {}) {
  const alvo = Number(baseAlvo);
  if (!alvo || alvo <= 0) throw new Error('Base calórica inválida');

  const kcalDe = (item) => nutrientesDoItem(item, catalogo.get(item.alimentoId)).kcal;

  const fixos = itens.filter((i) => i.papel !== PAPEIS.ESCALA);
  const escalaveis = itens.filter((i) => i.papel === PAPEIS.ESCALA);

  const kcalFixa = fixos.reduce((s, i) => s + kcalDe(i), 0);
  const kcalEscalavelAtual = escalaveis.reduce((s, i) => s + kcalDe(i), 0);
  const restante = alvo - kcalFixa;

  if (!escalaveis.length) {
    return {
      itens,
      ok: Math.abs(kcalFixa - alvo) <= alvo * tolerancia,
      aviso: 'Nenhum item marcado para escalar — a opção só tem âncora e itens fixos.',
      kcal: Math.round(kcalFixa),
    };
  }

  if (restante <= 0) {
    return {
      itens,
      ok: false,
      aviso:
        `A âncora sozinha já dá ${Math.round(kcalFixa)} kcal, acima da base de ${alvo}. ` +
        'Reduza a proteína ou use outra opção nesta base.',
      kcal: Math.round(kcalFixa),
    };
  }

  const fator = kcalEscalavelAtual > 0 ? restante / kcalEscalavelAtual : 0;

  const novos = itens.map((item) => {
    if (item.papel !== PAPEIS.ESCALA) return item;
    const alimento = catalogo.get(item.alimentoId);
    const unidade = item.unidade || alimento?.unidade || 'g';
    const passo = Number(alimento?.passo) || (ehContagem(unidade) ? 1 : 5);
    let qtd = (Number(item.quantidade) || 0) * fator;
    qtd = Math.round(qtd / passo) * passo;
    if (alimento?.minimo != null) qtd = Math.max(Number(alimento.minimo), qtd);
    if (alimento?.maximo != null) qtd = Math.min(Number(alimento.maximo), qtd);
    return { ...item, quantidade: qtd };
  });

  const final = calcular(novos, catalogo);
  const desvio = Math.abs(final.kcal - alvo) / alvo;

  return {
    itens: novos,
    ok: desvio <= tolerancia && final.confiavel,
    kcal: final.kcal,
    desvioPercentual: Math.round(desvio * 1000) / 10,
    aviso: !final.confiavel
      ? 'Faltam valores nutricionais: o total está incompleto.'
      : desvio > tolerancia
        ? `Fechou em ${final.kcal} kcal, ${Math.round(desvio * 100)}% fora da base — o arredondamento não permitiu chegar mais perto.`
        : null,
  };
}

/** Índice por id, do jeito que as funções acima esperam receber o catálogo. */
export const indexar = (alimentos = []) => new Map(alimentos.map((a) => [a.id, a]));
