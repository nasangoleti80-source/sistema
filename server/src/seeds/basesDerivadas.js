import { nanoid } from 'nanoid';
import { PAPEIS, calcular, escalarParaBase, indexar, ehContagem } from '../../../compartilhado/nutricao.js';

/**
 * Gera os bancos de 200, 270 e 370 kcal a partir do de 450.
 *
 * É o que ele pediu: as mesmas opções, nas bases que ele usa no café da manhã
 * e no lanche da tarde. A gramatura sai do motor, com a regra que está nos
 * planos dele de 540 e 600 — a proteína ancorada, o carboidrato escalando.
 *
 * Duas coisas que o gerador faz e vale explicar:
 *
 * 1. Nas bases baixas a âncora também cede. É o que ele mesmo faz: a opção do
 *    ovo, que tem 3 ovos em 450, vira 2 ovos + 1 fruta em 200. Aqui a âncora
 *    só encolhe quando sozinha passa de 70% da base, e o corte é proporcional.
 *
 * 2. Opção que não cabe na base fica de fora daquele banco, em vez de entrar
 *    com o valor errado. Hambúrguer caseiro em 200 kcal é o caso claro: um pão
 *    de hambúrguer já são 143 kcal, e não existe meio pão. Empurrar a opção
 *    para caber daria uma receita que ninguém faz.
 *
 * Os substitutos de cada item escalam junto, pelo mesmo fator do principal —
 * é como ele escreve no PDF ("aveia 30 g OU granola 30 g OU mel 30 g", o
 * mesmo peso para os três), não igualando caloria por caloria.
 *
 * Tudo aqui é proposta. As opções entram marcadas com a origem e o desvio, e
 * o banco leva um aviso na descrição: é ele quem assina.
 */

const BASE_DE_ORIGEM = 450;

/**
 * As refeições que usam as bases baixas. O jantar fica de fora: 200 kcal de
 * jantar não é uma refeição, e ele só citou café da manhã e lanche da tarde.
 *
 * O banco de origem de cada uma é o de 450 com o mesmo nome — é o conjunto
 * que ele já usa, e é dele que sai a gramatura de todas as outras bases.
 */
const REFEICOES = ['Café da manhã', 'Lanche da tarde'];

/** Quanto a opção pode ficar longe da base e ainda servir de substituto. */
const TOLERANCIA = 0.12;

/** Fração da base que a âncora pode ocupar antes de ter que ceder. */
const TETO_DA_ANCORA = 0.70;

/**
 * Opções simples, montadas para as bases baixas.
 *
 * Encolher as receitas de 450 só vai até certo ponto: um beirute de 200 kcal
 * seria 20 g de pão sírio, que não é um beirute. A regra dele para as bases
 * baixas é outra e ele deu o exemplo — 2 ovos mais 1 fruta, 210 kcal. São
 * combinações de uma proteína com um carboidrato, e é isso que está aqui.
 *
 * As quantidades são ponto de partida: entram no mesmo motor das outras e
 * saem na gramatura de cada base.
 */
