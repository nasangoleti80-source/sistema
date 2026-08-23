import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';

const router = Router();

const limpar = (v) => (typeof v === 'string' ? v.trim() : '');
const LETRAS = 'ABCDEFGH';

/** Dias da semana como o JS conta: 0 = domingo. */
const normalizarDias = (dias) =>
  Array.isArray(dias) ? [...new Set(dias.map(Number).filter((d) => d >= 0 && d <= 6))].sort() : [];

/** Localiza treino, sessão e item de uma vez; devolve o que faltou. */
async function achar({ treinoId, sessaoId, itemId }) {
  await db.read();
  const treino = db.data.treinos.find((t) => t.id === treinoId);
  if (!treino) return { erro: 'Treino não encontrado' };
  if (!sessaoId) return { treino };
  const sessao = treino.sessoes.find((s) => s.id === sessaoId);
  if (!sessao) return { erro: 'Sessão não encontrada' };
  if (!itemId) return { treino, sessao };
  const item = sessao.itens.find((i) => i.id === itemId);
  if (!item) return { erro: 'Exercício não encontrado nesta sessão' };
  return { treino, sessao, item };
}

/* --------------------------------------------------------------- programas */

router.get('/', async (req, res) => {
  await db.read();
  const { alunoId } = req.query;
  let lista = db.data.treinos;
  if (alunoId) lista = lista.filter((t) => t.alunoId === alunoId);
  res.json([...lista].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

router.get('/:id', async (req, res) => {
  const { treino, erro } = await achar({ treinoId: req.params.id });
  if (erro) return res.status(404).json({ error: erro });
  res.json(treino);
});

router.post('/', async (req, res) => {
  const { alunoId, nome } = req.body;
  if (!limpar(nome)) return res.status(400).json({ error: 'Dê um nome ao treino' });
  await db.read();
  if (!db.data.alunos.some((a) => a.id === alunoId)) {
    return res.status(400).json({ error: 'Aluno não encontrado' });
  }
  const treino = {
    id: nanoid(10),
    alunoId,
    nome: limpar(nome),
    observacoes: limpar(req.body.observacoes),
    ativo: true,
    sessoes: [],
    createdAt: new Date().toISOString(),
  };
  db.data.treinos.push(treino);
  await db.write();
  res.status(201).json(treino);
});

router.put('/:id', async (req, res) => {
  const { treino, erro } = await achar({ treinoId: req.params.id });
  if (erro) return res.status(404).json({ error: erro });
  const { nome, observacoes, ativo } = req.body;
  if (nome !== undefined && !limpar(nome)) return res.status(400).json({ error: 'Dê um nome ao treino' });
  if (nome !== undefined) treino.nome = limpar(nome);
  if (observacoes !== undefined) treino.observacoes = limpar(observacoes);
  if (ativo !== undefined) treino.ativo = Boolean(ativo);
  await db.write();
  res.json(treino);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.treinos.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Treino não encontrado' });
  db.data.treinos.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

/** Copia o treino inteiro — é como se monta o mês seguinte a partir do atual. */
router.post('/:id/duplicar', async (req, res) => {
  const { treino, erro } = await achar({ treinoId: req.params.id });
  if (erro) return res.status(404).json({ error: erro });
  const copia = {
    ...structuredClone(treino),
    id: nanoid(10),
    nome: limpar(req.body?.nome) || `${treino.nome} (cópia)`,
    alunoId: req.body?.alunoId || treino.alunoId,
    ativo: true,
    createdAt: new Date().toISOString(),
  };
  // Ids novos em tudo, senão as duas cópias apontam para os mesmos registros.
  copia.sessoes = copia.sessoes.map((s) => ({
    ...s,
    id: nanoid(10),
    itens: s.itens.map((i) => ({ ...i, id: nanoid(10) })),
  }));
  if (!db.data.alunos.some((a) => a.id === copia.alunoId)) {
    return res.status(400).json({ error: 'Aluno não encontrado' });
  }
  db.data.treinos.push(copia);
  await db.write();
  res.status(201).json(copia);
});

/* ----------------------------------------------------------------- sessões */

router.post('/:id/sessoes', async (req, res) => {
  const { treino, erro } = await achar({ treinoId: req.params.id });
  if (erro) return res.status(404).json({ error: erro });
  const sessao = {
    id: nanoid(10),
    letra: LETRAS[treino.sessoes.length] || String(treino.sessoes.length + 1),
    nome: limpar(req.body.nome) || `Treino ${LETRAS[treino.sessoes.length] || ''}`.trim(),
    dias: normalizarDias(req.body.dias),
    itens: [],
  };
  treino.sessoes.push(sessao);
  await db.write();
  res.status(201).json(sessao);
});

router.put('/:id/sessoes/:sessaoId', async (req, res) => {
  const { sessao, erro } = await achar({ treinoId: req.params.id, sessaoId: req.params.sessaoId });
  if (erro) return res.status(404).json({ error: erro });
  const { nome, dias } = req.body;
  if (nome !== undefined && !limpar(nome)) return res.status(400).json({ error: 'Dê um nome à sessão' });
  if (nome !== undefined) sessao.nome = limpar(nome);
  if (dias !== undefined) sessao.dias = normalizarDias(dias);
  await db.write();
  res.json(sessao);
});

router.delete('/:id/sessoes/:sessaoId', async (req, res) => {
  const { treino, erro } = await achar({ treinoId: req.params.id, sessaoId: req.params.sessaoId });
  if (erro) return res.status(404).json({ error: erro });
  treino.sessoes = treino.sessoes.filter((s) => s.id !== req.params.sessaoId);
  // Reetiqueta: sem isso sobra A, C, D depois de apagar a B.
  treino.sessoes.forEach((s, i) => {
    s.letra = LETRAS[i] || String(i + 1);
  });
  await db.write();
  res.status(204).end();
});

/* --------------------------------------------------- exercícios da sessão */

router.post('/:id/sessoes/:sessaoId/itens', async (req, res) => {
  const { sessao, erro } = await achar({ treinoId: req.params.id, sessaoId: req.params.sessaoId });
  if (erro) return res.status(404).json({ error: erro });
  const { exercicioId } = req.body;
  if (!db.data.exercicios.some((e) => e.id === exercicioId)) {
    return res.status(400).json({ error: 'Exercício não encontrado no seu catálogo' });
  }
  const item = {
    id: nanoid(10),
    exercicioId,
    series: Number(req.body.series) || 3,
    reps: limpar(req.body.reps) || '12',
    descanso: Number(req.body.descanso) || 60,
    rir: req.body.rir === '' || req.body.rir === undefined ? null : Number(req.body.rir),
    observacao: limpar(req.body.observacao),
  };
  sessao.itens.push(item);
  await db.write();
  res.status(201).json(item);
});

router.put('/:id/sessoes/:sessaoId/itens/:itemId', async (req, res) => {
  const { item, erro } = await achar({
    treinoId: req.params.id,
    sessaoId: req.params.sessaoId,
    itemId: req.params.itemId,
  });
  if (erro) return res.status(404).json({ error: erro });
  const { series, reps, descanso, rir, observacao } = req.body;
  if (series !== undefined) item.series = Number(series) || 1;
  if (reps !== undefined) item.reps = limpar(reps) || '12';
  if (descanso !== undefined) item.descanso = Number(descanso) || 0;
  if (rir !== undefined) item.rir = rir === '' || rir === null ? null : Number(rir);
  if (observacao !== undefined) item.observacao = limpar(observacao);
  await db.write();
  res.json(item);
});

router.delete('/:id/sessoes/:sessaoId/itens/:itemId', async (req, res) => {
  const { sessao, erro } = await achar({
    treinoId: req.params.id,
    sessaoId: req.params.sessaoId,
    itemId: req.params.itemId,
  });
  if (erro) return res.status(404).json({ error: erro });
  sessao.itens = sessao.itens.filter((i) => i.id !== req.params.itemId);
  await db.write();
  res.status(204).end();
});

/** Reordena a sessão inteira: recebe os ids na ordem desejada. */
router.put('/:id/sessoes/:sessaoId/ordem', async (req, res) => {
  const { sessao, erro } = await achar({ treinoId: req.params.id, sessaoId: req.params.sessaoId });
  if (erro) return res.status(404).json({ error: erro });
  const ordem = Array.isArray(req.body.ordem) ? req.body.ordem : [];
  const porId = new Map(sessao.itens.map((i) => [i.id, i]));
  const reordenados = ordem.map((id) => porId.get(id)).filter(Boolean);
  // Qualquer item que não veio na lista fica no fim, em vez de sumir.
  const restantes = sessao.itens.filter((i) => !ordem.includes(i.id));
  sessao.itens = [...reordenados, ...restantes];
  await db.write();
  res.json(sessao);
});

export default router;
