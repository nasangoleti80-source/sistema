import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  await db.read();
  const { alunoId } = req.query;
  let dietas = db.data.dietas;
  if (alunoId) dietas = dietas.filter((d) => d.alunoId === alunoId);
  res.json(dietas.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1)));
});

router.post('/', async (req, res) => {
  const { alunoId, nome, refeicoes, observacoes } = req.body;
  if (!alunoId || !nome?.trim()) return res.status(400).json({ error: 'alunoId e nome são obrigatórios' });
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === alunoId);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  const dieta = {
    id: nanoid(10),
    alunoId,
    nome: nome.trim(),
    refeicoes: Array.isArray(refeicoes) ? refeicoes : [],
    observacoes: observacoes?.trim() || '',
    ativa: true,
    createdAt: new Date().toISOString(),
  };
  db.data.dietas.push(dieta);
  await db.write();
  res.status(201).json(dieta);
});

router.put('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.dietas.findIndex((d) => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Dieta não encontrada' });
  const atual = db.data.dietas[idx];
  const { nome, refeicoes, observacoes, ativa } = req.body;
  const atualizado = {
    ...atual,
    nome: nome !== undefined ? nome.trim() : atual.nome,
    refeicoes: refeicoes !== undefined ? refeicoes : atual.refeicoes,
    observacoes: observacoes !== undefined ? observacoes.trim() : atual.observacoes,
    ativa: ativa !== undefined ? Boolean(ativa) : atual.ativa,
  };
  db.data.dietas[idx] = atualizado;
  await db.write();
  res.json(atualizado);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.dietas.findIndex((d) => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Dieta não encontrada' });
  db.data.dietas.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

export default router;
