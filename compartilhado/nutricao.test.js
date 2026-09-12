import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PAPEIS, ehContagem, emGramas, nutrientesDoItem, calcular, escalarParaBase, indexar,
} from './nutricao.js';

/**
 * Prova de aritmética do motor de dieta.
 *
 * Os valores aqui são redondos de propósito — ovo com 140 kcal por 100 g, fruta
 * com 70 por porção. Isso testa a conta e o arredondamento, não a tabela: os
 * números reais vêm da TACO e da USDA e só entram no catálogo depois que o
 * nutricionista confere. Um teste com valor chutado passaria a impressão de que
 * a calibragem está feita, e não está.
 */

const OVO = { id: 'ovo', nome: 'Ovo de galinha', unidade: 'unidade', gramasPorUnidade: 50, passo: 1,
  porcao100: { kcal: 140, proteina: 13, carboidrato: 1, gordura: 9.5, fibra: 0 } };
const TAPIOCA = { id: 'tap', nome: 'Goma de tapioca', unidade: 'g', passo: 5,
  porcao100: { kcal: 200, proteina: 0, carboidrato: 50, gordura: 0, fibra: 0 } };
const FRUTA = { id: 'fruta', nome: 'Fruta (porção)', unidade: 'unidade', gramasPorUnidade: 100, passo: 1,
  porcao100: { kcal: 70, proteina: 1, carboidrato: 17, gordura: 0, fibra: 2 } };
const CAFE = { id: 'cafe', nome: 'Café sem açúcar', unidade: 'ml', porcao100: { kcal: 2 } };
const SEM_VALOR = { id: 'novo', nome: 'Pão artesanal da padaria', unidade: 'g' };

const catalogo = indexar([OVO, TAPIOCA, FRUTA, CAFE, SEM_VALOR]);

test('unidade vira grama pelo peso cadastrado', () => {
  assert.equal(emGramas({ alimentoId: 'ovo', quantidade: 3 }, OVO), 150);
  assert.equal(emGramas({ alimentoId: 'tap', quantidade: 75 }, TAPIOCA), 75);
});

test('unidade sem gramasPorUnidade não inventa peso', () => {
  const semPeso = { ...OVO, gramasPorUnidade: null };
  assert.equal(emGramas({ quantidade: 3 }, semPeso), 0);
});

test('nutriente do item é proporcional à quantidade', () => {
  const n = nutrientesDoItem({ alimentoId: 'ovo', quantidade: 2 }, OVO);
  assert.equal(n.kcal, 140);      // 2 ovos = 100 g = 140 kcal
  assert.equal(n.proteina, 13);
});

test('soma da opção fecha e se diz confiável', () => {
  const total = calcular(
    [{ alimentoId: 'ovo', quantidade: 2 }, { alimentoId: 'fruta', quantidade: 1 }],
    catalogo
  );
  assert.equal(total.kcal, 210);  // a regra dele: 2 ovos (140) + 1 fruta (70)
  assert.equal(total.confiavel, true);
  assert.deepEqual(total.incompleto, []);
});

test('alimento sem valor cadastrado não some da conta calado', () => {
  const total = calcular(
    [{ alimentoId: 'ovo', quantidade: 2 }, { alimentoId: 'novo', quantidade: 50 }],
    catalogo
  );
  assert.equal(total.kcal, 140);
  assert.equal(total.confiavel, false);
  assert.equal(total.incompleto.length, 1);
  assert.equal(total.incompleto[0].nome, 'Pão artesanal da padaria');
  assert.equal(total.incompleto[0].motivo, 'sem valor nutricional');
});

test('item fora do catálogo também é apontado', () => {
  const total = calcular([{ alimentoId: 'apagado', quantidade: 10 }], catalogo);
  assert.equal(total.confiavel, false);
  assert.equal(total.incompleto[0].motivo, 'fora do catálogo');
});

test('escala fecha na base mexendo só no carboidrato', () => {
  const itens = [
    { alimentoId: 'ovo', quantidade: 3, papel: PAPEIS.ANCORA },
    { alimentoId: 'tap', quantidade: 75, papel: PAPEIS.ESCALA },
  ];
  const r = escalarParaBase(itens, 540, catalogo);
  assert.equal(r.ok, true);
  // âncora 3 ovos = 210 kcal; restam 330 para a tapioca de 2 kcal/g → 165 g
  assert.equal(r.itens[0].quantidade, 3, 'a âncora não se mexe');
  assert.equal(r.itens[1].quantidade, 165);
  assert.equal(r.kcal, 540);
});

test('quantidade cai no passo do alimento', () => {
  const itens = [
    { alimentoId: 'ovo', quantidade: 3, papel: PAPEIS.ANCORA },
    { alimentoId: 'tap', quantidade: 75, papel: PAPEIS.ESCALA },
  ];
  const r = escalarParaBase(itens, 600, catalogo);
  // restam 390 kcal → 195 g exatos, já múltiplo de 5
  assert.equal(r.itens[1].quantidade % 5, 0);
  assert.equal(r.itens[1].quantidade, 195);
});

