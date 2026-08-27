import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { autenticar, exigirTreinador } from '../auth.js';

const router = Router();

router.use(autenticar, exigirTreinador);

// GET /api/alimentos - lista os grupos do banco de alimentos
router.get('/', async (req, res) => {
  await db.read();
  res.json(db.data.alimentosBanco.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
});

// POST /api/alimentos - cria um grupo { nome }
router.post('/', async (req, res) => {
  const { nome } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome do grupo é obrigatório' });
  await db.read();
  const grupo = { id: nanoid(10), nome: nome.trim(), itens: [] };
  db.data.alimentosBanco.push(grupo);
  await db.write();
  res.status(201).json(grupo);
});

router.put('/:id', async (req, res) => {
  await db.read();
  const grupo = db.data.alimentosBanco.find((g) => g.id === req.params.id);
  if (!grupo) return res.status(404).json({ error: 'Grupo não encontrado' });
  if (req.body.nome !== undefined) grupo.nome = req.body.nome.trim();
  await db.write();
  res.json(grupo);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.alimentosBanco.findIndex((g) => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Grupo não encontrado' });
  db.data.alimentosBanco.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

// POST /api/alimentos/:id/itens - adiciona alimento ao grupo { alimento, quantidade }
router.post('/:id/itens', async (req, res) => {
  await db.read();
  const grupo = db.data.alimentosBanco.find((g) => g.id === req.params.id);
  if (!grupo) return res.status(404).json({ error: 'Grupo não encontrado' });
  const { alimento, quantidade } = req.body;
  if (!alimento || !alimento.trim()) return res.status(400).json({ error: 'Alimento é obrigatório' });
  const item = { id: nanoid(8), alimento: alimento.trim(), quantidade: (quantidade || '').trim() };
  grupo.itens.push(item);
  await db.write();
  res.status(201).json(item);
});

router.put('/:id/itens/:itemId', async (req, res) => {
  await db.read();
  const grupo = db.data.alimentosBanco.find((g) => g.id === req.params.id);
  if (!grupo) return res.status(404).json({ error: 'Grupo não encontrado' });
  const item = grupo.itens.find((i) => i.id === req.params.itemId);
  if (!item) return res.status(404).json({ error: 'Item não encontrado' });
  if (req.body.alimento !== undefined) item.alimento = req.body.alimento.trim();
  if (req.body.quantidade !== undefined) item.quantidade = req.body.quantidade.trim();
  await db.write();
  res.json(item);
});

router.delete('/:id/itens/:itemId', async (req, res) => {
  await db.read();
  const grupo = db.data.alimentosBanco.find((g) => g.id === req.params.id);
  if (!grupo) return res.status(404).json({ error: 'Grupo não encontrado' });
  const idx = grupo.itens.findIndex((i) => i.id === req.params.itemId);
  if (idx === -1) return res.status(404).json({ error: 'Item não encontrado' });
  grupo.itens.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

export default router;
