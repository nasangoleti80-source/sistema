import { Router } from 'express';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const taco = require('../dados/taco.json');
const usda = require('../dados/usda.json');

/**
 * Consulta às tabelas de composição de alimentos.
 *
 * São as duas com que o nutricionista trabalha: a TACO, da Unicamp, para
 * quase tudo, e a USDA para o que a TACO não cobre (produto importado,
 * suplemento). Ficam como JSON no repositório, geradas por
 * `scripts/importar-tabelas.mjs` — dado de referência não muda, então não tem
 * por que morar no banco nem depender de rede.
 *
 * Isto é só leitura. O que o app grava é a cópia que ele escolheu, com o
 * código da tabela junto, para dar sempre para conferir de onde o número veio.
 */

const router = Router();

const FONTES = { TACO: taco, USDA: usda };

/** Busca sem acento e sem caixa: "proteina" acha "Proteína". */
const normalizar = (s) =>
  String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Ordena pelo que um humano chamaria de "mais parecido": o que começa com o
 * termo vem antes do que só o contém, e entre iguais vence o nome mais curto —
 * "Ovo, de galinha, inteiro, cru" antes de "Torta de ovo com legumes".
 */
function ordenarPorRelevancia(lista, termo) {
  return lista
    .map((a) => {
      const n = normalizar(a.nome);
      const pos = n.indexOf(termo);
      return { a, peso: pos === 0 ? 0 : 1, pos, tam: a.nome.length };
    })
    .sort((x, y) => x.peso - y.peso || x.pos - y.pos || x.tam - y.tam)
    .map((x) => x.a);
}

router.get('/', (req, res) => {
  const { q, fonte, limite } = req.query;
  const termo = normalizar(q);
  if (termo.length < 2) {
    return res.status(400).json({ error: 'Busque por pelo menos duas letras' });
  }

  const max = Math.min(Number(limite) || 25, 100);
  const escolhidas = fonte && FONTES[fonte] ? [fonte] : ['TACO', 'USDA'];
  const resultados = [];

  // TACO primeiro: é a tabela de referência dele, e a USDA entra para o que
  // ela não tem. Trocar a ordem faria um alimento brasileiro vir com valor
  // americano sem ninguém perceber.
  for (const nomeFonte of escolhidas) {
    const tabela = FONTES[nomeFonte];
    const achados = tabela.alimentos.filter((a) => normalizar(a.nome).includes(termo));
    for (const a of ordenarPorRelevancia(achados, termo)) {
      resultados.push({ ...a, fonte: nomeFonte });
      if (resultados.length >= max) break;
    }
    if (resultados.length >= max) break;
  }

  res.json({
    termo: q,
    total: resultados.length,
    resultados,
  });
});

/** De onde vieram os números — para a tela poder citar a edição. */
router.get('/fontes', (req, res) => {
  res.json(
    Object.entries(FONTES).map(([chave, t]) => ({
      fonte: chave,
      titulo: t.titulo,
      instituicao: t.instituicao,
      unidade: t.unidade,
      alimentos: t.alimentos.length,
    }))
  );
});

export default router;
