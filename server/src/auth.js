import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { db } from './db.js';

const JWT_EXPIRACAO = '180d';

export async function getJwtSecret() {
  await db.read();
  if (!db.data.config) db.data.config = {};
  if (!db.data.config.jwtSecret) {
    db.data.config.jwtSecret = nanoid(32);
    await db.write();
  }
  return db.data.config.jwtSecret;
}

export async function hashSenha(senha) {
  return bcrypt.hash(senha, 10);
}

export async function verificarSenha(senha, hash) {
  if (!hash) return false;
  return bcrypt.compare(senha, hash);
}

export async function gerarToken(payload) {
  const secret = await getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRACAO });
}

export async function autenticar(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = (header.startsWith('Bearer ') ? header.slice(7) : null) || req.query.token || null;
    if (!token) return res.status(401).json({ error: 'Não autenticado' });
    const secret = await getJwtSecret();
    req.usuario = jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ error: 'Sessão inválida ou expirada' });
  }
}

export function exigirTreinador(req, res, next) {
  if (req.usuario?.role !== 'treinador') {
    return res.status(403).json({ error: 'Acesso restrito à treinadora' });
  }
  next();
}

export function exigirAluno(req, res, next) {
  if (req.usuario?.role !== 'aluno') {
    return res.status(403).json({ error: 'Acesso restrito ao aluno' });
  }
  next();
}

export function gerarSenhaAleatoria() {
  const digitos = Math.floor(1000 + Math.random() * 9000);
  return String(digitos);
}

export function gerarUsuario(nome) {
  const base = nome
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(' ')[0]
    .replace(/[^a-z0-9]/g, '');
  return `${base}${Math.floor(10 + Math.random() * 90)}`;
}
