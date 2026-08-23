import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  await db.read();
  const { alunoId } = req.query;
  let mensagens = db.data.mensagens;
  if (alunoId) mensagens = mensagens.filter((m) => m.alunoId === alunoId);
  res.json(mensagens.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1)));
});

router.post('/', async (req, res) => {
  const { alunoId, remetente, texto } = req.body;
  if (!alunoId || !texto?.trim()) return res.status(400).json({ error: 'alunoId e texto são obrigatórios' });
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === alunoId);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  const mensagem = {
    id: nanoid(10),
    alunoId,
    remetente: remetente === 'aluno' ? 'aluno' : 'trainer',
    texto: texto.trim(),
    lida: false,
    createdAt: new Date().toISOString(),
  };
  db.data.mensagens.push(mensagem);
  await db.write();
  res.status(201).json(mensagem);
});

router.put('/:id/lida', async (req, res) => {
  await db.read();
  const idx = db.data.mensagens.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Mensagem não encontrada' });
  db.data.mensagens[idx].lida = true;
  await db.write();
  res.json(db.data.mensagens[idx]);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.mensagens.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Mensagem não encontrada' });
  db.data.mensagens.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

export default router;
