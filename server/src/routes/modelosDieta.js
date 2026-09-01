import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  await db.read();
  res.json(db.data.modelosDieta.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
});

router.post('/', async (req, res) => {
  const { nome, refeicoes, observacoes } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
  await db.read();
  const modelo = {
    id: nanoid(10),
    nome: nome.trim(),
    refeicoes: Array.isArray(refeicoes) ? refeicoes : [],
    observacoes: observacoes?.trim() || '',
    createdAt: new Date().toISOString(),
  };
  db.data.modelosDieta.push(modelo);
  await db.write();
  res.status(201).json(modelo);
});

router.put('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.modelosDieta.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Modelo não encontrado' });
  const atual = db.data.modelosDieta[idx];
  const { nome, refeicoes, observacoes } = req.body;
  const atualizado = {
    ...atual,
    nome: nome !== undefined ? nome.trim() : atual.nome,
    refeicoes: refeicoes !== undefined ? refeicoes : atual.refeicoes,
    observacoes: observacoes !== undefined ? observacoes.trim() : atual.observacoes,
  };
  db.data.modelosDieta[idx] = atualizado;
  await db.write();
  res.json(atualizado);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.modelosDieta.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Modelo não encontrado' });
  db.data.modelosDieta.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

export default router;
