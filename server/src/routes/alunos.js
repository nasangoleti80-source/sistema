import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  await db.read();
  const { ativo } = req.query;
  let alunos = db.data.alunos;
  if (ativo === 'true') alunos = alunos.filter((a) => a.ativo);
  if (ativo === 'false') alunos = alunos.filter((a) => !a.ativo);
  res.json(alunos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
});

router.get('/:id', async (req, res) => {
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === req.params.id);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  res.json(aluno);
});

router.post('/', async (req, res) => {
  const { nome, telefone, tipo, valorMensal, diaVencimento, dataInicio, observacoes, comoConheceu } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
  await db.read();
  const aluno = {
    id: nanoid(10),
    nome: nome.trim(),
    telefone: telefone?.trim() || '',
    tipo: tipo || 'presencial_domicilio',
    valorMensal: Number(valorMensal) || 0,
    diaVencimento: Number(diaVencimento) || 5,
    dataInicio: dataInicio || new Date().toISOString().slice(0, 10),
    observacoes: observacoes?.trim() || '',
    comoConheceu: comoConheceu || 'nao_informado',
    ativo: true,
    createdAt: new Date().toISOString(),
  };
  db.data.alunos.push(aluno);
  await db.write();
  res.status(201).json(aluno);
});

router.put('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.alunos.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Aluno não encontrado' });
  const atual = db.data.alunos[idx];
  const { nome, telefone, tipo, valorMensal, diaVencimento, dataInicio, observacoes, comoConheceu, ativo } = req.body;
  const atualizado = {
    ...atual,
    nome: nome !== undefined ? nome.trim() : atual.nome,
    telefone: telefone !== undefined ? telefone.trim() : atual.telefone,
    tipo: tipo !== undefined ? tipo : atual.tipo,
    valorMensal: valorMensal !== undefined ? Number(valorMensal) : atual.valorMensal,
    diaVencimento: diaVencimento !== undefined ? Number(diaVencimento) : atual.diaVencimento,
    dataInicio: dataInicio !== undefined ? dataInicio : atual.dataInicio,
    observacoes: observacoes !== undefined ? observacoes.trim() : atual.observacoes,
    comoConheceu: comoConheceu !== undefined ? comoConheceu : atual.comoConheceu,
    ativo: ativo !== undefined ? Boolean(ativo) : atual.ativo,
  };
  db.data.alunos[idx] = atualizado;
  await db.write();
  res.json(atualizado);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.alunos.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Aluno não encontrado' });
  db.data.alunos.splice(idx, 1);
  db.data.aulas = db.data.aulas.filter((a) => a.alunoId !== req.params.id);
  db.data.pagamentos = db.data.pagamentos.filter((p) => p.alunoId !== req.params.id);
  await db.write();
  res.status(204).end();
});

export default router;
