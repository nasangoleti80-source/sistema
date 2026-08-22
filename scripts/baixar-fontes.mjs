#!/usr/bin/env node
/**
 * Baixa as fontes da marca do Google Fonts para dentro do projeto.
 *
 *   node scripts/baixar-fontes.mjs
 *
 * Pega só os subconjuntos latin e latin-ext (é o que o português usa), grava os
 * .woff2 em web/src/estilos/fontes/ e regrava web/src/estilos/fontes.css
 * apontando para eles. Depois é só rodar `npm run build`.
 *
 * Sem dependências: usa fetch, que o Node 18+ já traz.
 */
import { mkdir, writeFile, readdir, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASTA = join(RAIZ, 'web/src/estilos/fontes');
const CSS_FINAL = join(RAIZ, 'web/src/estilos/fontes.css');

const FAMILIAS =
  'family=Archivo:wght@400;500;600;700' +
  '&family=Archivo+Black' +
  '&family=Instrument+Serif:ital@0;1' +
  '&family=JetBrains+Mono:wght@400;500;700';

const SUBCONJUNTOS = new Set(['latin', 'latin-ext']);

// Sem um user-agent de navegador moderno o Google devolve .ttf em vez de .woff2.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const campo = (bloco, nome) => bloco.match(new RegExp(`${nome}:\\s*([^;]+);`))?.[1].trim() ?? '';

async function baixar(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ao buscar ${url}`);
  return res;
}

const cssRemoto = await (await baixar(`https://fonts.googleapis.com/css2?${FAMILIAS}&display=swap`)).text();

// Cada @font-face vem precedido de um comentário com o nome do subconjunto.
const blocos = [...cssRemoto.matchAll(/\/\*\s*([a-z0-9-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)];
if (!blocos.length) throw new Error('não achei nenhum @font-face — o formato do Google mudou?');

await mkdir(PASTA, { recursive: true });
for (const f of await readdir(PASTA)) {
  if (f.endsWith('.woff2')) await unlink(join(PASTA, f));
}

const porUrl = new Map(); // Archivo e JetBrains Mono são variáveis: um arquivo serve vários pesos
const regras = [];

for (const [, subconjunto, bloco] of blocos) {
  if (!SUBCONJUNTOS.has(subconjunto)) continue;

  const familia = campo(bloco, 'font-family').replace(/['"]/g, '');
  const peso = campo(bloco, 'font-weight');
  const estilo = campo(bloco, 'font-style');
  const largura = campo(bloco, 'font-stretch');
  const faixa = campo(bloco, 'unicode-range');
  const url = bloco.match(/url\((https:\/\/[^)]+)\)/)[1];

  let arquivo = porUrl.get(url);
  if (!arquivo) {
    arquivo = `${familia.toLowerCase().replace(/ /g, '-')}-${peso.replace(/ /g, '_')}-${estilo}-${subconjunto}.woff2`;
    const dados = Buffer.from(await (await baixar(url)).arrayBuffer());
    if (!dados.length) throw new Error(`veio vazio: ${url}`);
    await writeFile(join(PASTA, arquivo), dados);
    porUrl.set(url, arquivo);
    console.log(`  ${String(Math.round(dados.length / 1024)).padStart(4)} KB  ${arquivo}`);
  }

  regras.push(
    [
      `/* ${familia} ${peso} ${estilo} — ${subconjunto} */`,
      '@font-face {',
      `  font-family: '${familia}';`,
      `  font-style: ${estilo};`,
      `  font-weight: ${peso};`,
      ...(largura ? [`  font-stretch: ${largura};`] : []),
      '  font-display: swap;',
      `  src: url('./fontes/${arquivo}') format('woff2');`,
      `  unicode-range: ${faixa};`,
      '}',
    ].join('\n')
  );
}

const cabecalho = `/* Fontes da marca, servidas pelo próprio projeto.
   Baixadas do Google Fonts (Open Font License) e versionadas aqui para que o
   app não dependa da rede nem entregue IP das alunas a terceiros.

   Só os subconjuntos latin e latin-ext — é o que o português usa.

   NÃO EDITE À MÃO: este arquivo é gerado por scripts/baixar-fontes.mjs.

     Archivo          — interface e corpo
     Archivo Black    — caixa alta esportiva
     Instrument Serif — títulos
     JetBrains Mono   — números
*/

`;

await writeFile(CSS_FINAL, cabecalho + regras.join('\n\n') + '\n');
console.log(`\n${porUrl.size} arquivos, ${regras.length} regras @font-face gravadas em web/src/estilos/fontes.css`);
console.log('Rode `npm run build` e confira que as quatro famílias ainda aparecem.');
