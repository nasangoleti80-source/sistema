import { PAPEIS } from '../../../compartilhado/nutricao.js';

/**
 * Valor nutricional dos alimentos do banco de substitutos.
 *
 * Cada linha diz de onde o número veio. Onde a TACO ou a USDA têm o alimento,
 * é cópia da tabela e o código fica gravado — dá para abrir a publicação e
 * conferir. Onde não têm (whey, barrinha, patê caseiro, wrap), o valor é
 * calculado a partir de alimentos que estão nas tabelas, e a conta está
 * escrita na nota. Esses entram marcados como `estimado`, que é diferente de
 * `TACO`: a tela mostra a diferença e o filtro "Só o que falta" separa.
 *
 * Nenhum entra conferido. Conferir é do nutricionista, e é só marcar a caixa.
 *
 * Escolhas que valem saber, porque um nome de catálogo costuma caber em várias
 * linhas da tabela:
 *
 *   Ovo inteiro       cozido (TACO 488), não frito — 50 g por unidade dá
 *                     73 kcal, que é o valor de 70 que ele usa na base de 200.
 *   Frango            peito sem pele grelhado (TACO 410), o corte dos planos.
 *   Carne             patinho sem gordura: cru quando o nome diz "crua"
 *                     (TACO 376), grelhado quando não diz (TACO 377).
 *   Farinha de tapioca  polvilho doce (TACO 146). "Tapioca" na TACO é o prato
 *                     pronto com manteiga, que não é a farinha.
 *   Pasta de amendoim  USDA 713. O 536 da USDA é BISCOITO de amendoim, não a
 *                     pasta — é a armadilha do nome parecido.
 *   Pão de forma      trigo integral (TACO 52). A TACO não tem pão de forma
 *                     branco de fôrma.
 *   Fruta (porção)    a convenção dele: 1 porção = 70 kcal. 100 g por porção,
 *                     com perfil de fruta média.
 */

/**
 * Peso de uma unidade, para o que ele conta em vez de pesar.
 *
 * A tabela dá tudo por 100 g. Sem esse peso não há como saber quanto vale um
 * ovo, uma fatia ou uma dose — e era isso que faltava para a conta fechar.
 */
const PESOS = {
  ovo: 50,            // ovo de galinha tipo grande, sem casca
  fruta: 100,         // porção padrão dos planos
  dose: 30,           // scoop de proteína em pó
  barrinha: 60,
  bebidaProteica: 250,
  poteIogurte: 200,
  paoHamburguer: 50,  // o próprio nome do item já diz 50 g
  legumes: 100,
  fatiaPao: 25,
  fatiaWrap: 45,
};

/** kcal, proteína, carboidrato, gordura e fibra por 100 g. */
const v = (kcal, proteina, carboidrato, gordura, fibra = null) => ({
  kcal, proteina, carboidrato, gordura, fibra,
});

