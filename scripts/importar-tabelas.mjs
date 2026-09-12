#!/usr/bin/env node
/**
 * Converte a TACO e a USDA para o formato que o app calcula.
 *
 * As duas tabelas são as que o nutricionista usa, e nenhuma das duas vem num
 * formato que o app consiga somar: a TACO é um PDF de 164 páginas e a USDA
 * publica por medida caseira ("1 fatia", "1 xícara"), não por 100 g.
 *
 * Uso:
 *   node scripts/importar-tabelas.mjs <taco.md> <usda.md>
 *
 * Escreve server/src/dados/taco.json e usda.json. O script é a fonte da
 * verdade da conversão: se um valor no app estiver errado, é aqui que se
 * conserta e reimporta, não na mão no banco.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = path.join(RAIZ, 'server', 'src', 'dados');

/**
 * Número de uma célula da tabela.
 *
 * "Tr" é traço — quantidade detectável mas pequena demais para medir, e vira
 * zero. "NA" e célula vazia são ausência de análise, e viram nulo: dizer zero
 * ali seria afirmar que o alimento não tem aquilo, que é coisa diferente.
 */
function numero(cel) {
  if (cel == null) return null;
  const t = String(cel).trim();
  if (t === '' || t === 'NA' || t === '*') return null;
  if (t === 'Tr') return 0;
  const n = Number(t.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Número da USDA, que usa ponto decimal e vírgula de milhar. */
function numeroEn(cel) {
  if (cel == null) return null;
  const t = String(cel).trim();
  if (t === '' || t === 'NA' || t === '*') return null;
  if (t === 'Tr') return 0;
  const n = Number(t.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

const celulas = (linha) => linha.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

/** Tira o negrito e as âncoras que sobraram da conversão do PDF. */
const limpar = (s) => s.replace(/\*\*/g, '').replace(/<[^>]+>/g, '').trim();

/* ------------------------------------------------------------------- TACO */

function lerTaco(arquivo) {
  const linhas = fs.readFileSync(arquivo, 'utf8').split('\n');
  const porCodigo = new Map();

  for (let i = 0; i < linhas.length; i++) {
    if (!linhas[i].includes('Número do alimento') || !linhas[i].includes('Energia (kcal)')) continue;
    const col = Object.fromEntries(celulas(linhas[i]).map((c, k) => [c, k]));

    for (let j = i + 2; j < linhas.length && linhas[j].startsWith('|'); j++) {
      const c = celulas(linhas[j]);
      if (!/^\d+$/.test(c[0])) continue;
      const codigo = Number(c[0]);
      if (porCodigo.has(codigo)) continue;   // a tabela se repete a cada página

      const kcal = numero(c[col['Energia (kcal)']]);
      if (kcal == null) continue;            // sem energia não serve para calcular

      porCodigo.set(codigo, {
        codigo: String(codigo),
        nome: limpar(c[col['Descrição dos alimentos']]),
        kcal,
        proteina: numero(c[col['Proteína (g)']]),
        carboidrato: numero(c[col['Carboidrato (g)']]),
        gordura: numero(c[col['Lipídeos (g)']]),
        fibra: numero(c[col['Fibra alimentar (g)']]),
      });
    }
  }

  return [...porCodigo.values()].sort((a, b) => Number(a.codigo) - Number(b.codigo));
}

/* ------------------------------------------------------------------- USDA */

/**
 * Os quinze grupos de primeiro nível da publicação. Servem de âncora: sem
 * eles não há como saber se um título em negrito abriu uma seção nova ou é
 * mais um subtítulo dentro da anterior.
 */
const SECOES_USDA = [
  'Beverages', 'Dairy Products', 'Eggs', 'Fats and Oils', 'Fish and Shellfish',
  'Fruits and Fruit Juices', 'Grain Products', 'Legumes, Nuts, and Seeds',
  'Meat and Meat Products', 'Mixed Dishes and Fast Foods',
  'Poultry and Poultry Products', 'Soups, Sauces, and Gravies',
  'Sugars and Sweets', 'Vegetables and Vegetable Products', 'Miscellaneous Items',
];

/**
 * A USDA publica por medida caseira, com o peso ao lado ("1 slice, 26 g").
 * Para virar valor por 100 g é regra de três — e sem o peso não há conversão
 * possível, então a linha fica de fora em vez de entrar com número torto.
 *
 * A descrição sozinha também não identifica o alimento: nessa tabela
 * "Regular" quer dizer "Beer, Regular". O contexto vem dos títulos em negrito
 * que vêm antes, e ler esses títulos tem duas armadilhas. Eles quebram em
 * várias linhas ("Mixed drinks, prepared from" + "recipe" são um título só),
 * e se repetem no alto de cada página com "(continued)". Daí juntar as linhas
 * de negrito seguidas num rótulo só, e reconhecer a seção por lista fixa em
 * vez de adivinhar nível por posição — que a conversão do PDF não preserva.
 */
function lerUsda(arquivo) {
  const linhas = fs.readFileSync(arquivo, 'utf8').split('\n');
  const porCodigo = new Map();

  /* "Beverages (continued)" é o mesmo grupo repetido no alto da página. A
     conversão às vezes parte esse "(continued)" ao meio, então tira em
     qualquer posição, não só no fim. */
  const semContinuacao = (t) => t.replace(/\s*\(continue[^)]*\)?/gi, '').replace(/\s+/g, ' ').trim();
  /* "Butter. See Fats and Oils." é remissiva para outra página, não um grupo. */
  const ehRemissiva = (t) => /\bSee\b/.test(t);
  /* Título que quebrou em duas linhas: a segunda começa em minúscula
     ("Mixed drinks, prepared from" + "recipe"). Título novo começa maiúsculo. */
  const ehContinuacaoDeLinha = (t) => /^[a-z]/.test(t);

  for (let i = 0; i < linhas.length; i++) {
    if (!linhas[i].includes('Food No.') || !linhas[i].includes('Calories (kcal)')) continue;
    const col = Object.fromEntries(celulas(linhas[i]).map((c, k) => [c, k]));
    let secao = '';
    let subgrupo = '';
    let pedacos = [];

    for (let j = i + 2; j < linhas.length && linhas[j].startsWith('|'); j++) {
      const c = celulas(linhas[j]);
      const desc = limpar(c[col['Food description']] || '');

      if (!/^\d+$/.test(c[0])) {
        if (!desc) continue;
        if (pedacos.length && ehContinuacaoDeLinha(desc)) pedacos[pedacos.length - 1] += ` ${desc}`;
        else pedacos.push(desc);
        continue;
      }

      // Fecha os títulos que vinham sendo montados nas linhas de negrito acima.
      for (const bruto of pedacos) {
        const rotulo = semContinuacao(bruto);
        if (!rotulo || ehRemissiva(rotulo)) continue;
        if (SECOES_USDA.includes(rotulo)) {
          secao = rotulo;
          subgrupo = '';
        } else {
          subgrupo = rotulo;
        }
      }
      pedacos = [];

      const codigo = Number(c[0]);
      if (porCodigo.has(codigo)) continue;

      const gramas = numeroEn(c[col['Weight (g)']]);
      const kcal = numeroEn(c[col['Calories (kcal)']]);
      if (!gramas || kcal == null) continue;

      const por100 = (v) => (v == null ? null : Math.round((v * 100 / gramas) * 10) / 10);

      porCodigo.set(codigo, {
        codigo: String(codigo),
        nome: [...new Set([secao, subgrupo, desc].filter(Boolean))].join(', '),
        medida: limpar(c[col['Measure of edible portion']] || ''),
        gramasDaMedida: gramas,
        kcal: Math.round(kcal * 100 / gramas),
        proteina: por100(numeroEn(c[col['Protein (g)']])),
        carboidrato: por100(numeroEn(c[col['Carbohydrate (g)']])),
        gordura: por100(numeroEn(c[col['Total fat (g)']])),
        fibra: por100(numeroEn(c[col['Total dietary fiber (g)']])),
      });
    }
  }

  return [...porCodigo.values()].sort((a, b) => Number(a.codigo) - Number(b.codigo));
}

/* ------------------------------------------------------------------ saída */

const [arqTaco, arqUsda] = process.argv.slice(2);
if (!arqTaco) {
  console.error('uso: node scripts/importar-tabelas.mjs <taco.md> [usda.md]');
  process.exit(1);
}

fs.mkdirSync(SAIDA, { recursive: true });

const taco = lerTaco(arqTaco);
fs.writeFileSync(
  path.join(SAIDA, 'taco.json'),
  JSON.stringify({
    fonte: 'TACO',
    titulo: 'Tabela Brasileira de Composição de Alimentos — TACO, 4ª edição revisada e ampliada',
    instituicao: 'NEPA / UNICAMP, Campinas, 2011',
    unidade: 'por 100 g de parte comestível',
    alimentos: taco,
  }, null, 1) + '\n'
);
console.log(`TACO: ${taco.length} alimentos`);

if (arqUsda) {
  const usda = lerUsda(arqUsda);
  fs.writeFileSync(
    path.join(SAIDA, 'usda.json'),
    JSON.stringify({
      fonte: 'USDA',
      titulo: 'Nutritive Value of Foods — Home and Garden Bulletin 72',
      instituicao: 'U.S. Department of Agriculture, Agricultural Research Service, 2002',
      unidade: 'por 100 g, convertido da medida caseira publicada',
      alimentos: usda,
    }, null, 1) + '\n'
  );
  console.log(`USDA: ${usda.length} alimentos`);
}