const SIMPLES = [
  {
    nome: 'Opção S1 — Ovo com fruta',
    itens: [
      [['Ovo inteiro', 2, 'unidade', PAPEIS.ANCORA]],
      [['Fruta (porção padrão)', 1, 'porcao', PAPEIS.ESCALA]],
    ],
  },
  {
    nome: 'Opção S2 — Iogurte com fruta e aveia',
    itens: [
      [
        ['Iogurte desnatado', 200, 'ml', PAPEIS.ANCORA],
        ['Iogurte zero', 200, 'ml', PAPEIS.ANCORA],
      ],
      [['Fruta (porção padrão)', 1, 'porcao', PAPEIS.ESCALA]],
      [
        ['Aveia em flocos', 15, 'g', PAPEIS.ESCALA],
        ['Granola', 15, 'g', PAPEIS.ESCALA],
        ['Mel', 10, 'g', PAPEIS.ESCALA],
      ],
    ],
  },
  {
    nome: 'Opção S3 — Proteína com fruta',
    itens: [
      [
        ['Proteína em pó (diluída em água 150mL)', 1, 'dose', PAPEIS.ANCORA],
        ['Whey protein', 1, 'dose', PAPEIS.ANCORA],
      ],
      [['Fruta (porção padrão)', 1, 'porcao', PAPEIS.ESCALA]],
    ],
  },
  {
    nome: 'Opção S4 — Pão com queijo branco',
    itens: [
      [
        ['Queijo branco (cottage, ricota ou minas frescal light)', 50, 'g', PAPEIS.ANCORA],
        ['Cottage (opcional)', 80, 'g', PAPEIS.ANCORA],
      ],
      [
        ['Pão de forma', 40, 'g', PAPEIS.ESCALA],
        ['Pão francês', 40, 'g', PAPEIS.ESCALA],
        ['Torrada integral', 25, 'g', PAPEIS.ESCALA],
      ],
    ],
  },
  {
    nome: 'Opção S5 — Fruta com pasta de amendoim',
    itens: [
      [['Fruta (porção padrão)', 2, 'porcao', PAPEIS.ESCALA]],
      [
        ['Pasta de amendoim', 10, 'g', PAPEIS.ESCALA],
        ['Chocolate 55%+', 12, 'g', PAPEIS.ESCALA],
      ],
    ],
  },
  {
    nome: 'Opção S6 — Ovo com pão',
    itens: [
      [['Ovo inteiro', 2, 'unidade', PAPEIS.ANCORA]],
      [
        ['Pão de forma', 25, 'g', PAPEIS.ESCALA],
        ['Pão francês', 25, 'g', PAPEIS.ESCALA],
        ['Torrada integral', 15, 'g', PAPEIS.ESCALA],
      ],
    ],
  },
];

/** Transforma um molde de opção simples no formato que o app guarda. */
function montarSimples(molde, catalogo) {
  const porNomeAlimento = new Map();
  for (const a of catalogo.values()) porNomeAlimento.set(chaveNome(a.nome), a);

  const itens = [];
  for (const grupo of molde.itens) {
    const opcoes = [];
    for (const [nome, quantidade, unidade, papel] of grupo) {
      const alimento = porNomeAlimento.get(chaveNome(nome));
      if (!alimento) return null;      // alimento fora do catálogo: molde inteiro cai
      opcoes.push({ alimentoId: alimento.id, nome: alimento.nome, quantidade, unidade, papel });
    }
    if (!opcoes.length) return null;
    itens.push({ id: nanoid(10), opcoes });
  }
  return { id: nanoid(10), nome: molde.nome, itens };
}

const chaveNome = (s) =>
  String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/** As bases que faltavam. A de 450 já existe e é dele. */
const BASES = [200, 270, 370];

/* O banco de 450 se chama só "Café da manhã", com a base num campo. Como aqui
   existe mais de um por refeição, o nome carrega a base para dar para
   distinguir os quatro na lista. */
const nomeDoBanco = (refeicao, base) => `${refeicao} — ${base} kcal`;

/** Arredonda na unidade em uso — não na do catálogo, que pode ser outra. */
function arredondar(quantidade, alimento, unidade) {
  const mesmaUnidade = !alimento?.unidade || unidade === alimento.unidade;
  const passo = (mesmaUnidade && Number(alimento?.passo)) || (ehContagem(unidade) ? 1 : 5);
  let n = Math.round(quantidade / passo) * passo;
  if (mesmaUnidade && alimento?.minimo != null) n = Math.max(Number(alimento.minimo), n);
  if (mesmaUnidade && alimento?.maximo != null) n = Math.min(Number(alimento.maximo), n);
  return n > 0 ? n : passo;
}

/**
 * Encolhe a âncora quando ela sozinha não deixa espaço para o resto.
 *
 * Sem isso a opção de 3 ovos (219 kcal) numa base de 200 não teria saída: o
 * motor avisaria e pararia, certo para um caso isolado, inútil para gerar um
 * banco inteiro.
 */
function ajustarAncora(itens, base, catalogo) {
  const ancoras = itens.filter((i) => i.papel === PAPEIS.ANCORA);
  if (!ancoras.length) return { itens, ancoraReduzida: false };

  const kcalAncora = calcular(ancoras, catalogo).kcal;
  const teto = base * TETO_DA_ANCORA;
  if (kcalAncora <= teto) return { itens, ancoraReduzida: false };

  const fator = teto / kcalAncora;
  const novos = itens.map((i) => {
    if (i.papel !== PAPEIS.ANCORA) return i;
    const alimento = catalogo.get(i.alimentoId);
    return { ...i, quantidade: arredondar((Number(i.quantidade) || 0) * fator, alimento, i.unidade) };
  });
  return { itens: novos, ancoraReduzida: true };
}