export const VALORES = [
  /* ---------------------------------------------------------- proteínas */
  {
    nome: 'Ovo inteiro',
    porcao100: v(146, 13.3, 0.6, 9.5), fonte: 'TACO', codigoFonte: 'TACO 488',
    gramasPorUnidade: PESOS.ovo, passo: 1, minimo: 1, maximo: 6,
    papel: PAPEIS.ANCORA,
    nota: 'Ovo, de galinha, inteiro, cozido/10minutos. 50 g por unidade = 73 kcal.',
  },
  {
    nome: 'Ovo mexido',
    porcao100: v(146, 13.3, 0.6, 9.5), fonte: 'TACO', codigoFonte: 'TACO 488',
    gramasPorUnidade: PESOS.ovo, passo: 1, minimo: 1, maximo: 6,
    papel: PAPEIS.ANCORA,
    nota: 'Mesmo valor do cozido. A TACO não traz mexido, e o frito (490) tem '
        + '240 kcal por causa da gordura de fritura — mexido sem óleo fica '
        + 'perto do cozido. Se ele fizer com óleo, é caso de subir o valor.',
  },
  {
    nome: 'Frango',
    porcao100: v(159, 32, 0, 2.5), fonte: 'TACO', codigoFonte: 'TACO 410',
    passo: 5, minimo: 50, maximo: 200, papel: PAPEIS.ANCORA,
    nota: 'Frango, peito, sem pele, grelhado.',
  },
  {
    nome: 'Frango, atum ou carne bovina',
    porcao100: v(159, 32, 0, 2.5), fonte: 'TACO', codigoFonte: 'TACO 410',
    passo: 5, minimo: 50, maximo: 200, papel: PAPEIS.ANCORA,
    nota: 'Item que oferece três carnes na mesma linha. Fica com o frango '
        + '(TACO 410), o menor dos três, para a opção não passar da base.',
  },
  {
    nome: 'Atum',
    porcao100: v(166, 26.2, 0, 6), fonte: 'TACO', codigoFonte: 'TACO 277',
    passo: 5, minimo: 50, maximo: 200, papel: PAPEIS.ANCORA,
    nota: 'Atum, conserva em óleo — é o que a TACO tem. Em água escorrido cai '
        + 'para perto de 120 kcal (TACO 278, atum fresco cru, 118).',
  },
  {
    nome: 'Carne',
    porcao100: v(219, 35.9, 0, 7.3), fonte: 'TACO', codigoFonte: 'TACO 377',
    passo: 5, minimo: 50, maximo: 200, papel: PAPEIS.ANCORA,
    nota: 'Carne, bovina, patinho, sem gordura, grelhado — aparece como recheio '
        + 'pronto (beirute, tapioca).',
  },
  {
    nome: 'Carne bovina magra (crua)',
    porcao100: v(133, 21.7, 0, 4.5), fonte: 'TACO', codigoFonte: 'TACO 376',
    passo: 5, minimo: 50, maximo: 200, papel: PAPEIS.ANCORA,
    nota: 'Patinho sem gordura, cru — o nome do item diz crua, e é assim que '
        + 'ele pesa o hambúrguer caseiro antes de ir para a chapa.',
  },
  {
    nome: 'Lombo suíno',
    porcao100: v(210, 35.7, 0, 6.4), fonte: 'TACO', codigoFonte: 'TACO 432',
    passo: 5, minimo: 40, maximo: 180, papel: PAPEIS.ANCORA,
    nota: 'Porco, lombo, assado.',
  },

  /* ------------------------------------------------- receitas dele (patês) */
  {
    nome: 'Patê caseiro de frango',
    porcao100: v(167, 24.9, 0.9, 6.7), fonte: 'estimado', codigoFonte: 'TACO 408 + 468 light',
    passo: 5, minimo: 30, maximo: 150, papel: PAPEIS.ANCORA,
    nota: 'Receita da casa, não existe na tabela. Calculado como 70% de frango '
        + 'peito sem pele cozido (TACO 408: 163 kcal, 31,5 P) e 30% de '
        + 'requeijão light. Se a proporção da receita dele for outra, é aqui '
        + 'que se corrige.',
  },
  {
    nome: 'Patê caseiro de atum',
    porcao100: v(169, 21.2, 0.9, 8.7), fonte: 'estimado', codigoFonte: 'TACO 277 + 468 light',
    passo: 5, minimo: 30, maximo: 150, papel: PAPEIS.ANCORA,
    nota: 'Mesma conta do patê de frango, com atum em conserva (TACO 277) no '
        + 'lugar do frango.',
  },

  /* -------------------------------------------------------- suplementos */
  {
    nome: 'Whey protein',
    porcao100: v(400, 80, 8, 6), fonte: 'estimado', codigoFonte: 'rótulo típico de concentrado',
    gramasPorUnidade: PESOS.dose, passo: 1, minimo: 1, maximo: 3,
    papel: PAPEIS.ANCORA,
    nota: 'Não está em tabela — é produto. Valor de whey concentrado comum: a '
        + 'dose de 30 g dá 120 kcal e 24 g de proteína. Se a aluna usa uma '
        + 'marca específica, vale trocar pelo rótulo dela.',
  },
  {
    nome: 'Proteína em pó',
    porcao100: v(400, 80, 8, 6), fonte: 'estimado', codigoFonte: 'rótulo típico de concentrado',
    gramasPorUnidade: PESOS.dose, passo: 1, minimo: 1, maximo: 3,
    papel: PAPEIS.ANCORA,
    nota: 'Mesmo valor do whey.',
  },
  {
    nome: 'Proteína em pó (diluída em água 150mL)',
    porcao100: v(400, 80, 8, 6), fonte: 'estimado', codigoFonte: 'rótulo típico de concentrado',
    gramasPorUnidade: PESOS.dose, passo: 1, minimo: 1, maximo: 3,
    papel: PAPEIS.ANCORA,
    nota: 'A água não entra na conta — o peso da dose é o do pó.',
  },
  {
    nome: 'Barrinha proteica (+20g proteína)',
    porcao100: v(367, 33.3, 36.7, 10), fonte: 'estimado', codigoFonte: 'rótulo típico',
    gramasPorUnidade: PESOS.barrinha, passo: 1, minimo: 1, maximo: 2,
    papel: PAPEIS.ANCORA,
    nota: 'O próprio nome fixa a proteína: 20 g. Barra de 60 g com esse teor '
        + 'fica em torno de 220 kcal.',
  },
  {
    nome: 'Bebida proteica (+20g proteína)',
    porcao100: v(64, 8, 6, 0.8), fonte: 'estimado', codigoFonte: 'rótulo típico',
    gramasPorUnidade: PESOS.bebidaProteica, passo: 1, minimo: 1, maximo: 2,
    papel: PAPEIS.ANCORA,
    nota: 'Garrafa de 250 mL com 20 g de proteína — cerca de 160 kcal.',
  },
  {
    nome: 'Iogurte (+20g proteína)',
    porcao100: v(65, 10, 5, 0.5), fonte: 'estimado', codigoFonte: 'rótulo típico',
    gramasPorUnidade: PESOS.poteIogurte, passo: 1, minimo: 1, maximo: 2,
    papel: PAPEIS.ANCORA,
    nota: 'Pote de 200 g com 20 g de proteína — cerca de 130 kcal.',
  },

  /* ------------------------------------------------------ carboidratos */
  {
    nome: 'Aveia em flocos',
    porcao100: v(394, 13.9, 66.6, 8.5, 9.1), fonte: 'TACO', codigoFonte: 'TACO 7',
    passo: 5, minimo: 15, maximo: 120, papel: PAPEIS.ESCALA,
    nota: 'Aveia, flocos, crua.',
  },
  {
    nome: 'Farinha de tapioca',
    porcao100: v(351, 0.4, 86.8, 0), fonte: 'TACO', codigoFonte: 'TACO 146',
    passo: 5, minimo: 20, maximo: 150, papel: PAPEIS.ESCALA,
    nota: 'Polvilho, doce — é a goma da crepioca. O item "Tapioca" da TACO '
        + '(551) é o prato pronto com manteiga, 348 kcal e 10,9 g de gordura.',
  },
  {
    nome: 'Granola',
    porcao100: v(451, 10.9, 65.5, 18.2), fonte: 'USDA', codigoFonte: 'USDA 472',
    passo: 5, minimo: 15, maximo: 100, papel: PAPEIS.ESCALA,
    nota: 'A TACO não tem granola. Produto comercial, varia bastante com a '
        + 'quantidade de mel e castanha.',
  },
  {
    nome: 'Mel',
    porcao100: v(309, 0, 84, 0), fonte: 'TACO', codigoFonte: 'TACO 507',
    passo: 5, minimo: 10, maximo: 60, papel: PAPEIS.ESCALA,
    nota: 'Mel, de abelha.',
  },
  {
    nome: 'Pão de forma',
    porcao100: v(253, 9.4, 49.9, 3.7, 6.9), fonte: 'TACO', codigoFonte: 'TACO 52',
    gramasPorUnidade: PESOS.fatiaPao, passo: 5, minimo: 25, maximo: 150, papel: PAPEIS.ESCALA,
    nota: 'Pão, trigo, forma, integral. A TACO não traz o de fôrma branco. '
        + 'Uma fatia pesa cerca de 25 g, para quando o plano contar fatias.',
  },
  {
    nome: 'Pão francês',
    porcao100: v(300, 8, 58.6, 3.1, 2.3), fonte: 'TACO', codigoFonte: 'TACO 53',
    passo: 5, minimo: 25, maximo: 150, papel: PAPEIS.ESCALA,
    nota: 'Pão, trigo, francês.',
  },
  {
    nome: 'Pão de hambúrguer (50g)',
    porcao100: v(286, 9.3, 51.2, 4.7), fonte: 'USDA', codigoFonte: 'USDA 644',
    gramasPorUnidade: PESOS.paoHamburguer, passo: 1, minimo: 1, maximo: 3,
    papel: PAPEIS.ESCALA,
    nota: 'Rolls, hamburger or hotdog. O nome do item já fixa 50 g por unidade '
        + '— dá 143 kcal cada.',
  },
  {
    nome: 'Pão sírio',
    porcao100: v(275, 10.7, 57.1, 0), fonte: 'USDA', codigoFonte: 'USDA 403',
    passo: 5, minimo: 40, maximo: 150, papel: PAPEIS.ESCALA,
    nota: 'Pita. A TACO não tem pão sírio.',
  },
  {
    nome: 'Torrada integral',
    porcao100: v(377, 10.5, 74.6, 3.3), fonte: 'TACO', codigoFonte: 'TACO 63',
    passo: 5, minimo: 15, maximo: 100, papel: PAPEIS.ESCALA,
    nota: 'Torrada, pão francês — a TACO não separa a integral.',
  },
  {
    nome: 'Wrap',
    porcao100: v(310, 8, 51, 8), fonte: 'estimado', codigoFonte: 'tortilha de trigo',
    gramasPorUnidade: PESOS.fatiaWrap, passo: 5, minimo: 45, maximo: 150, papel: PAPEIS.ESCALA,
    nota: 'Nenhuma das duas tabelas traz tortilha de trigo. Valor médio de '
        + 'rótulo; um disco de 45 g dá cerca de 140 kcal.',
  },
  {
    nome: 'Massa para pastel (crua)',
    porcao100: v(310, 6.9, 57.4, 5.5), fonte: 'TACO', codigoFonte: 'TACO 59',
    passo: 5, minimo: 30, maximo: 120, papel: PAPEIS.ESCALA,
    nota: 'Pastel, massa, crua. Na air fryer não ganha a gordura da fritura — '
        + 'o item frito da TACO (60) dobra para 570 kcal.',
  },

  /* ----------------------------------------------------------- laticínios */
  {
    nome: 'Leite desnatado',
    porcao100: v(35, 3.3, 4.9, 0.1), fonte: 'USDA', codigoFonte: 'USDA 121',
    passo: 10, minimo: 100, maximo: 400, papel: PAPEIS.ESCALA,
    nota: 'Milk, nonfat (skim). A TACO só tem o leite desnatado em pó.',
  },
  {
    nome: 'Leite em pó desnatado',
    porcao100: v(362, 34.7, 53, 0.9), fonte: 'TACO', codigoFonte: 'TACO 456',
    passo: 5, minimo: 10, maximo: 60, papel: PAPEIS.ESCALA,
    nota: 'Leite, de vaca, desnatado, pó.',
  },
  {
    nome: 'Leite vegetal',
    porcao100: v(33, 2.9, 1.6, 2), fonte: 'USDA', codigoFonte: 'USDA 727',
    passo: 10, minimo: 100, maximo: 400, papel: PAPEIS.ESCALA,
    nota: 'Soy milk. Leite de amêndoa sem açúcar é bem mais baixo (perto de '
        + '15 kcal), então vale conferir qual ela usa.',
  },
  {
    nome: 'Iogurte desnatado',
    porcao100: v(41, 3.8, 5.8, 0.3), fonte: 'TACO', codigoFonte: 'TACO 449',
    passo: 10, minimo: 100, maximo: 400, papel: PAPEIS.ESCALA,
    nota: 'Iogurte, natural, desnatado.',
  },
  {
    nome: 'Iogurte zero',
    porcao100: v(41, 3.8, 5.8, 0.3), fonte: 'TACO', codigoFonte: 'TACO 449',
    passo: 10, minimo: 100, maximo: 400, papel: PAPEIS.ESCALA,
    nota: 'Mesmo valor do desnatado — "zero" costuma ser zero açúcar, não zero '
        + 'gordura.',
  },
  {
    nome: 'Cottage (opcional)',
    porcao100: v(73, 12.4, 2.7, 0.9), fonte: 'USDA', codigoFonte: 'USDA 61',
    passo: 5, minimo: 15, maximo: 150, papel: PAPEIS.FIXO,
    nota: 'Cottage cheese, low fat (1%). A TACO não tem cottage.',
  },
  {
    nome: 'Ricota (opcional)',
    porcao100: v(140, 12.6, 3.8, 8.1), fonte: 'TACO', codigoFonte: 'TACO 469',
    passo: 5, minimo: 15, maximo: 150, papel: PAPEIS.FIXO,
    nota: 'Queijo, ricota.',
  },
  {
    nome: 'Queijo magro',
    porcao100: v(140, 12.6, 3.8, 8.1), fonte: 'TACO', codigoFonte: 'TACO 469',
    passo: 5, minimo: 15, maximo: 120, papel: PAPEIS.ANCORA,
    nota: 'Fica com a ricota, o mais magro dos queijos da TACO.',
  },
  {
    nome: 'Queijo branco (cottage, ricota ou minas frescal light)',
    porcao100: v(140, 12.6, 3.8, 8.1), fonte: 'TACO', codigoFonte: 'TACO 469',
    passo: 5, minimo: 15, maximo: 150, papel: PAPEIS.ANCORA,
    nota: 'Três queijos na mesma linha; fica com a ricota, que é o do meio. '
        + 'Cottage tem 73 kcal e minas frescal 264 — a diferença entre as '
        + 'pontas é grande, então vale separar se ela usar sempre um deles.',
  },
  {
    nome: 'Queijo branco (minas frescal, cottage ou ricota)',
    porcao100: v(140, 12.6, 3.8, 8.1), fonte: 'TACO', codigoFonte: 'TACO 469',
    passo: 5, minimo: 15, maximo: 150, papel: PAPEIS.ANCORA,
    nota: 'Mesmo item da linha acima, escrito em outra ordem.',
  },
  {
    nome: 'Queijo mussarela light',
    porcao100: v(282, 28.6, 3.6, 17.9), fonte: 'USDA', codigoFonte: 'USDA 70',
    passo: 5, minimo: 15, maximo: 100, papel: PAPEIS.ANCORA,
    nota: 'Mozzarella, part skim milk (low moisture). A muçarela da TACO (463) '
        + 'é a integral, 330 kcal.',
  },
  {
    nome: 'Queijo muçarela light',
    porcao100: v(282, 28.6, 3.6, 17.9), fonte: 'USDA', codigoFonte: 'USDA 70',
    passo: 5, minimo: 15, maximo: 100, papel: PAPEIS.ANCORA,
    nota: 'Mesmo queijo da linha acima, com a outra grafia.',
  },
  {
    nome: 'Queijo muçarela light ou de búfala',
    porcao100: v(282, 28.6, 3.6, 17.9), fonte: 'USDA', codigoFonte: 'USDA 70',
    passo: 5, minimo: 15, maximo: 100, papel: PAPEIS.ANCORA,
    nota: 'Mesmo queijo da linha acima.',
  },
  {
    nome: 'Muçarela light ou de búfala',
    porcao100: v(282, 28.6, 3.6, 17.9), fonte: 'USDA', codigoFonte: 'USDA 70',
    passo: 5, minimo: 15, maximo: 100, papel: PAPEIS.ANCORA,
    nota: 'Mesmo queijo da linha acima.',
  },
  {
    nome: 'Requeijão light',
    porcao100: v(170, 9.5, 3, 13), fonte: 'estimado', codigoFonte: 'TACO 468 com metade da gordura',
    passo: 5, minimo: 10, maximo: 60, papel: PAPEIS.FIXO,
    nota: 'A TACO só tem o requeijão cremoso comum (468: 257 kcal, 23,4 g de '
        + 'gordura). O light corta perto da metade da gordura.',
  },
  {
    nome: 'Requeijão light (opcional)',
    porcao100: v(170, 9.5, 3, 13), fonte: 'estimado', codigoFonte: 'TACO 468 com metade da gordura',
    passo: 5, minimo: 10, maximo: 60, papel: PAPEIS.FIXO,
    nota: 'Mesmo item da linha acima.',
  },

  /* ---------------------------------------------------- frutas e vegetais */
  {
    nome: 'Fruta (porção padrão)',
    porcao100: v(70, 0.8, 16, 0.2, 2), fonte: 'estimado', codigoFonte: 'convenção do plano',
    gramasPorUnidade: PESOS.fruta, passo: 1, minimo: 1, maximo: 5,
    papel: PAPEIS.ESCALA,
    nota: 'A regra dele: uma porção de fruta vale 70 kcal. É o número que ele '
        + 'usou para montar a base de 200 (2 ovos + 1 fruta = 210). Perfil de '
        + 'fruta média; a banana prata, por exemplo, é 98 kcal por 100 g '
        + '(TACO 182).',
  },
  {
    nome: 'Legumes e verduras (à vontade)',
    porcao100: v(25, 1.5, 5, 0.2, 2.2), fonte: 'estimado', codigoFonte: 'média de legumes da TACO',
    gramasPorUnidade: PESOS.legumes, passo: 1,
    papel: PAPEIS.FIXO,
    nota: '"À vontade" quer dizer que ele não pesa. O valor existe para o caso '
        + 'de alguém lançar uma quantidade, e é baixo de propósito.',
  },
  {
    nome: 'Alface (opcional)',
    porcao100: v(11, 1.3, 1.7, 0.2, 1.8), fonte: 'TACO', codigoFonte: 'TACO 78',
    passo: 5, papel: PAPEIS.FIXO,
    nota: 'Alface, crespa, crua.',
  },
  {
    nome: 'Tomate (opcional)',
    porcao100: v(15, 1.1, 3.1, 0.2, 1.2), fonte: 'TACO', codigoFonte: 'TACO 157',
    passo: 5, papel: PAPEIS.FIXO,
    nota: 'Tomate, com semente, cru.',
  },

  /* --------------------------------------------------- gorduras e doces */
  {
    nome: 'Pasta de amendoim',
    porcao100: v(594, 25, 18.8, 50, 5), fonte: 'USDA', codigoFonte: 'USDA 713',
    passo: 5, minimo: 10, maximo: 60, papel: PAPEIS.ESCALA,
    nota: 'Peanut butter, regular, smooth style. Cuidado com o USDA 536, que '
        + 'aparece na busca por "peanut butter" e é BISCOITO de amendoim.',
  },
  {
    nome: 'Chocolate 55%+',
    porcao100: v(475, 4.9, 62.4, 29.9), fonte: 'TACO', codigoFonte: 'TACO 498',
    passo: 5, minimo: 10, maximo: 70, papel: PAPEIS.ESCALA,
    nota: 'Chocolate, meio amargo. Acima de 70% o açúcar cai e a gordura sobe, '
        + 'mas a caloria fica parecida.',
  },
  {
    nome: 'Paçoca',
    porcao100: v(487, 16, 52.4, 26.1), fonte: 'TACO', codigoFonte: 'TACO 579',
    passo: 5, minimo: 15, maximo: 80, papel: PAPEIS.ESCALA,
    nota: 'Paçoca, amendoim.',
  },
  {
    nome: 'Doce de leite',
    porcao100: v(306, 5.5, 59.5, 6), fonte: 'TACO', codigoFonte: 'TACO 501',
    passo: 5, minimo: 15, maximo: 100, papel: PAPEIS.ESCALA,
    nota: 'Doce, de leite, cremoso.',
  },

  /* --------------------------------------------------------- condimentos */
  {
    nome: 'Ketchup',
    porcao100: v(104, 1.7, 27.1, 0.4), fonte: 'USDA', codigoFonte: 'USDA 1231',
    passo: 5, papel: PAPEIS.FIXO,
    nota: 'Catsup.',
  },
  {
    nome: 'Mostarda',
    porcao100: v(60, 0, 0, 0), fonte: 'USDA', codigoFonte: 'USDA 1245',
    passo: 5, papel: PAPEIS.FIXO,
    nota: 'Mustard, prepared, yellow. A USDA publica por colher de chá de 5 g, '
        + 'onde tudo arredonda para traço — daí os macros zerados.',
  },
  {
    nome: 'Molho de tomate',
    porcao100: v(38, 1.4, 7.7, 0.9, 1.3), fonte: 'TACO', codigoFonte: 'TACO 159',
    passo: 5, papel: PAPEIS.FIXO,
    nota: 'Tomate, molho industrializado.',
  },
];