test('item fixo entra na conta mas não escala', () => {
  const itens = [
    { alimentoId: 'ovo', quantidade: 2, papel: PAPEIS.ANCORA },
    { alimentoId: 'cafe', quantidade: 200, papel: PAPEIS.FIXO },
    { alimentoId: 'tap', quantidade: 50, papel: PAPEIS.ESCALA },
  ];
  const r = escalarParaBase(itens, 370, catalogo);
  assert.equal(r.itens[1].quantidade, 200, 'o café continua 200 ml');
  // 140 (ovo) + 4 (café) = 144; restam 226 → 113 g, arredondado para 115
  assert.equal(r.itens[2].quantidade, 115);
  assert.equal(r.ok, true);
});

test('âncora maior que a base avisa em vez de devolver quantidade negativa', () => {
  const itens = [
    { alimentoId: 'ovo', quantidade: 5, papel: PAPEIS.ANCORA },
    { alimentoId: 'fruta', quantidade: 3, papel: PAPEIS.ANCORA },
    { alimentoId: 'tap', quantidade: 50, papel: PAPEIS.ESCALA },
  ];
  const r = escalarParaBase(itens, 200, catalogo);
  assert.equal(r.ok, false);
  assert.match(r.aviso, /âncora sozinha/);
  // O aviso fala da âncora (560), mas o kcal é o da opção inteira — a tapioca
  // de 50 g continua lá, porque nada foi reescalado.
  assert.match(r.aviso, /já dá 560 kcal/);
  assert.equal(r.kcal, 660);   // 5 ovos (350) + 3 frutas (210) + 50 g tapioca (100)
  assert.equal(r.itens, itens, 'não mexe em nada quando não sabe o que fazer');
});

test('opção sem item de escala é julgada pelo que já tem', () => {
  // 3 ovos = 210 kcal. Numa base de 200 isso fecha — é a tolerância de 5%, e é
  // a própria regra dele (2 ovos + 1 fruta = 210 numa base de 200).
  const perto = escalarParaBase([{ alimentoId: 'ovo', quantidade: 3, papel: PAPEIS.ANCORA }], 200, catalogo);
  assert.equal(perto.kcal, 210);
  assert.equal(perto.ok, true);
  assert.match(perto.aviso, /Nenhum item marcado para escalar/);

  // A mesma opção numa base de 450 não fecha, e não tem como ajustar sozinha.
  const longe = escalarParaBase([{ alimentoId: 'ovo', quantidade: 3, papel: PAPEIS.ANCORA }], 450, catalogo);
  assert.equal(longe.ok, false);
  assert.match(longe.aviso, /Nenhum item marcado para escalar/);
});

test('mínimo e máximo do alimento são respeitados', () => {
  const comLimite = indexar([OVO, { ...TAPIOCA, minimo: 30, maximo: 120 }]);
  const itens = [
    { alimentoId: 'ovo', quantidade: 2, papel: PAPEIS.ANCORA },
    { alimentoId: 'tap', quantidade: 100, papel: PAPEIS.ESCALA },
  ];
  const teto = escalarParaBase(itens, 600, comLimite);
  assert.equal(teto.itens[1].quantidade, 120);
  assert.equal(teto.ok, false, 'travou no máximo e não chegou na base — precisa avisar');
  assert.match(teto.aviso, /fora da base/);

  const piso = escalarParaBase(itens, 170, comLimite);
  assert.equal(piso.itens[1].quantidade, 30);
});

test('escala não passa por pronta com alimento sem valor', () => {
  const itens = [
    { alimentoId: 'ovo', quantidade: 2, papel: PAPEIS.ANCORA },
    { alimentoId: 'novo', quantidade: 50, papel: PAPEIS.ESCALA },
  ];
  const r = escalarParaBase(itens, 270, catalogo);
  assert.equal(r.ok, false);
  assert.match(r.aviso, /Faltam valores nutricionais/);
});

test('base inválida é erro, não zero', () => {
  assert.throws(() => escalarParaBase([], 0, catalogo), /Base calórica inválida/);
});

test('fatia, dose e colher também são contagem, não grama', () => {
  const PAO = { id: 'pao', nome: 'Pão de forma integral', unidade: 'fatia', gramasPorUnidade: 25,
    porcao100: { kcal: 240 } };
  const WHEY = { id: 'whey', nome: 'Whey protein', unidade: 'dose', gramasPorUnidade: 30,
    porcao100: { kcal: 400 } };
  const cat = indexar([PAO, WHEY]);

  assert.equal(calcular([{ alimentoId: 'pao', quantidade: 2 }], cat).kcal, 120);  // 2 fatias = 50 g
  assert.equal(calcular([{ alimentoId: 'whey', quantidade: 1 }], cat).kcal, 120); // 1 dose = 30 g
});

