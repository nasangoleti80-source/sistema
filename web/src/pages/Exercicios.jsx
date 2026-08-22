import { useEffect, useState } from 'react';
import { api, GRUPOS_MUSCULARES } from '../api.js';

const FORM_VAZIO = { nome: '', grupoMuscular: 'peito', videoUrl: '', equipamento: '', descricao: '' };

export default function Exercicios() {
  const [exercicios, setExercicios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');

  async function carregar() {
    setCarregando(true);
    try {
      setExercicios(await api.listarExercicios());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  function abrirNovo() {
    setEditando(null);
    setForm(FORM_VAZIO);
    setErro('');
    setModalAberto(true);
  }

  function abrirEdicao(ex) {
    setEditando(ex);
    setForm({ nome: ex.nome, grupoMuscular: ex.grupoMuscular, videoUrl: ex.videoUrl, equipamento: ex.equipamento, descricao: ex.descricao });
    setErro('');
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      if (editando) await api.atualizarExercicio(editando.id, form);
      else await api.criarExercicio(form);
      setModalAberto(false);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function excluir(ex) {
    if (!confirm(`Excluir "${ex.nome}"?`)) return;
    await api.removerExercicio(ex.id);
    await carregar();
  }

  const lista = exercicios.filter((e) => !filtroGrupo || e.grupoMuscular === filtroGrupo);

  return (
    <div>
      <h1>Exercícios</h1>
      <p className="subtitle">Biblioteca de exercícios com vídeo demonstrativo</p>

      <div className="row" style={{ marginBottom: 12, gap: 8 }}>
        <select value={filtroGrupo} onChange={(e) => setFiltroGrupo(e.target.value)}>
          <option value="">Todos os grupos</option>
          {Object.entries(GRUPOS_MUSCULARES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button className="btn-primary" onClick={abrirNovo}>+ Exercício</button>
      </div>

      {carregando && <p className="empty">Carregando...</p>}
      {!carregando && lista.length === 0 && <p className="empty">Nenhum exercício cadastrado.</p>}

      <div className="card">
        {lista.map((ex) => (
          <div className="list-item" key={ex.id}>
            <div onClick={() => abrirEdicao(ex)} style={{ cursor: 'pointer', flex: 1 }}>
              <div className="name">{ex.nome}</div>
              <div className="meta">{GRUPOS_MUSCULARES[ex.grupoMuscular]} {ex.equipamento && `· ${ex.equipamento}`} {ex.videoUrl && '· 🎥 vídeo'}</div>
            </div>
            <button className="btn-danger btn-small" onClick={() => excluir(ex)}>Excluir</button>
          </div>
        ))}
      </div>

      {modalAberto && (
        <div className="modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>{editando ? 'Editar exercício' : 'Novo exercício'}</h1>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={salvar}>
              <label>Nome *</label>
              <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />

              <label>Grupo muscular</label>
              <select value={form.grupoMuscular} onChange={(e) => setForm({ ...form, grupoMuscular: e.target.value })}>
                {Object.entries(GRUPOS_MUSCULARES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>

              <label>Link do vídeo (YouTube, Instagram, etc.)</label>
              <input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://..." />

              <label>Equipamento</label>
              <input value={form.equipamento} onChange={(e) => setForm({ ...form, equipamento: e.target.value })} placeholder="Barra, halteres, máquina..." />

              <label>Observações / execução</label>
              <textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />

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
