import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { BASES_KCAL } from '../../../compartilhado/nutricao.js';

const router = Router();

/**
 * Base calórica do banco: todas as opções dele miram nesse número.
 *
 * É o que sustenta a troca — o aluno só pode pegar a "Opção 04" no lugar da
 * "Opção 01" porque as duas valem o mesmo. Base fora da lista é recusada em
 * vez de gravada: um banco de "537 kcal" não conversa com o resto do plano.
 */
function lerBase(valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  const n = Number(valor);
  return BASES_KCAL.includes(n) ? n : undefined;   // undefined = inválido
}

router.get('/', async (req, res) => {
  await db.read();
  res.json(db.data.bancosOpcoes.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
});

router.post('/', async (req, res) => {
  const { nome, opcoes, baseKcal } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
  const base = lerBase(baseKcal);
  if (base === undefined) {
    return res.status(400).json({ error: `Base calórica deve ser uma destas: ${BASES_KCAL.join(', ')}` });
  }
  await db.read();
  const banco = {
    id: nanoid(10),
    nome: nome.trim(),
    baseKcal: base,
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
  const { nome, opcoes, baseKcal } = req.body;
  const base = baseKcal !== undefined ? lerBase(baseKcal) : atual.baseKcal ?? null;
  if (base === undefined) {
    return res.status(400).json({ error: `Base calórica deve ser uma destas: ${BASES_KCAL.join(', ')}` });
  }
  const atualizado = {
    ...atual,
    nome: nome !== undefined ? nome.trim() : atual.nome,
    baseKcal: base,
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
