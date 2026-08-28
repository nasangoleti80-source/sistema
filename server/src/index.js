import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initDb } from './db.js';
import authRouter from './routes/auth.js';
import alunosRouter from './routes/alunos.js';
import aulasRouter from './routes/aulas.js';
import pagamentosRouter from './routes/pagamentos.js';
import dashboardRouter from './routes/dashboard.js';
import avaliacoesRouter from './routes/avaliacoes.js';
import treinosRouter from './routes/treinos.js';
import mensagensRouter from './routes/mensagens.js';
import alimentosRouter from './routes/alimentos.js';
import dietasRouter from './routes/dietas.js';
import videosRouter from './routes/videos.js';
import planosRouter from './routes/planos.js';
import meuRouter from './routes/meu.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/alunos', alunosRouter);
app.use('/api/aulas', aulasRouter);
app.use('/api/pagamentos', pagamentosRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/avaliacoes', avaliacoesRouter);
app.use('/api/treinos', treinosRouter);
app.use('/api/mensagens', mensagensRouter);
app.use('/api/alimentos', alimentosRouter);
app.use('/api/dietas', dietasRouter);
app.use('/api/videos', videosRouter);
app.use('/api/planos', planosRouter);
app.use('/api/meu', meuRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const webDist = path.join(__dirname, '..', '..', 'web', 'dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(webDist, 'index.html'));
  });
}

await initDb();

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
