import { nanoid } from 'nanoid';

// Banco de opções "Substitutos" — café da manhã, lanche da tarde e jantar,
// todos com ~450kcal, seguindo o material de referência da Nayara. Roda uma
// vez só: se o banco já existe (mesmo nome), não faz nada de novo.
const NOME_BANCO = 'Café da manhã / Lanche da tarde / Jantar — 450kcal';

function acharOuCriarAlimento(db, nome, categoria, unidade, quantidadePadrao) {
  let alimento = db.data.alimentos.find((a) => a.nome.toLowerCase() === nome.toLowerCase());
  if (!alimento) {
    alimento = {
      id: nanoid(10),
      nome,
      categoria,
      unidade,
      quantidadePadrao,
      createdAt: new Date().toISOString(),
    };
    db.data.alimentos.push(alimento);
  }
  return alimento;
}

// Um "item" da refeição: uma ou mais opções intercambiáveis (OU), cada uma
// com sua própria quantidade — ex: aveia OU granola OU mel, cada 30g.
function item(db, ...defs) {
  return {
    id: nanoid(10),
    opcoes: defs.map(([nome, quantidade, unidade, categoria]) => {
      const alimento = acharOuCriarAlimento(db, nome, categoria, unidade, quantidade);
      return { alimentoId: alimento.id, nome: alimento.nome, quantidade, unidade };
    }),
  };
}

export async function seedSubstitutosCafeManha(db) {
  db.data.bancosOpcoes ||= [];
  db.data.alimentos ||= [];

  if (db.data.bancosOpcoes.some((b) => b.nome === NOME_BANCO)) return;

  const opcoes = [
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
  ];

  db.data.bancosOpcoes.push({
    id: nanoid(10),
    nome: NOME_BANCO,
    opcoes,
    createdAt: new Date().toISOString(),
  });

  await db.write();
}
