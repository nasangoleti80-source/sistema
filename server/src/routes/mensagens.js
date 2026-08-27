import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { autenticar, exigirTreinador } from '../auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'data', 'chat-uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(uploadsDir, req.alunoIdDestino);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || (file.mimetype.startsWith('video/') ? '.mp4' : '.jpg');
      cb(null, `${nanoid(12)}${ext}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^(image|video)\//.test(file.mimetype)) return cb(new Error('Envie uma foto ou vídeo'));
    cb(null, true);
  },
});

function paraApi(msg) {
  return {
    id: msg.id,
    alunoId: msg.alunoId,
    remetente: msg.remetente,
    texto: msg.texto,
    midia: msg.midia ? { tipo: msg.midia.tipo, url: `/api/mensagens/midia/${msg.alunoId}/${msg.midia.arquivo}` } : null,
    lida: msg.lida,
    createdAt: msg.createdAt,
  };
}

const router = Router();

// Serve de mídia com controle de acesso: treinadora sempre; aluno só a própria conversa
router.get('/midia/:alunoId/:arquivo', autenticar, async (req, res) => {
  const { alunoId, arquivo } = req.params;
  if (req.usuario.role === 'treinador') {
    // ok
  } else if (req.usuario.role === 'aluno' && req.usuario.alunoId === alunoId) {
    // ok, é a própria conversa
  } else {
    return res.status(403).end();
  }
  const filePath = path.join(uploadsDir, alunoId, arquivo);
  if (!fs.existsSync(filePath)) return res.status(404).end();
  res.sendFile(filePath);
});

router.use(autenticar, exigirTreinador);

// GET /api/mensagens - lista de conversas com prévia e não lidas
router.get('/', async (req, res) => {
  await db.read();
  const conversas = db.data.alunos.map((aluno) => {
    const doAluno = db.data.mensagens.filter((m) => m.alunoId === aluno.id).sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    const ultima = doAluno[doAluno.length - 1] || null;
    const naoLidas = doAluno.filter((m) => m.remetente === 'aluno' && !m.lida).length;
    return {
      alunoId: aluno.id,
      nome: aluno.nome,
      ativo: aluno.ativo,
      ultimaMensagem: ultima ? { texto: ultima.texto, temMidia: Boolean(ultima.midia), createdAt: ultima.createdAt, remetente: ultima.remetente } : null,
      naoLidas,
    };
  });
  conversas.sort((a, b) => {
    const da = a.ultimaMensagem?.createdAt || '';
    const db_ = b.ultimaMensagem?.createdAt || '';
    return da < db_ ? 1 : da > db_ ? -1 : a.nome.localeCompare(b.nome, 'pt-BR');
  });
  res.json(conversas);
});

// GET /api/mensagens/nao-lidas - total pra badge
router.get('/nao-lidas', async (req, res) => {
  await db.read();
  const total = db.data.mensagens.filter((m) => m.remetente === 'aluno' && !m.lida).length;
  res.json({ total });
});

// GET /api/mensagens/:alunoId - histórico da conversa, marca como lida
router.get('/:alunoId', async (req, res) => {
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === req.params.alunoId);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  const doAluno = db.data.mensagens.filter((m) => m.alunoId === req.params.alunoId);
  let mudou = false;
  for (const m of doAluno) {
    if (m.remetente === 'aluno' && !m.lida) {
      m.lida = true;
      mudou = true;
    }
  }
  if (mudou) await db.write();
  res.json(doAluno.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)).map(paraApi));
});

// POST /api/mensagens/:alunoId - envia texto
router.post('/:alunoId', async (req, res) => {
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === req.params.alunoId);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  const texto = (req.body.texto || '').trim();
  if (!texto) return res.status(400).json({ error: 'Mensagem vazia' });
  const msg = {
    id: nanoid(10),
    alunoId: req.params.alunoId,
    remetente: 'treinador',
    texto,
    midia: null,
    lida: false,
    createdAt: new Date().toISOString(),
  };
  db.data.mensagens.push(msg);
  await db.write();
  res.status(201).json(paraApi(msg));
});

// POST /api/mensagens/:alunoId/midia - envia foto/vídeo
router.post(
  '/:alunoId/midia',
  (req, res, next) => {
    req.alunoIdDestino = req.params.alunoId;
    next();
  },
  upload.single('arquivo'),
  async (req, res) => {
    await db.read();
    const aluno = db.data.alunos.find((a) => a.id === req.params.alunoId);
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    const msg = {
      id: nanoid(10),
      alunoId: req.params.alunoId,
      remetente: 'treinador',
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
export { paraApi, upload, uploadsDir };
