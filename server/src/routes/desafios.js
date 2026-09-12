import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';

const router = Router();

// Um desafio vale pra todos os alunos ativos quando participantes é vazio —
// a treinadora não precisa marcar aluno por aluno se a ideia é pra geral.
router.get('/', async (req, res) => {
  await db.read();
  const { alunoId } = req.query;
  let desafios = db.data.desafios;
  if (alunoId) {
    desafios = desafios.filter((d) => !d.participantes?.length || d.participantes.includes(alunoId));
  }
  res.json(desafios.sort((a, b) => (a.dataInicio < b.dataInicio ? 1 : -1)));
});

router.post('/', async (req, res) => {
  const { nome, descricao, tipo, dataInicio, dataFim, participantes } = req.body;
  if (!nome?.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
  if (!dataInicio || !dataFim) return res.status(400).json({ error: 'Data de início e fim são obrigatórias' });
  await db.read();
  const desafio = {
    id: nanoid(10),
    nome: nome.trim(),
    descricao: descricao?.trim() || '',
    tipo: tipo || 'treino', // 'treino' ou 'dieta'
    dataInicio,
    dataFim,
    // vazio = vale pra todo mundo; senão, só os alunoIds listados
    participantes: Array.isArray(participantes) ? participantes : [],
    concluidos: [],
    createdAt: new Date().toISOString(),
  };
  db.data.desafios.push(desafio);
  await db.write();
  res.status(201).json(desafio);
});

router.put('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.desafios.findIndex((d) => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Desafio não encontrado' });
  const atual = db.data.desafios[idx];
  const { nome, descricao, tipo, dataInicio, dataFim, participantes, concluidos } = req.body;
  const atualizado = {
    ...atual,
    nome: nome !== undefined ? nome.trim() : atual.nome,
    descricao: descricao !== undefined ? descricao.trim() : atual.descricao,
    tipo: tipo !== undefined ? tipo : atual.tipo,
    dataInicio: dataInicio !== undefined ? dataInicio : atual.dataInicio,
    dataFim: dataFim !== undefined ? dataFim : atual.dataFim,
    participantes: participantes !== undefined ? participantes : atual.participantes,
    concluidos: concluidos !== undefined ? concluidos : atual.concluidos,
  };
  db.data.desafios[idx] = atualizado;
  await db.write();
  res.json(atualizado);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.desafios.findIndex((d) => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Desafio não encontrado' });
  db.data.desafios.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

export default router;
