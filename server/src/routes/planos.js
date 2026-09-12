import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';

// Planos "de vitrine" para a chamada de vendas do PlayFlix — preço e
// periodicidade que a treinadora divulga, sem relação com o pacote
// individual de cada aluno (esse continua em Pacotes).
const router = Router();

router.get('/', async (req, res) => {
  await db.read();
  res.json(db.data.planos.sort((a, b) => a.ordem - b.ordem));
});

router.post('/', async (req, res) => {
  const { nome, preco, periodicidade, destaque } = req.body;
  if (!nome?.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
  if (preco == null || Number(preco) <= 0) return res.status(400).json({ error: 'Preço é obrigatório' });
  await db.read();
  const maiorOrdem = db.data.planos.reduce((max, p) => Math.max(max, p.ordem || 0), 0);
  const plano = {
    id: nanoid(10),
    nome: nome.trim(),
    preco: Number(preco),
    periodicidade: periodicidade || 'mensal',
    destaque: !!destaque,
    ordem: maiorOrdem + 1,
    createdAt: new Date().toISOString(),
  };
  db.data.planos.push(plano);
  await db.write();
  res.status(201).json(plano);
});

router.put('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.planos.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Plano não encontrado' });
  const atual = db.data.planos[idx];
  const { nome, preco, periodicidade, destaque, ordem } = req.body;
  const atualizado = {
    ...atual,
    nome: nome !== undefined ? nome.trim() : atual.nome,
    preco: preco !== undefined ? Number(preco) : atual.preco,
    periodicidade: periodicidade !== undefined ? periodicidade : atual.periodicidade,
    destaque: destaque !== undefined ? !!destaque : atual.destaque,
    ordem: ordem !== undefined ? Number(ordem) : atual.ordem,
  };
  db.data.planos[idx] = atualizado;
  await db.write();
  res.json(atualizado);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.planos.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Plano não encontrado' });
  db.data.planos.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

export default router;
