import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';

// Anotações particulares da treinadora sobre um aluno — nunca aparecem no
// portal, servem só pra ela lembrar de algo (numa avaliação ou em qualquer
// outro dia) sem precisar guardar de cabeça.
const router = Router();

router.get('/', async (req, res) => {
  await db.read();
  const { alunoId } = req.query;
  if (!alunoId) return res.status(400).json({ error: 'alunoId é obrigatório' });
  const notas = db.data.notas.filter((n) => n.alunoId === alunoId);
  res.json(notas.sort((a, b) => (a.data < b.data ? 1 : -1)));
});

router.post('/', async (req, res) => {
  const { alunoId, texto, data } = req.body;
  if (!alunoId) return res.status(400).json({ error: 'alunoId é obrigatório' });
  if (!texto?.trim()) return res.status(400).json({ error: 'Texto é obrigatório' });
  await db.read();
  const nota = {
    id: nanoid(10),
    alunoId,
    texto: texto.trim(),
    data: data || new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };
  db.data.notas.push(nota);
  await db.write();
  res.status(201).json(nota);
});

router.put('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.notas.findIndex((n) => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Nota não encontrada' });
  const atual = db.data.notas[idx];
  const { texto, data } = req.body;
  if (texto !== undefined && !texto.trim()) return res.status(400).json({ error: 'Texto é obrigatório' });
  const atualizada = {
    ...atual,
    texto: texto !== undefined ? texto.trim() : atual.texto,
    data: data !== undefined ? data : atual.data,
  };
  db.data.notas[idx] = atualizada;
  await db.write();
  res.json(atualizada);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.notas.findIndex((n) => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Nota não encontrada' });
  db.data.notas.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

export default router;
