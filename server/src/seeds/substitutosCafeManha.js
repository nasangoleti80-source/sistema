import { nanoid } from 'nanoid';
import { PAPEIS } from '../../../compartilhado/nutricao.js';

// Banco de opções "Substitutos" — café da manhã, lanche da tarde e jantar,
// todos com ~450kcal, seguindo o material de referência da Nayara. Roda uma
// vez só: se o banco já existe (mesmo nome), não faz nada de novo.
const NOME_BANCO = 'Café da manhã / Lanche da tarde / Jantar — 450kcal';
const BASE_KCAL = 450;

/**
 * O alimento entra sem valor nutricional de propósito.
 *
 * Os números vêm da TACO e da USDA, e chutar aqui seria pior do que deixar
 * vazio: um valor inventado não se distingue de um conferido depois que está
 * gravado. A tela de Alimentos mostra o que falta, e o nutricionista preenche.
 */
function acharOuCriarAlimento(db, nome, categoria, unidade, quantidadePadrao) {
  let alimento = db.data.alimentos.find((a) => a.nome.toLowerCase() === nome.toLowerCase());
  if (!alimento) {
    alimento = {
      id: nanoid(10),
      nome,
      categoria,
      unidade,
      quantidadePadrao,
      porcao100: null,
      gramasPorUnidade: null,
      passo: null,
      minimo: null,
      maximo: null,
      fonte: null,
      codigoFonte: null,
      conferido: false,
      createdAt: new Date().toISOString(),
    };
    db.data.alimentos.push(alimento);
  }
  return alimento;
}

/**
 * Papel de partida para a escala calórica, deduzido da categoria.
 *
 * Nos planos dele a proteína é que fica parada entre uma base e outra, e o
 * carboidrato é que cresce. Isso é só um ponto de partida — ele muda na tela
 * do banco, alimento por alimento, e a escolha dele é que vale.
 */
const papelDaCategoria = (categoria) =>
  categoria === 'proteina' || categoria === 'suplemento' ? PAPEIS.ANCORA : PAPEIS.ESCALA;

// Um "item" da refeição: uma ou mais opções intercambiáveis (OU), cada uma
// com sua própria quantidade — ex: aveia OU granola OU mel, cada 30g.
function item(db, ...defs) {
  return {
    id: nanoid(10),
    opcoes: defs.map(([nome, quantidade, unidade, categoria]) => {
      const alimento = acharOuCriarAlimento(db, nome, categoria, unidade, quantidade);
      return {
        alimentoId: alimento.id, nome: alimento.nome, quantidade, unidade,
        papel: papelDaCategoria(categoria),
      };
    }),
  };
}

