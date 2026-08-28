import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { autenticar, exigirTreinador } from '../auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'data', 'premium-videos');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
      cb(null, `${nanoid(12)}${ext}`);
    },
  }),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^video\//.test(file.mimetype)) return cb(new Error('Envie um arquivo de vídeo'));
    cb(null, true);
  },
});

export const CATEGORIAS_VIDEO = {
  cardio: 'Cardio',
  gluteos: 'Glúteos',
  tecnica: 'Como fazer o exercício',
  ajustes: 'Ajustes de postura',
  dicas: 'Dicas',
  desafio: 'Desafio da semana',
};

function paraApi(v) {
  return { ...v, url: `/api/videos/midia/${v.arquivo}` };
}

const router = Router();

// Serve o arquivo de vídeo: treinadora sempre; aluno só se tiver premium liberado
router.get('/midia/:arquivo', autenticar, async (req, res) => {
  await db.read();
  if (req.usuario.role === 'treinador') {
    // ok
  } else if (req.usuario.role === 'aluno') {
    const aluno = db.data.alunos.find((a) => a.id === req.usuario.alunoId);
    if (!aluno?.premium) return res.status(403).end();
  } else {
    return res.status(403).end();
  }
  const filePath = path.join(uploadsDir, req.params.arquivo);
  if (!fs.existsSync(filePath)) return res.status(404).end();
  res.sendFile(filePath);
});

router.use(autenticar, exigirTreinador);

router.get('/', async (req, res) => {
  await db.read();
  res.json(db.data.videosPremium.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).map(paraApi));
});

router.post('/', upload.single('arquivo'), async (req, res) => {
  const { titulo, descricao, categoria } = req.body;
  if (!titulo || !titulo.trim()) return res.status(400).json({ error: 'Título é obrigatório' });
  if (!req.file) return res.status(400).json({ error: 'Envie um arquivo de vídeo' });
  await db.read();
  const video = {
    id: nanoid(10),
    titulo: titulo.trim(),
    descricao: descricao?.trim() || '',
    categoria: CATEGORIAS_VIDEO[categoria] ? categoria : 'dicas',
    arquivo: req.file.filename,
    createdAt: new Date().toISOString(),
  };
  db.data.videosPremium.push(video);
  await db.write();
  res.status(201).json(paraApi(video));
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.videosPremium.findIndex((v) => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Vídeo não encontrado' });
  const [removido] = db.data.videosPremium.splice(idx, 1);
  fs.rm(path.join(uploadsDir, removido.arquivo), () => {});
  await db.write();
  res.status(204).end();
});

export default router;
