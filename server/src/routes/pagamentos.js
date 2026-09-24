import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';

const router = Router();

function statusAtual(pagamento, hojeStr) {
  if (pagamento.status === 'pago') return 'pago';
  const [ano, mes] = pagamento.mesReferencia.split('-').map(Number);
  const vencimento = new Date(ano, mes - 1, pagamento.diaVencimento || 5);
  const hoje = new Date(hojeStr);
  return hoje > vencimento ? 'atrasado' : 'pendente';
}

// GET /api/pagamentos?mes=YYYY-MM
router.get('/', async (req, res) => {
  await db.read();
  const { mes, alunoId } = req.query;
  let pagamentos = db.data.pagamentos;
  if (mes) pagamentos = pagamentos.filter((p) => p.mesReferencia === mes);
  if (alunoId) pagamentos = pagamentos.filter((p) => p.alunoId === alunoId);
  const hoje = new Date().toISOString().slice(0, 10);
  const comStatus = pagamentos.map((p) => ({ ...p, status: statusAtual(p, hoje) }));
  res.json(comStatus.sort((a, b) => (a.mesReferencia < b.mesReferencia ? 1 : -1)));
});

// POST /api/pagamentos/gerar { mes: 'YYYY-MM' }
// Cria cobrança para cada aluno ativo que ainda não tem pagamento nesse mês
router.post('/gerar', async (req, res) => {
  const { mes } = req.body;
  if (!mes) return res.status(400).json({ error: 'mes é obrigatório (YYYY-MM)' });
  await db.read();
  const ativos = db.data.alunos.filter((a) => a.ativo);
  const existentes = new Set(
    db.data.pagamentos.filter((p) => p.mesReferencia === mes).map((p) => p.alunoId)
  );
  const criados = [];
  for (const aluno of ativos) {
    if (existentes.has(aluno.id)) continue;
    const pagamento = {
      id: nanoid(10),
      alunoId: aluno.id,
      mesReferencia: mes,
      valor: aluno.valorMensal,
      diaVencimento: aluno.diaVencimento,
      status: 'pendente',
      dataPagamento: null,
      formaPagamento: '',
      createdAt: new Date().toISOString(),
    };
    db.data.pagamentos.push(pagamento);
    criados.push(pagamento);
  }
  await db.write();
  res.status(201).json({ criados: criados.length, pagamentos: criados });
});

router.put('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.pagamentos.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Pagamento não encontrado' });
  const atual = db.data.pagamentos[idx];
  const { valor, status, dataPagamento, formaPagamento } = req.body;
  const atualizado = {
    ...atual,
    valor: valor !== undefined ? Number(valor) : atual.valor,
    status: status !== undefined ? status : atual.status,
    dataPagamento:
      status === 'pago' && !atual.dataPagamento
        ? new Date().toISOString().slice(0, 10)
        : dataPagamento !== undefined
        ? dataPagamento
        : atual.dataPagamento,
    formaPagamento: formaPagamento !== undefined ? formaPagamento : atual.formaPagamento,
  };
  if (status !== undefined && status !== 'pago') atualizado.dataPagamento = null;
  db.data.pagamentos[idx] = atualizado;
  await db.write();
  res.json(atualizado);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.pagamentos.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Pagamento não encontrado' });
  db.data.pagamentos.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

export default router;
