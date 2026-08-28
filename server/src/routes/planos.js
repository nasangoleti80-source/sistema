import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db, PERIODICIDADES } from '../db.js';
import { autenticar, exigirTreinador } from '../auth.js';

const router = Router();

router.use(autenticar, exigirTreinador);

router.get('/', async (req, res) => {
  await db.read();
  res.json(db.data.planos);
});

router.post('/', async (req, res) => {
  const { nome } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome do plano é obrigatório' });
  await db.read();
  const precos = {};
  for (const p of PERIODICIDADES) precos[p] = { valorCheio: null, valorDesconto: null };
  const plano = { id: nanoid(10), nome: nome.trim(), precos };
  db.data.planos.push(plano);
  await db.write();
  res.status(201).json(plano);
});

router.put('/:id', async (req, res) => {
  await db.read();
  const plano = db.data.planos.find((p) => p.id === req.params.id);
  if (!plano) return res.status(404).json({ error: 'Plano não encontrado' });
  if (req.body.nome !== undefined) plano.nome = req.body.nome.trim();
  await db.write();
  res.json(plano);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.planos.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Plano não encontrado' });
  db.data.planos.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

// PUT /api/planos/:id/precos/:periodicidade { valorCheio, valorDesconto }
router.put('/:id/precos/:periodicidade', async (req, res) => {
  if (!PERIODICIDADES.includes(req.params.periodicidade)) {
    return res.status(400).json({ error: 'Periodicidade inválida' });
  }
  await db.read();
  const plano = db.data.planos.find((p) => p.id === req.params.id);
  if (!plano) return res.status(404).json({ error: 'Plano não encontrado' });
  const { valorCheio, valorDesconto } = req.body;
  plano.precos[req.params.periodicidade] = {
    valorCheio: valorCheio !== undefined && valorCheio !== '' ? Number(valorCheio) : null,
    valorDesconto: valorDesconto !== undefined && valorDesconto !== '' ? Number(valorDesconto) : null,
  };
  await db.write();
  res.json(plano);
});

export default router;
