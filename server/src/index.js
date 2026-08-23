import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initDb } from './db.js';
import alunosRouter from './routes/alunos.js';
import aulasRouter from './routes/aulas.js';
import pagamentosRouter from './routes/pagamentos.js';
import dashboardRouter from './routes/dashboard.js';
import exerciciosRouter from './routes/exercicios.js';
import treinosRouter from './routes/treinos.js';
import { PASTA_MIDIA } from './midia.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/alunos', alunosRouter);
app.use('/api/aulas', aulasRouter);
app.use('/api/pagamentos', pagamentosRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/exercicios', exerciciosRouter);
app.use('/api/treinos', treinosRouter);

// Fotos e vídeos dos exercícios. Imutáveis: o nome do arquivo é sorteado e nunca
// reaproveitado, então o navegador pode guardar para sempre.
app.use('/midia', express.static(PASTA_MIDIA, { maxAge: '365d', immutable: true }));

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