/** Nome sem acento e sem caixa, para casar com o que está no banco. */
const chave = (s) =>
  String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Preenche o catálogo, campo por campo e só onde está vazio.
 *
 * O seed roda a cada deploy, então ele não pode passar por cima do que o
 * nutricionista ajustou — se ele corrigiu a gramatura do ovo ou conferiu o
 * valor do frango, aquilo fica. Por outro lado, campo que nunca foi
 * preenchido deve ganhar valor mesmo que o alimento já tenha os outros: foi
 * assim que os mínimos práticos chegaram a um catálogo que já tinha caloria.
 */
export async function seedValoresNutricionais(db) {
  db.data.alimentos ||= [];
  const porNome = new Map(VALORES.map((x) => [chave(x.nome), x]));

  let comValor = 0;
  let complementados = 0;
  for (const alimento of db.data.alimentos) {
    const ref = porNome.get(chave(alimento.nome));
    if (!ref) continue;

    if (!alimento.porcao100?.kcal) {
      alimento.porcao100 = { ...ref.porcao100 };
      alimento.fonte = ref.fonte;
      alimento.codigoFonte = ref.codigoFonte;
      alimento.conferido = false;   // valor de tabela não é valor conferido
      comValor++;
    }

    /* A nota explica de onde o número veio; vale reescrever sempre, porque é
       documentação do seed e não escolha dele. */
    alimento.notaFonte = ref.nota;

    let mexeu = false;
    for (const campo of ['gramasPorUnidade', 'passo', 'minimo', 'maximo']) {
      if (ref[campo] == null || alimento[campo] != null) continue;
      alimento[campo] = ref[campo];
      mexeu = true;
    }
    if (mexeu) complementados++;
  }
  const preenchidos = comValor;

  /* O papel só faz sentido dentro da opção, então vai nas trocas dos bancos —
     e também só onde ainda não foi definido. */
  let papeis = 0;
  for (const banco of db.data.bancosOpcoes || []) {
    for (const opcao of banco.opcoes || []) {
      for (const item of opcao.itens || []) {
        for (const troca of item.opcoes || []) {
          if (troca.papel) continue;
          const ref = porNome.get(chave(troca.nome));
          if (!ref?.papel) continue;
          troca.papel = ref.papel;
          papeis++;
        }
      }
    }
  }

  if (preenchidos || complementados || papeis) {
    await db.write();
    console.log(
      `[dieta] ${preenchidos} alimentos com valor nutricional, ` +
      `${complementados} com passo/limites, ${papeis} papéis definidos`
    );
  }
}
