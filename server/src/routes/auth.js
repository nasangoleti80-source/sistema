import { Router } from 'express';
import { db } from '../db.js';
import { hashSenha, verificarSenha, gerarToken, autenticar, exigirTreinador } from '../auth.js';

const router = Router();

// GET /api/auth/status - diz se a treinadora já configurou a senha
router.get('/status', async (req, res) => {
  await db.read();
  res.json({ configurado: Boolean(db.data.treinador?.senhaHash) });
});

// POST /api/auth/setup-treinador { senha } - só funciona se ainda não configurado
router.post('/setup-treinador', async (req, res) => {
  await db.read();
  if (db.data.treinador?.senhaHash) {
    return res.status(400).json({ error: 'Senha já configurada' });
  }
  const { senha } = req.body;
  if (!senha || senha.length < 4) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 4 caracteres' });
  }
  db.data.treinador = { senhaHash: await hashSenha(senha) };
  await db.write();
  const token = await gerarToken({ role: 'treinador' });
  res.status(201).json({ token });
});

// POST /api/auth/login-treinador { senha }
router.post('/login-treinador', async (req, res) => {
  await db.read();
  const { senha } = req.body;
  const ok = await verificarSenha(senha || '', db.data.treinador?.senhaHash);
  if (!ok) return res.status(401).json({ error: 'Senha incorreta' });
  const token = await gerarToken({ role: 'treinador' });
  res.json({ token });
});

// POST /api/auth/login-aluno { usuario, senha }
router.post('/login-aluno', async (req, res) => {
  await db.read();
  const { usuario, senha } = req.body;
  const aluno = db.data.alunos.find(
    (a) => a.usuario && a.usuario.toLowerCase() === String(usuario || '').toLowerCase()
  );
  const ok = aluno && (await verificarSenha(senha || '', aluno.senhaHash));
  if (!ok) return res.status(401).json({ error: 'Usuário ou senha incorretos' });
  const token = await gerarToken({ role: 'aluno', alunoId: aluno.id });
  res.json({ token, nome: aluno.nome });
});

// POST /api/auth/trocar-senha-treinador { senhaAtual, novaSenha }
router.post('/trocar-senha-treinador', autenticar, exigirTreinador, async (req, res) => {
  await db.read();
  const { senhaAtual, novaSenha } = req.body;
  const ok = await verificarSenha(senhaAtual || '', db.data.treinador?.senhaHash);
  if (!ok) return res.status(401).json({ error: 'Senha atual incorreta' });
  if (!novaSenha || novaSenha.length < 4) {
    return res.status(400).json({ error: 'Nova senha deve ter pelo menos 4 caracteres' });
  }
  db.data.treinador.senhaHash = await hashSenha(novaSenha);
  await db.write();
  res.json({ ok: true });
});

// GET /api/auth/me - quem está logado
router.get('/me', autenticar, async (req, res) => {
  if (req.usuario.role === 'aluno') {
    await db.read();
    const aluno = db.data.alunos.find((a) => a.id === req.usuario.alunoId);
    if (!aluno) return res.status(401).json({ error: 'Aluno não encontrado' });
    return res.json({ role: 'aluno', alunoId: aluno.id, nome: aluno.nome });
  }
  res.json({ role: 'treinador' });
});

export default router;