export async function seedSubstitutosCafeManha(db) {
  db.data.bancosOpcoes ||= [];
  db.data.alimentos ||= [];

  const opcoesCanonicas = [
    {
      id: nanoid(10),
      nome: 'Opção 02 — Crepioca com patê',
      itens: [
        item(db, ['Ovo inteiro', 2, 'unidade', 'proteina']),
        item(db, ['Farinha de tapioca', 65, 'g', 'carboidrato']),
        item(db, ['Patê caseiro de frango', 100, 'g', 'proteina'], ['Queijo magro', 100, 'g', 'laticinio']),
      ],
    },
    {
      id: nanoid(10),
      nome: 'Opção 03 — Proteína com frutas e aveia',
      itens: [
        item(db, ['Proteína em pó (diluída em água 150mL)', 1, 'dose', 'suplemento']),
        item(db, ['Fruta (porção padrão)', 3, 'porcao', 'fruta']),
        item(
          db,
          ['Aveia em flocos', 30, 'g', 'carboidrato'],
          ['Granola', 30, 'g', 'carboidrato'],
          ['Mel', 30, 'g', 'carboidrato'],
          ['Leite em pó desnatado', 30, 'g', 'laticinio']
        ),
      ],
    },
    {
      id: nanoid(10),
      nome: 'Opção 04 — Pão com patê',
      itens: [
        item(
          db,
          ['Pão de forma', 100, 'g', 'carboidrato'],
          ['Pão francês', 100, 'g', 'carboidrato'],
          ['Torrada integral', 70, 'g', 'carboidrato'],
          ['Wrap', 100, 'g', 'carboidrato']
        ),
        item(db, ['Patê caseiro de frango', 110, 'g', 'proteina'], ['Patê caseiro de atum', 110, 'g', 'proteina']),
      ],
    },
    {
      id: nanoid(10),
      nome: 'Opção 06 — Vitamina de frutas com aveia e whey',
      itens: [
        item(
          db,
          ['Leite desnatado', 200, 'ml', 'laticinio'],
          ['Iogurte desnatado', 200, 'ml', 'laticinio'],
          ['Leite vegetal', 200, 'ml', 'outro']
        ),
        item(db, ['Fruta (porção padrão)', 2, 'porcao', 'fruta']),
        item(db, ['Aveia em flocos', 30, 'g', 'carboidrato']),
        item(db, ['Whey protein', 1, 'dose', 'suplemento']),
      ],
    },
    {
      id: nanoid(10),
      nome: 'Opção 07 — Proteína com iogurte e frutas',
      itens: [
        item(db, ['Proteína em pó', 1, 'dose', 'suplemento']),
        item(db, ['Iogurte desnatado', 170, 'ml', 'laticinio'], ['Iogurte zero', 280, 'ml', 'laticinio']),
        item(db, ['Granola', 30, 'g', 'carboidrato'], ['Aveia em flocos', 30, 'g', 'carboidrato'], ['Mel', 30, 'g', 'carboidrato']),
        item(db, ['Fruta (porção padrão)', 2, 'porcao', 'fruta']),
      ],
    },
    {
      id: nanoid(10),
      nome: 'Opção 08 — Hambúrguer caseiro',
      itens: [
        item(db, ['Carne bovina magra (crua)', 130, 'g', 'proteina']),
        item(db, ['Pão de hambúrguer (50g)', 2, 'unidade', 'carboidrato']),
        item(db, ['Requeijão light (opcional)', 20, 'g', 'laticinio']),
        item(db, ['Legumes e verduras (à vontade)', 1, 'porcao', 'vegetal']),
      ],
    },
    {
      id: nanoid(10),
      nome: 'Opção 09 — Beirute caseiro',
      itens: [
        item(db, ['Pão sírio', 100, 'g', 'carboidrato']),
        item(db, ['Carne', 90, 'g', 'proteina'], ['Frango', 90, 'g', 'proteina'], ['Ovo inteiro', 2, 'unidade', 'proteina']),
        item(db, ['Queijo mussarela light', 20, 'g', 'laticinio']),
        item(db, ['Alface (opcional)', 10, 'g', 'vegetal']),
        item(db, ['Tomate (opcional)', 30, 'g', 'vegetal']),
      ],
    },
    {
      id: nanoid(10),
      nome: 'Opção 10 — Tapioca com proteína',
      itens: [
        item(db, ['Farinha de tapioca', 100, 'g', 'carboidrato']),
        item(db, ['Frango', 100, 'g', 'proteina'], ['Atum', 100, 'g', 'proteina'], ['Carne', 100, 'g', 'proteina']),
        item(db, ['Requeijão light (opcional)', 30, 'g', 'laticinio']),
      ],
    },
    {
      id: nanoid(10),
      nome: 'Opção 11 — Barrinha proteica com frutas',
      itens: [
        item(db, ['Barrinha proteica (+20g proteína)', 1, 'unidade', 'suplemento']),
        item(db, ['Fruta (porção padrão)', 2, 'porcao', 'fruta']),
        item(db, ['Aveia em flocos', 35, 'g', 'carboidrato'], ['Granola', 35, 'g', 'carboidrato'], ['Mel', 35, 'g', 'carboidrato']),
      ],
    },
    {
      id: nanoid(10),
      nome: 'Opção 12 — Proteína com chocolate',
      itens: [
        item(db, ['Proteína em pó (diluída em água 150mL)', 1, 'dose', 'suplemento']),
        item(
          db,
          ['Chocolate 55%+', 60, 'g', 'outro'],
          ['Paçoca', 60, 'g', 'outro'],
          ['Doce de leite', 100, 'g', 'outro'],
          ['Pasta de amendoim', 55, 'g', 'gordura']
        ),
      ],
    },
    {
      id: nanoid(10),
      nome: 'Opção 13 — Iogurte com frutas e pão',
      itens: [
        item(db, ['Iogurte (+20g proteína)', 1, 'unidade', 'laticinio'], ['Bebida proteica (+20g proteína)', 1, 'unidade', 'suplemento']),
        item(db, ['Fruta (porção padrão)', 1, 'porcao', 'fruta']),
        item(db, ['Aveia em flocos', 20, 'g', 'carboidrato'], ['Granola', 20, 'g', 'carboidrato'], ['Mel', 20, 'g', 'carboidrato']),
        item(db, ['Pão de forma', 1, 'fatia', 'carboidrato'], ['Torrada integral', 20, 'g', 'carboidrato']),
        item(db, ['Queijo branco (cottage, ricota ou minas frescal light)', 30, 'g', 'laticinio']),
      ],
    },
    // Opção 15 do material de referência é idêntica à Opção 09 (Beirute
    // caseiro) — não duplicada aqui de propósito.
    {
      id: nanoid(10),
      nome: 'Opção 14 — Wrap proteico',
      itens: [
        item(db, ['Wrap', 2, 'fatia', 'carboidrato']),
        item(db, ['Requeijão light', 25, 'g', 'laticinio'], ['Ketchup', 25, 'g', 'outro'], ['Mostarda', 25, 'g', 'outro']),
        item(
          db,
          ['Ovo mexido', 3, 'unidade', 'proteina'],
          ['Frango, atum ou carne bovina', 120, 'g', 'proteina'],
          ['Queijo muçarela light ou de búfala', 90, 'g', 'laticinio'],
          ['Queijo branco (cottage, ricota ou minas frescal light)', 150, 'g', 'laticinio']
        ),
      ],
    },
    {
      id: nanoid(10),
      nome: 'Opção 16 — Pão com ovo',
      itens: [
        item(db, ['Pão francês', 75, 'g', 'carboidrato'], ['Pão de forma', 75, 'g', 'carboidrato']),
        item(db, ['Ovo inteiro', 3, 'unidade', 'proteina']),
        item(
          db,
          ['Requeijão light (opcional)', 20, 'g', 'laticinio'],
          ['Ricota (opcional)', 20, 'g', 'laticinio'],
          ['Cottage (opcional)', 20, 'g', 'laticinio']
        ),
      ],
    },
    {
      id: nanoid(10),
      nome: 'Opção 17 — Pastel proteico na air fryer',
      itens: [
        item(db, ['Massa para pastel (crua)', 75, 'g', 'carboidrato']),
        item(db, ['Frango', 95, 'g', 'proteina'], ['Carne', 95, 'g', 'proteina']),
        item(db, ['Queijo muçarela light', 20, 'g', 'laticinio']),
        item(db, ['Molho de tomate', 20, 'g', 'outro']),
      ],
    },
    {
      id: nanoid(10),
      nome: 'Opção 18 — Sanduíche proteico de lombo suíno e queijo',
      itens: [
        item(db, ['Pão francês', 100, 'g', 'carboidrato'], ['Pão de forma', 100, 'g', 'carboidrato']),
        item(db, ['Lombo suíno', 55, 'g', 'proteina']),
        item(
          db,
          ['Muçarela light ou de búfala', 40, 'g', 'laticinio'],
          ['Queijo branco (minas frescal, cottage ou ricota)', 65, 'g', 'laticinio']
        ),
      ],
    },
  ];

  let banco = db.data.bancosOpcoes.find((b) => b.nome === NOME_BANCO);
  if (!banco) {
    banco = { id: nanoid(10), nome: NOME_BANCO, baseKcal: BASE_KCAL, opcoes: [], createdAt: new Date().toISOString() };
    db.data.bancosOpcoes.push(banco);
  }
  // A base estava só escrita no nome. Um banco que já existe em produção
  // ganha o campo aqui, senão o motor não tem alvo para fechar as opções.
  if (banco.baseKcal == null) banco.baseKcal = BASE_KCAL;

  // Idempotente por opção: um redeploy não duplica quem já está lá, mas
  // preenche quem ainda falta — é assim que as opções novas (14, 16, 17, 18)
  // chegam num banco que já existia em produção com só as opções 02-13.
  const nomesExistentes = new Set(banco.opcoes.map((o) => o.nome));
  for (const opcao of opcoesCanonicas) {
    if (!nomesExistentes.has(opcao.nome)) banco.opcoes.push(opcao);
  }

  await db.write();
}
