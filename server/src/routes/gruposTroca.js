import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  await db.read();
  res.json(db.data.gruposTroca.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
});

router.post('/', async (req, res) => {
  const { nome, opcoes } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
  await db.read();
  const grupo = {
    id: nanoid(10),
    nome: nome.trim(),
    opcoes: Array.isArray(opcoes) ? opcoes : [],
    createdAt: new Date().toISOString(),
  };
  db.data.gruposTroca.push(grupo);
  await db.write();
  res.status(201).json(grupo);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.gruposTroca.findIndex((g) => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Grupo não encontrado' });
  db.data.gruposTroca.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

export default router;
