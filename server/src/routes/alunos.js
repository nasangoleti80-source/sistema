import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { autenticar, exigirTreinador, hashSenha, gerarUsuario, gerarSenhaAleatoria } from '../auth.js';

const router = Router();

router.use(autenticar, exigirTreinador);

function semSenha(aluno) {
  const { senhaHash, ...resto } = aluno;
  return resto;
}

async function gerarUsuarioUnico(nome) {
  let usuario = gerarUsuario(nome || 'aluno');
  let tentativas = 0;
  while (db.data.alunos.some((a) => a.usuario === usuario) && tentativas < 10) {
    usuario = gerarUsuario(nome || 'aluno');
    tentativas++;
  }
  return usuario;
}

router.get('/', async (req, res) => {
  await db.read();
  const { ativo } = req.query;
  let alunos = db.data.alunos;
  if (ativo === 'true') alunos = alunos.filter((a) => a.ativo);
  if (ativo === 'false') alunos = alunos.filter((a) => !a.ativo);
  res.json(alunos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).map(semSenha));
});

router.get('/:id', async (req, res) => {
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === req.params.id);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  res.json(semSenha(aluno));
});

router.post('/', async (req, res) => {
  const { nome, telefone, tipo, valorMensal, diaVencimento, dataInicio, observacoes, comoConheceu } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
  await db.read();
  const usuario = await gerarUsuarioUnico(nome);
  const senhaGerada = gerarSenhaAleatoria();
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
    usuario,
    senhaHash: await hashSenha(senhaGerada),
    createdAt: new Date().toISOString(),
  };
  db.data.alunos.push(aluno);
  await db.write();
  res.status(201).json({ ...semSenha(aluno), senhaGerada });
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
  res.json(semSenha(atualizado));
});

// POST /api/alunos/:id/redefinir-senha - gera uma nova senha de acesso pro aluno
router.post('/:id/redefinir-senha', async (req, res) => {
  await db.read();
  const idx = db.data.alunos.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Aluno não encontrado' });
  const senhaGerada = gerarSenhaAleatoria();
  db.data.alunos[idx].senhaHash = await hashSenha(senhaGerada);
  if (!db.data.alunos[idx].usuario) {
    db.data.alunos[idx].usuario = await gerarUsuarioUnico(db.data.alunos[idx].nome);
  }
  await db.write();
  res.json({ usuario: db.data.alunos[idx].usuario, senhaGerada });
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.alunos.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Aluno não encontrado' });
  db.data.alunos.splice(idx, 1);
  db.data.aulas = db.data.aulas.filter((a) => a.alunoId !== req.params.id);
  db.data.pagamentos = db.data.pagamentos.filter((p) => p.alunoId !== req.params.id);
  db.data.avaliacoes = db.data.avaliacoes.filter((av) => av.alunoId !== req.params.id);
  db.data.treinos = db.data.treinos.filter((t) => t.alunoId !== req.params.id);
  await db.write();
  res.status(204).end();
});

export default router;
