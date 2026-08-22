import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { autenticar, exigirTreinador } from '../auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'data', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(uploadsDir, req.params.alunoId);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${nanoid(12)}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\//.test(file.mimetype)) return cb(new Error('Arquivo precisa ser uma imagem'));
    cb(null, true);
  },
});

const router = Router();

// Serve de foto com controle de acesso: treinadora sempre; aluno só a própria foto marcada como visível
router.get('/fotos/:alunoId/:arquivo', autenticar, async (req, res) => {
  await db.read();
  const { alunoId, arquivo } = req.params;
  if (req.usuario.role === 'treinador') {
    // ok
  } else if (req.usuario.role === 'aluno' && req.usuario.alunoId === alunoId) {
    const visivel = db.data.avaliacoes
      .filter((av) => av.alunoId === alunoId)
      .flatMap((av) => av.fotos)
      .some((f) => f.arquivo === arquivo && f.visivelParaAluno);
    if (!visivel) return res.status(403).end();
  } else {
    return res.status(403).end();
  }
  const filePath = path.join(uploadsDir, alunoId, arquivo);
  if (!fs.existsSync(filePath)) return res.status(404).end();
  res.sendFile(filePath);
});

router.use(autenticar, exigirTreinador);

router.get('/', async (req, res) => {
  await db.read();
  const { alunoId } = req.query;
  let lista = db.data.avaliacoes;
  if (alunoId) lista = lista.filter((a) => a.alunoId === alunoId);
  res.json(lista.sort((a, b) => (a.data < b.data ? 1 : -1)));
});

router.post('/', async (req, res) => {
  const { alunoId, data, peso, medidas, observacoesPrivadas } = req.body;
  if (!alunoId || !data) return res.status(400).json({ error: 'alunoId e data são obrigatórios' });
  await db.read();
  const aluno = db.data.alunos.find((a) => a.id === alunoId);
  if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
  const avaliacao = {
    id: nanoid(10),
    alunoId,
    data,
    peso: peso !== undefined && peso !== '' ? Number(peso) : null,
    medidas: medidas && typeof medidas === 'object' ? medidas : {},
    observacoesPrivadas: observacoesPrivadas?.trim() || '',
    fotos: [],
    createdAt: new Date().toISOString(),
  };
  db.data.avaliacoes.push(avaliacao);
  await db.write();
  res.status(201).json(avaliacao);
});

router.put('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.avaliacoes.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Avaliação não encontrada' });
  const atual = db.data.avaliacoes[idx];
  const { data, peso, medidas, observacoesPrivadas } = req.body;
  const atualizado = {
    ...atual,
    data: data !== undefined ? data : atual.data,
    peso: peso !== undefined ? (peso === '' ? null : Number(peso)) : atual.peso,
    medidas: medidas !== undefined ? medidas : atual.medidas,
    observacoesPrivadas: observacoesPrivadas !== undefined ? observacoesPrivadas.trim() : atual.observacoesPrivadas,
  };
  db.data.avaliacoes[idx] = atualizado;
  await db.write();
  res.json(atualizado);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.avaliacoes.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Avaliação não encontrada' });
  const [removida] = db.data.avaliacoes.splice(idx, 1);
  for (const foto of removida.fotos || []) {
    const filePath = path.join(uploadsDir, removida.alunoId, foto.arquivo);
    fs.rm(filePath, () => {});
  }
  await db.write();
  res.status(204).end();
});

// POST /api/avaliacoes/:id/fotos/:alunoId - upload de uma foto
router.post('/:id/fotos/:alunoId', upload.single('foto'), async (req, res) => {
  await db.read();
  const idx = db.data.avaliacoes.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Avaliação não encontrada' });
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });
  const foto = {
    id: nanoid(10),
    arquivo: req.file.filename,
    tipo: req.body.tipo || 'geral',
    visivelParaAluno: false,
    createdAt: new Date().toISOString(),
  };
  db.data.avaliacoes[idx].fotos.push(foto);
  await db.write();
  res.status(201).json(foto);
});

// PUT /api/avaliacoes/:id/fotos/:fotoId - alterna visibilidade pro aluno / tipo
router.put('/:id/fotos/:fotoId', async (req, res) => {
  await db.read();
  const avaliacao = db.data.avaliacoes.find((a) => a.id === req.params.id);
  if (!avaliacao) return res.status(404).json({ error: 'Avaliação não encontrada' });
  const foto = avaliacao.fotos.find((f) => f.id === req.params.fotoId);
  if (!foto) return res.status(404).json({ error: 'Foto não encontrada' });
  const { visivelParaAluno, tipo } = req.body;
  if (visivelParaAluno !== undefined) foto.visivelParaAluno = Boolean(visivelParaAluno);
  if (tipo !== undefined) foto.tipo = tipo;
  await db.write();
  res.json(foto);
});

// DELETE /api/avaliacoes/:id/fotos/:fotoId
router.delete('/:id/fotos/:fotoId', async (req, res) => {
  await db.read();
  const avaliacao = db.data.avaliacoes.find((a) => a.id === req.params.id);
  if (!avaliacao) return res.status(404).json({ error: 'Avaliação não encontrada' });
  const idx = avaliacao.fotos.findIndex((f) => f.id === req.params.fotoId);
  if (idx === -1) return res.status(404).json({ error: 'Foto não encontrada' });
  const [removida] = avaliacao.fotos.splice(idx, 1);
  const filePath = path.join(uploadsDir, avaliacao.alunoId, removida.arquivo);
  fs.rm(filePath, () => {});
  await db.write();
  res.status(204).end();
});

export default router;
