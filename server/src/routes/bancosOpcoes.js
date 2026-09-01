import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  await db.read();
  res.json(db.data.bancosOpcoes.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
});

router.post('/', async (req, res) => {
  const { nome, opcoes } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
  await db.read();
  const banco = {
    id: nanoid(10),
    nome: nome.trim(),
    opcoes: Array.isArray(opcoes) ? opcoes : [],
    createdAt: new Date().toISOString(),
  };
  db.data.bancosOpcoes.push(banco);
  await db.write();
  res.status(201).json(banco);
});

router.put('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.bancosOpcoes.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Banco não encontrado' });
  const atual = db.data.bancosOpcoes[idx];
  const { nome, opcoes } = req.body;
  const atualizado = {
    ...atual,
    nome: nome !== undefined ? nome.trim() : atual.nome,
    opcoes: opcoes !== undefined ? opcoes : atual.opcoes,
  };
  db.data.bancosOpcoes[idx] = atualizado;
  await db.write();
  res.json(atualizado);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.bancosOpcoes.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Banco não encontrado' });
  db.data.bancosOpcoes.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

export default router;