test('item contado escala de um em um', () => {
  const PAO = { id: 'pao', nome: 'Pão de forma', unidade: 'fatia', gramasPorUnidade: 25, porcao100: { kcal: 240 } };
  const r = escalarParaBase(
    [{ alimentoId: 'pao', quantidade: 1, papel: PAPEIS.ESCALA }],
    200,
    indexar([PAO])
  );
  assert.equal(r.itens[0].quantidade, 3);   // 3 fatias = 75 g = 180 kcal
  assert.equal(Number.isInteger(r.itens[0].quantidade), true);
});

test('toda unidade que não é g nem ml é contada', () => {
  // A lista de unidades da tela tem sete formas de contar e duas de medir.
  // Tratar só 'unidade' como contagem deixava fatia, dose e colher valendo
  // zero caloria na conta — sem barulho nenhum.
  for (const u of ['unidade', 'fatia', 'dose', 'colher_sopa', 'colher_cha', 'xicara', 'porcao']) {
    assert.equal(ehContagem(u), true, `${u} devia ser contagem`);
  }
  for (const u of ['g', 'ml']) assert.equal(ehContagem(u), false, `${u} devia ser medida`);
  assert.equal(ehContagem(undefined), false, 'sem unidade, assume grama');
});

test('limite do alimento não vale quando o item usa outra unidade', () => {
  // O mesmo wrap é grama no catálogo e fatia na receita. Aplicar o passo de
  // 5 g à fatia arredondava 2 fatias para zero.
  const WRAP = { id: 'wrap', nome: 'Wrap', unidade: 'g', passo: 5, minimo: 50, maximo: 150,
    gramasPorUnidade: 45, porcao100: { kcal: 310 } };
  const cat = indexar([WRAP]);

  const emFatias = escalarParaBase(
    [{ alimentoId: 'wrap', quantidade: 2, unidade: 'fatia', papel: PAPEIS.ESCALA }],
    280, cat
  );
  assert.equal(emFatias.itens[0].quantidade, 2, '2 fatias = 90 g = 279 kcal; o passo de 5 g não se aplica');
  assert.equal(Number.isInteger(emFatias.itens[0].quantidade), true);

  // Na unidade do próprio alimento, passo e limites continuam valendo.
  const emGramas = escalarParaBase(
    [{ alimentoId: 'wrap', quantidade: 100, unidade: 'g', papel: PAPEIS.ESCALA }],
    600, cat
  );
  assert.equal(emGramas.itens[0].quantidade, 150, 'trava no máximo de 150 g');
});

test('escala nunca zera um item da receita', () => {
  const AZEITE = { id: 'az', nome: 'Azeite', unidade: 'g', passo: 5, porcao100: { kcal: 884 } };
  const OVO = { id: 'ovo', nome: 'Ovo', unidade: 'unidade', gramasPorUnidade: 50, porcao100: { kcal: 140 } };
  const r = escalarParaBase(
    [
      { alimentoId: 'ovo', quantidade: 2, papel: PAPEIS.ANCORA },
      { alimentoId: 'az', quantidade: 40, papel: PAPEIS.ESCALA },
    ],
    150, indexar([AZEITE, OVO])
  );
  assert.ok(r.itens[1].quantidade > 0, 'o azeite continua existindo na receita');
});

test('quando desiste de escalar, o kcal devolvido é o da opção inteira', () => {
  // A âncora sozinha passa da base, então nada é reescalado. O número que
  // volta tem que ser o da opção como ela está — devolver só a âncora fez um
  // gerador gravar uma opção de 498 kcal num banco de 200.
  const BARRA = { id: 'barra', nome: 'Barrinha', unidade: 'unidade', gramasPorUnidade: 60,
    passo: 1, minimo: 1, porcao100: { kcal: 367 } };
  const AVEIA = { id: 'aveia', nome: 'Aveia', unidade: 'g', passo: 5, porcao100: { kcal: 394 } };
  const cat = indexar([BARRA, AVEIA]);

  const r = escalarParaBase(
    [
      { alimentoId: 'barra', quantidade: 1, papel: PAPEIS.ANCORA },
      { alimentoId: 'aveia', quantidade: 35, papel: PAPEIS.ESCALA },
    ],
    200, cat
  );

  assert.equal(r.ok, false);
  assert.match(r.aviso, /âncora sozinha já dá 220/);
  assert.equal(r.kcal, 358, 'barrinha (220) + aveia (138), não só a barrinha');
  assert.equal(Math.round(calcular(r.itens, cat).kcal), r.kcal, 'o resumo bate com a soma dos itens');
});
