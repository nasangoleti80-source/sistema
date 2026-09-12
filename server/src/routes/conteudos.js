import { Router } from 'express';
import { nanoid } from 'nanoid';
import { db } from '../db.js';

const router = Router();

// Extrai o ID de um link do YouTube (watch?v=, youtu.be/, shorts/) para
// gerar a capa automática quando o treinador não sobe uma foto própria.
function idDoYoutube(url) {
  const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

router.get('/', async (req, res) => {
  await db.read();
  res.json(db.data.conteudos.sort((a, b) => a.ordem - b.ordem));
});

router.post('/', async (req, res) => {
  const { titulo, categoria, videoUrl, capaUrl, restrito } = req.body;
  if (!titulo?.trim()) return res.status(400).json({ error: 'Título é obrigatório' });
  if (!categoria?.trim()) return res.status(400).json({ error: 'Categoria é obrigatória' });
  if (!videoUrl?.trim()) return res.status(400).json({ error: 'Link do vídeo é obrigatório' });
  await db.read();
  const maiorOrdem = db.data.conteudos.reduce((max, c) => Math.max(max, c.ordem || 0), 0);
  const idYoutube = idDoYoutube(videoUrl);
  const conteudo = {
    id: nanoid(10),
    titulo: titulo.trim(),
    categoria: categoria.trim(),
    videoUrl: videoUrl.trim(),
    capaUrl: capaUrl?.trim() || (idYoutube ? `https://img.youtube.com/vi/${idYoutube}/hqdefault.jpg` : ''),
    // Vídeo exclusivo para aluno com pacote ativo (não vencido) — trava tipo
    // "assinatura", mas o controle de quem pagou continua manual, no Pacotes.
    restrito: !!restrito,
    ordem: maiorOrdem + 1,
    createdAt: new Date().toISOString(),
  };
  db.data.conteudos.push(conteudo);
  await db.write();
  res.status(201).json(conteudo);
});

router.put('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.conteudos.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Conteúdo não encontrado' });
  const atual = db.data.conteudos[idx];
  const { titulo, categoria, videoUrl, capaUrl, ordem, restrito } = req.body;
  const novoVideoUrl = videoUrl !== undefined ? videoUrl.trim() : atual.videoUrl;
  const idYoutube = idDoYoutube(novoVideoUrl);
  const atualizado = {
    ...atual,
    titulo: titulo !== undefined ? titulo.trim() : atual.titulo,
    categoria: categoria !== undefined ? categoria.trim() : atual.categoria,
    videoUrl: novoVideoUrl,
    capaUrl: capaUrl !== undefined
      ? (capaUrl.trim() || (idYoutube ? `https://img.youtube.com/vi/${idYoutube}/hqdefault.jpg` : ''))
      : atual.capaUrl,
    ordem: ordem !== undefined ? Number(ordem) : atual.ordem,
    restrito: restrito !== undefined ? !!restrito : atual.restrito,
  };
  db.data.conteudos[idx] = atualizado;
  await db.write();
  res.json(atualizado);
});

router.delete('/:id', async (req, res) => {
  await db.read();
  const idx = db.data.conteudos.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Conteúdo não encontrado' });
  db.data.conteudos.splice(idx, 1);
  await db.write();
  res.status(204).end();
});

export default router;
