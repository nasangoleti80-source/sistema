import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  await db.read();
  const { categoria } = req.query;
  let alimentos = db.data.alimentos;
  if (categoria) alimentos = alimentos.filter((a) => a.categoria === categoria);
  res.json(alimentos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
});

router.post('/', async (req, res) => {
  const { nome, unidade, quantidadePadrao, categoria } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
  await db.read();
  const alimento = {
    id: nanoid(10),
    nome: nome.trim(),
    unidade: unidade || 'g',
    quantidadePadrao: quantidadePadrao !== undefined && quantidadePadrao !== '' ? Number(quantidadePadrao) : null,
    categoria: categoria || 'outro',
    createdAt: new Date().toISOString(),
  };
  db.data.alimentos.push(alimento);
  await db.write();
  res.status(201).json(alimento);
});

router.put('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.alimentos.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Alimento não encontrado' });
  const atual = db.data.alimentos[idx];
  const { nome, unidade, quantidadePadrao, categoria } = req.body;
  const atualizado = {
    ...atual,
    nome: nome !== undefined ? nome.trim() : atual.nome,
    unidade: unidade !== undefined ? unidade : atual.unidade,
    quantidadePadrao:
      quantidadePadrao !== undefined ? (quantidadePadrao !== '' ? Number(quantidadePadrao) : null) : atual.quantidadePadrao,
    categoria: categoria !== undefined ? categoria : atual.categoria,
  };
  db.data.alimentos[idx] = atualizado;
  await db.write();
  res.json(atualizado);
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
