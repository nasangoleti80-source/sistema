import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { autenticar, exigirAluno } from '../auth.js';
import { paraApi, upload } from './mensagens.js';

const router = Router();

router.use(autenticar, exigirAluno);

// GET /api/meu/treino
router.get('/treino', async (req, res) => {
  await db.read();
  const treino = db.data.treinos.find((t) => t.alunoId === req.usuario.alunoId) || null;
  res.json(treino);
});

// GET /api/meu/evolucao - fotos marcadas como visíveis, agrupadas por avaliação
router.get('/evolucao', async (req, res) => {
  await db.read();
  const avaliacoes = db.data.avaliacoes
    .filter((av) => av.alunoId === req.usuario.alunoId)
    .map((av) => ({
      id: av.id,
      data: av.data,
      fotos: av.fotos
        .filter((f) => f.visivelParaAluno)
        .map((f) => ({
          id: f.id,
          tipo: f.tipo,
          url: `/api/avaliacoes/fotos/${req.usuario.alunoId}/${f.arquivo}`,
        })),
    }))
    .filter((av) => av.fotos.length > 0)
    .sort((a, b) => (a.data < b.data ? -1 : 1));
  res.json(avaliacoes);
});

// GET /api/meu/dieta
router.get('/dieta', async (req, res) => {
  await db.read();
  const dieta = db.data.dietas.find((d) => d.alunoId === req.usuario.alunoId) || null;
  if (!dieta) return res.json(null);
  res.json({ orientacoes: dieta.orientacoes, refeicoes: dieta.refeicoes });
});

// GET /api/meu/mensagens - histórico da conversa com a treinadora, marca como lida
router.get('/mensagens', async (req, res) => {
  await db.read();
  const minhas = db.data.mensagens.filter((m) => m.alunoId === req.usuario.alunoId);
  let mudou = false;
  for (const m of minhas) {
    if (m.remetente === 'treinador' && !m.lida) {
      m.lida = true;
      mudou = true;
    }
  }
  if (mudou) await db.write();
  res.json(minhas.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)).map(paraApi));
});

// GET /api/meu/mensagens/nao-lidas
router.get('/mensagens/nao-lidas', async (req, res) => {
  await db.read();
  const total = db.data.mensagens.filter(
    (m) => m.alunoId === req.usuario.alunoId && m.remetente === 'treinador' && !m.lida
  ).length;
  res.json({ total });
});

// POST /api/meu/mensagens - envia texto
router.post('/mensagens', async (req, res) => {
  await db.read();
  const texto = (req.body.texto || '').trim();
  if (!texto) return res.status(400).json({ error: 'Mensagem vazia' });
  const msg = {
    id: nanoid(10),
    alunoId: req.usuario.alunoId,
    remetente: 'aluno',
    texto,
    midia: null,
    lida: false,
    createdAt: new Date().toISOString(),
  };
  db.data.mensagens.push(msg);
  await db.write();
  res.status(201).json(paraApi(msg));
});

// POST /api/meu/mensagens/midia - envia foto/vídeo
router.post(
  '/mensagens/midia',
  (req, res, next) => {
    req.alunoIdDestino = req.usuario.alunoId;
    next();
  },
  upload.single('arquivo'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    await db.read();
    const msg = {
      id: nanoid(10),
      alunoId: req.usuario.alunoId,
      remetente: 'aluno',
      texto: '',
      midia: { arquivo: req.file.filename, tipo: req.file.mimetype.startsWith('video/') ? 'video' : 'imagem' },
      lida: false,
      createdAt: new Date().toISOString(),
    };
    db.data.mensagens.push(msg);
    await db.write();
    res.status(201).json(paraApi(msg));
  }
);

export default router;
