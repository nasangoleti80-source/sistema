import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { FONTES, NUTRIENTES, ehContagem } from '../../../compartilhado/nutricao.js';

const router = Router();

/**
 * Catálogo de alimentos.
 *
 * O cadastro guardava só nome e unidade, o que dava para escrever uma dieta mas
 * não para calculá-la. Agora cada alimento carrega o valor por 100 g e a fonte
 * de onde ele veio — TACO (Unicamp) ou USDA, as duas tabelas que o
 * nutricionista usa. Sem isso o motor de bases calóricas não tem com o que
 * contar.
 *
 * `conferido` começa falso de propósito: valor digitado não vira valor
 * validado. Quem assina a dieta é o nutricionista, e a tela mostra a diferença.
 */

const numeroOuNulo = (v) => (v === undefined || v === null || v === '' ? null : Number(v));

/** Valor por 100 g/mL. Campo em branco fica nulo, e nulo aparece como "falta". */
function lerPorcao100(entrada) {
  if (!entrada || typeof entrada !== 'object') return null;
  const fora = {};
  let algum = false;
  for (const n of NUTRIENTES) {
    const v = numeroOuNulo(entrada[n]);
    if (v !== null && !Number.isNaN(v)) {
      fora[n] = v;
      algum = true;
    }
  }
  return algum ? fora : null;
}

/** Campos que o corpo da requisição pode mudar, já limpos. */
function camposDoCorpo(body, atual = {}) {
  const m = {};
  if (body.nome !== undefined) m.nome = String(body.nome).trim();
  if (body.unidade !== undefined) m.unidade = body.unidade || 'g';
  if (body.quantidadePadrao !== undefined) m.quantidadePadrao = numeroOuNulo(body.quantidadePadrao);
  if (body.categoria !== undefined) m.categoria = body.categoria || 'outro';

  if (body.porcao100 !== undefined) m.porcao100 = lerPorcao100(body.porcao100);
  if (body.gramasPorUnidade !== undefined) m.gramasPorUnidade = numeroOuNulo(body.gramasPorUnidade);
  if (body.passo !== undefined) m.passo = numeroOuNulo(body.passo);
  if (body.minimo !== undefined) m.minimo = numeroOuNulo(body.minimo);
  if (body.maximo !== undefined) m.maximo = numeroOuNulo(body.maximo);
  if (body.fonte !== undefined) m.fonte = FONTES.includes(body.fonte) ? body.fonte : null;
  if (body.codigoFonte !== undefined) m.codigoFonte = body.codigoFonte ? String(body.codigoFonte).trim() : null;

  /* Mexer no valor derruba a conferência: o número conferido era o antigo. */
  if (body.conferido !== undefined) m.conferido = !!body.conferido;
  else if (m.porcao100 !== undefined && atual.conferido) m.conferido = false;

  return m;
}

/** O que falta para o alimento entrar numa conta — dito na resposta, não adivinhado na tela. */
function pendencias(a) {
  const falta = [];
  if (!a.porcao100 || !a.porcao100.kcal) falta.push('valor nutricional');
  if (ehContagem(a.unidade) && !a.gramasPorUnidade) falta.push('gramas por unidade');
  if (a.porcao100 && !a.fonte) falta.push('fonte');
  return falta;
}

const comPendencias = (a) => ({ ...a, pendencias: pendencias(a) });

router.get('/', async (req, res) => {
  await db.read();
  const { categoria, incompletos } = req.query;
  let alimentos = db.data.alimentos.map(comPendencias);
  if (categoria) alimentos = alimentos.filter((a) => a.categoria === categoria);
  if (incompletos === 'true') alimentos = alimentos.filter((a) => a.pendencias.length > 0);
  res.json(alimentos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
});

router.post('/', async (req, res) => {
  const campos = camposDoCorpo(req.body);
  if (!campos.nome) return res.status(400).json({ error: 'Nome é obrigatório' });
  await db.read();
  const alimento = {
    id: nanoid(10),
    unidade: 'g',
    quantidadePadrao: null,
    categoria: 'outro',
    porcao100: null,
    gramasPorUnidade: null,
    passo: null,
    minimo: null,
    maximo: null,
    fonte: null,
    codigoFonte: null,
    conferido: false,
    ...campos,
    createdAt: new Date().toISOString(),
  };
  db.data.alimentos.push(alimento);
  await db.write();
  res.status(201).json(comPendencias(alimento));
});

router.put('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.alimentos.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Alimento não encontrado' });
  const atual = db.data.alimentos[idx];
  const campos = camposDoCorpo(req.body, atual);
  if (campos.nome !== undefined && !campos.nome) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }
  const atualizado = { ...atual, ...campos };
  db.data.alimentos[idx] = atualizado;
  await db.write();
  res.json(comPendencias(atualizado));
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.alimentos.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Alimento não encontrado' });
  db.data.alimentos.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

export default router;
