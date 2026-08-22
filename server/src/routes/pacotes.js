import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';

const router = Router();

function statusAtual(pacote, hojeStr) {
  if (pacote.status === 'pago') return 'pago';
  const hoje = new Date(hojeStr);
  const vencimento = new Date(pacote.dataVencimento);
  return hoje > vencimento ? 'atrasado' : 'pendente';
}

router.get('/', async (req, res) => {
  await db.read();
  const { alunoId } = req.query;
  let pacotes = db.data.pacotes;
  if (alunoId) pacotes = pacotes.filter((p) => p.alunoId === alunoId);
  const hoje = new Date().toISOString().slice(0, 10);
  const comStatus = pacotes.map((p) => ({ ...p, status: statusAtual(p, hoje) }));
  res.json(comStatus.sort((a, b) => (a.dataVencimento < b.dataVencimento ? 1 : -1)));
});

router.post('/', async (req, res) => {
  const {
    alunoId, nomePacote, dataInicio, duracaoMeses, valorTotal,
    formaPagamento, parcelas, dataVencimento, observacoes,
  } = req.body;
  if (!alunoId || !nomePacote) return res.status(400).json({ error: 'alunoId e nomePacote são obrigatórios' });
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === alunoId);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });

  const inicio = dataInicio || new Date().toISOString().slice(0, 10);
  const [ano, mes, dia] = inicio.split('-').map(Number);
  const fim = new Date(ano, mes - 1 + Number(duracaoMeses || 1), dia);

  const pacote = {
    id: nanoid(10),
    alunoId,
    nomePacote: nomePacote.trim(),
    dataInicio: inicio,
    duracaoMeses: Number(duracaoMeses) || 1,
    dataFim: fim.toISOString().slice(0, 10),
    valorTotal: Number(valorTotal) || 0,
    formaPagamento: formaPagamento || 'pix',
    parcelas: Number(parcelas) || 1,
    dataVencimento: dataVencimento || inicio,
    status: 'pendente',
    dataPagamento: null,
    observacoes: observacoes?.trim() || '',
    createdAt: new Date().toISOString(),
  };
  db.data.pacotes.push(pacote);
  await db.write();
  res.status(201).json(pacote);
});

router.put('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.pacotes.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Pacote não encontrado' });
  const atual = db.data.pacotes[idx];
  const {
    nomePacote, dataInicio, duracaoMeses, valorTotal, formaPagamento,
    parcelas, dataVencimento, status, observacoes,
  } = req.body;
  const atualizado = {
    ...atual,
    nomePacote: nomePacote !== undefined ? nomePacote.trim() : atual.nomePacote,
    dataInicio: dataInicio !== undefined ? dataInicio : atual.dataInicio,
    duracaoMeses: duracaoMeses !== undefined ? Number(duracaoMeses) : atual.duracaoMeses,
    valorTotal: valorTotal !== undefined ? Number(valorTotal) : atual.valorTotal,
    formaPagamento: formaPagamento !== undefined ? formaPagamento : atual.formaPagamento,
    parcelas: parcelas !== undefined ? Number(parcelas) : atual.parcelas,
    dataVencimento: dataVencimento !== undefined ? dataVencimento : atual.dataVencimento,
    status: status !== undefined ? status : atual.status,
    observacoes: observacoes !== undefined ? observacoes.trim() : atual.observacoes,
    dataPagamento:
      status === 'pago' && !atual.dataPagamento
        ? new Date().toISOString().slice(0, 10)
        : status !== undefined && status !== 'pago'
        ? null
        : atual.dataPagamento,
  };
  db.data.pacotes[idx] = atualizado;
  await db.write();
  res.json(atualizado);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.pacotes.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Pacote não encontrado' });
  db.data.pacotes.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

export default router;
