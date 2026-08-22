import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

function statusAtual(pagamento, hojeStr) {
  if (pagamento.status === 'pago') return 'pago';
  const [ano, mes] = pagamento.mesReferencia.split('-').map(Number);
  const vencimento = new Date(ano, mes - 1, pagamento.diaVencimento || 5);
  const hoje = new Date(hojeStr);
  return hoje > vencimento ? 'atrasado' : 'pendente';
}

// GET /api/dashboard?mes=YYYY-MM
router.get('/', async (req, res) => {
  await db.read();
  const mes = req.query.mes || new Date().toISOString().slice(0, 7);
  const hoje = new Date().toISOString().slice(0, 10);

  const alunosAtivos = db.data.alunos.filter((a) => a.ativo);
  const aulasDoMes = db.data.aulas.filter((a) => a.data.startsWith(mes));
  const pagamentosDoMes = db.data.pagamentos
    .filter((p) => p.mesReferencia === mes)
    .map((p) => ({ ...p, status: statusAtual(p, hoje) }));

  const porAluno = alunosAtivos.map((aluno) => {
    const aulas = aulasDoMes.filter((a) => a.alunoId === aluno.id);
    const realizadas = aulas.filter((a) => a.status === 'presente' || a.status === 'reposicao').length;
    const faltas = aulas.filter((a) => a.status === 'falta').length;
    const reposicoes = aulas.filter((a) => a.status === 'reposicao').length;
    const pagamento = pagamentosDoMes.find((p) => p.alunoId === aluno.id) || null;
    return {
      alunoId: aluno.id,
      nome: aluno.nome,
      tipo: aluno.tipo,
      aulasRealizadas: realizadas,
      faltas,
      reposicoes,
      pagamento,
    };
  });

  const totalAReceber = pagamentosDoMes.reduce((s, p) => s + p.valor, 0);
  const totalRecebido = pagamentosDoMes.filter((p) => p.status === 'pago').reduce((s, p) => s + p.valor, 0);
  const totalPendente = pagamentosDoMes
    .filter((p) => p.status === 'pendente')
    .reduce((s, p) => s + p.valor, 0);
  const totalAtrasado = pagamentosDoMes
    .filter((p) => p.status === 'atrasado')
    .reduce((s, p) => s + p.valor, 0);

  const semCobrancaGerada = alunosAtivos.filter(
    (a) => !pagamentosDoMes.some((p) => p.alunoId === a.id)
  ).length;

  const porCanal = {};
  for (const aluno of db.data.alunos) {
    const canal = aluno.comoConheceu || 'nao_informado';
    porCanal[canal] = (porCanal[canal] || 0) + 1;
  }

  const hojeMD = hoje.slice(5); // MM-DD
  const em7dias = new Date();
  em7dias.setDate(em7dias.getDate() + 7);
  const aniversariantes = alunosAtivos
    .filter((a) => a.dataNascimento)
    .map((a) => {
      const md = a.dataNascimento.slice(5); // MM-DD
      const [mes, dia] = md.split('-').map(Number);
      const proxima = new Date(new Date().getFullYear(), mes - 1, dia);
      if (proxima < new Date(hoje)) proxima.setFullYear(proxima.getFullYear() + 1);
      return { alunoId: a.id, nome: a.nome, dataNascimento: a.dataNascimento, proximaData: proxima.toISOString().slice(0, 10), hoje: md === hojeMD };
    })
    .filter((a) => new Date(a.proximaData) <= em7dias)
    .sort((a, b) => (a.proximaData < b.proximaData ? -1 : 1));

  const registrosDoMes = db.data.registrosTreino.filter((r) => r.data.startsWith(mes));
  const treinoStatusPorAluno = alunosAtivos.map((aluno) => {
    const registros = registrosDoMes.filter((r) => r.alunoId === aluno.id);
    const ultimo = db.data.registrosTreino
      .filter((r) => r.alunoId === aluno.id)
      .sort((a, b) => (a.data < b.data ? 1 : -1))[0];
    return {
      alunoId: aluno.id,
      nome: aluno.nome,
      treinosNoMes: registros.length,
      ultimoTreinoData: ultimo?.data || null,
    };
  });

  res.json({
    mes,
    totalAlunosAtivos: alunosAtivos.length,
    totalAulasRealizadas: aulasDoMes.filter((a) => a.status === 'presente' || a.status === 'reposicao').length,
    totalFaltas: aulasDoMes.filter((a) => a.status === 'falta').length,
    totalReposicoes: aulasDoMes.filter((a) => a.status === 'reposicao').length,
    totalAReceber,
    totalRecebido,
    totalPendente,
    totalAtrasado,
    semCobrancaGerada,
    porAluno: porAluno.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    porCanal,
    aniversariantes,
    treinoStatusPorAluno,
  });
});

export default router;
