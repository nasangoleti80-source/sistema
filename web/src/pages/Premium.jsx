import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, CATEGORIAS_VIDEO, getToken } from '../api.js';

function comToken(url) {
  return `${url}?token=${encodeURIComponent(getToken())}`;
}

const FORM_VAZIO = { titulo: '', descricao: '', categoria: 'dicas' };

export default function Premium() {
  const [videos, setVideos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState(FORM_VAZIO);
  const [enviando, setEnviando] = useState(false);
  const fileRef = useRef(null);

  async function carregar() {
    try {
      setVideos(await api.listarVideos());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function enviar(e) {
    e.preventDefault();
    const arquivo = fileRef.current?.files[0];
    if (!form.titulo.trim() || !arquivo) {
      setErro('Título e arquivo de vídeo são obrigatórios');
      return;
    }
    setErro('');
    setEnviando(true);
    try {
      await api.criarVideo(form.titulo, form.descricao, form.categoria, arquivo);
      setForm(FORM_VAZIO);
      if (fileRef.current) fileRef.current.value = '';
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function remover(id) {
    if (!confirm('Remover esse vídeo? Quem tem acesso premium vai deixar de vê-lo.')) return;
    await api.removerVideo(id);
    await carregar();
  }

  return (
    <div>
      <Link to="/alunos" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>‹ Voltar pra Alunos</Link>
      <h1>Área Premium</h1>
      <p className="subtitle">Vídeos exclusivos pra quem tem acesso liberado. Libere o acesso no cadastro de cada aluno.</p>

      {erro && <div className="error-msg">{erro}</div>}

      <div className="card">
        <form onSubmit={enviar}>
          <label>Título</label>
          <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Cardio HIIT 15 minutos" />

          <label>Categoria</label>
          <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
            {Object.entries(CATEGORIAS_VIDEO).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <label>Descrição</label>
          <textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="O que o aluno vai encontrar nesse vídeo" />

          <label>Arquivo de vídeo</label>
          <input type="file" accept="video/*" ref={fileRef} />

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={enviando}>
              {enviando ? 'Enviando...' : '+ Publicar vídeo'}
            </button>
          </div>
        </form>
      </div>

      <h2>Vídeos publicados</h2>
      {carregando && <p className="empty">Carregando...</p>}
      {!carregando && videos.length === 0 && <p className="empty">Nenhum vídeo publicado ainda.</p>}

      {videos.map((v) => (
        <div className="card" key={v.id}>
          <div className="row">
            <div className="name">{v.titulo}</div>
            <button className="btn-secondary btn-small" onClick={() => remover(v.id)}>Remover</button>
          </div>
          <div className="meta" style={{ marginBottom: 8 }}>{CATEGORIAS_VIDEO[v.categoria]}</div>
          {v.descricao && <p style={{ margin: '0 0 8px', fontSize: 13 }}>{v.descricao}</p>}
          <video src={comToken(v.url)} controls style={{ width: '100%', borderRadius: 8 }} />
        </div>
      ))}
    </div>
  );
}