/** Reescreve a opção inteira na base pedida, substitutos incluídos. */
function derivarOpcao(opcao, base, catalogo) {
  const principais = opcao.itens.map((it) => it.opcoes?.[0]).filter(Boolean);
  if (principais.length !== opcao.itens.length) return null;

  const { itens: comAncora, ancoraReduzida } = ajustarAncora(principais, base, catalogo);
  const r = escalarParaBase(comAncora, base, catalogo);
  /* O total sai de recontar o que o motor devolveu, não do número que ele
     resumiu — quando ele desiste de escalar, os itens voltam como entraram, e
     só a soma deles diz quanto a opção realmente vale. */
  const total = calcular(r.itens, catalogo);
  if (!total.confiavel) return null;

  /* Fora da tolerância a opção sai do banco. Não é falha do motor: é uma
     receita que não cabe nesta base sem virar outra receita. */
  const desvio = Math.abs(total.kcal - base) / base;
  if (desvio > TOLERANCIA) return null;

  const itens = opcao.itens.map((item, i) => {
    const antes = Number(item.opcoes[0].quantidade) || 0;
    const depois = Number(r.itens[i].quantidade) || 0;
    const fator = antes > 0 ? depois / antes : 1;

    return {
      ...item,
      id: nanoid(10),
      opcoes: item.opcoes.map((troca, k) => {
        if (k === 0) return { ...troca, quantidade: depois };
        const alimento = catalogo.get(troca.alimentoId);
        const q = (Number(troca.quantidade) || 0) * fator;
        return { ...troca, quantidade: arredondar(q, alimento, troca.unidade) };
      }),
    };
  });

  return {
    id: nanoid(10),
    nome: opcao.nome,
    itens,
    derivadaDe: `banco de ${BASE_DE_ORIGEM} kcal`,
    kcalCalculada: Math.round(total.kcal),
    ancoraReduzida,
    revisada: false,
  };
}

export async function seedBasesDerivadas(db) {
  db.data.bancosOpcoes ||= [];
  const catalogo = indexar(db.data.alimentos || []);

  /* Sem valor nutricional não há o que derivar — o seed dos valores roda antes. */
  if (![...catalogo.values()].some((a) => a.porcao100?.kcal)) return;

  let criados = 0;
  for (const refeicao of REFEICOES) {
    const origem = db.data.bancosOpcoes.find(
      (b) => b.nome === refeicao && b.baseKcal === BASE_DE_ORIGEM
    );
    if (!origem?.opcoes?.length) continue;

    for (const base of BASES) {
      const nome = nomeDoBanco(refeicao, base);
      if (db.data.bancosOpcoes.some((b) => b.nome === nome)) continue;

      const daOrigem = origem.opcoes
        .map((o) => derivarOpcao(o, base, catalogo))
        .filter(Boolean);

      const simples = SIMPLES
        .map((molde) => montarSimples(molde, catalogo))
        .filter(Boolean)
        .map((o) => derivarOpcao(o, base, catalogo))
        .filter(Boolean);

      /* As simples primeiro: nas bases baixas são elas que fazem sentido, e a
         primeira opção do banco é a que a aluna vê antes de arrastar. */
      const opcoes = [...simples, ...daOrigem];
      if (!opcoes.length) continue;

      const foraDaBase = origem.opcoes.length - daOrigem.length;
      db.data.bancosOpcoes.push({
        id: nanoid(10),
        nome,
        baseKcal: base,
        observacao:
          `Gerado pelo sistema: ${simples.length} opções simples montadas para as bases baixas ` +
          `e ${daOrigem.length} vindas do banco de ${BASE_DE_ORIGEM} kcal, com a gramatura recalculada. ` +
          (foraDaBase
            ? `Outras ${foraDaBase} das ${origem.opcoes.length} de ${BASE_DE_ORIGEM} kcal não cabem ` +
              'nesta base sem virar outra receita e ficaram de fora. '
            : '') +
          'Confira as gramaturas antes de usar com aluna.',
        opcoes,
        createdAt: new Date().toISOString(),
      });
      criados++;
      console.log(`[dieta] ${nome}: ${opcoes.length} opções (${foraDaBase} fora da base)`);
    }
  }

  if (criados) await db.write();
}
