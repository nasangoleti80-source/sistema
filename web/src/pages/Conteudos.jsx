import { useEffect, useState } from 'react';
import { api } from '../api.js';

const FORM_VAZIO = { titulo: '', categoria: '', videoUrl: '', capaUrl: '', restrito: false };

export default function Conteudos() {
  const [conteudos, setConteudos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    try {
      setConteudos(await api.listarConteudos());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  function abrirNovo(categoria) {
    setEditando(null);
    setForm({ ...FORM_VAZIO, categoria: categoria || '' });
    setErro('');
    setModalAberto(true);
  }

  function abrirEdicao(c) {
    setEditando(c);
    setForm({ titulo: c.titulo, categoria: c.categoria, videoUrl: c.videoUrl, capaUrl: c.capaUrl || '', restrito: !!c.restrito });
    setErro('');
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      if (editando) await api.atualizarConteudo(editando.id, form);
      else await api.criarConteudo(form);
      setModalAberto(false);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function excluir(c) {
    if (!confirm(`Excluir "${c.titulo}"?`)) return;
    await api.removerConteudo(c.id);
    await carregar();
  }

  const categorias = [...new Set(conteudos.map((c) => c.categoria))];

  return (
    <div>
      <h1>Conteúdos</h1>
      <p className="subtitle">Vídeos que os alunos veem no portal deles, organizados por categoria — estilo Netflix</p>

      <div className="row" style={{ marginBottom: 12, gap: 8 }}>
        <button className="btn-primary" onClick={() => abrirNovo()}>+ Vídeo</button>
      </div>

      {carregando && <p className="empty">Carregando...</p>}
      {!carregando && conteudos.length === 0 && (
        <p className="empty">Nenhum vídeo cadastrado ainda. Cole o link do YouTube e escolha uma categoria — ela vira uma fileira no portal do aluno.</p>
      )}

      {categorias.map((cat) => (
        <div className="card" key={cat}>
          <div className="row">
            <div className="name">{cat}</div>
            <button className="btn-secondary btn-small" onClick={() => abrirNovo(cat)}>+ Nessa categoria</button>
          </div>
          {conteudos.filter((c) => c.categoria === cat).map((c) => (
            <div className="list-item" key={c.id}>
              {c.capaUrl && <img src={c.capaUrl} alt="" style={{ width: 64, height: 36, objectFit: 'cover', borderRadius: 6, marginRight: 10 }} />}
              <div onClick={() => abrirEdicao(c)} style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}>
                <div className="name">{c.titulo}</div>
                <div className="meta">{c.restrito ? 'Exclusivo para aluno com pacote ativo' : 'Livre para todos os alunos'}</div>
              </div>
              <button className="btn-danger btn-small" onClick={() => excluir(c)}>Excluir</button>
            </div>
          ))}
        </div>
      ))}

      {modalAberto && (
        <div className="modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>{editando ? 'Editar vídeo' : 'Novo vídeo'}</h1>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={salvar}>
              <label>Título *</label>
              <input required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Aula de Pilates — Iniciante" />

              <label>Categoria *</label>
              <input required list="categorias-conteudo" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Ex: Pilates, Defesa Pessoal, Meditação" />
              <datalist id="categorias-conteudo">
                {categorias.map((c) => <option key={c} value={c} />)}
              </datalist>

              <label>Link do vídeo (YouTube) *</label>
              <input required value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />

              <label>Capa (opcional — se vazio, usa a capa do YouTube)</label>
              <input value={form.capaUrl} onChange={(e) => setForm({ ...form, capaUrl: e.target.value })} placeholder="https://..." />

              <label className="row" style={{ gap: 8, alignItems: 'center', marginTop: 8 }}>
                <input type="checkbox" checked={form.restrito} onChange={(e) => setForm({ ...form, restrito: e.target.checked })} style={{ width: 'auto' }} />
                Exclusivo para aluno com pacote ativo (bloqueado para os demais)
              </label>

              <div className="form-actions">
                <button type="submit" className="btn-primary">Salvar</button>
                <button type="button" className="btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
