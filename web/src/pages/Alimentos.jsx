import { useEffect, useState } from 'react';
import { api, UNIDADES_ALIMENTO, CATEGORIAS_ALIMENTO } from '../api.js';

const FORM_VAZIO = { nome: '', unidade: 'g', quantidadePadrao: '', categoria: 'proteina' };

export default function Alimentos() {
  const [alimentos, setAlimentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  async function carregar() {
    setCarregando(true);
    try {
      setAlimentos(await api.listarAlimentos());
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

  function abrirEdicao(al) {
    setEditando(al);
    setForm({
      nome: al.nome,
      unidade: al.unidade,
      quantidadePadrao: al.quantidadePadrao != null ? String(al.quantidadePadrao) : '',
      categoria: al.categoria,
    });
    setErro('');
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      if (editando) await api.atualizarAlimento(editando.id, form);
      else await api.criarAlimento(form);
      setModalAberto(false);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function excluir(al) {
    if (!confirm(`Excluir "${al.nome}" do catálogo?`)) return;
    await api.removerAlimento(al.id);
    await carregar();
  }

  const lista = alimentos.filter((a) => !filtroCategoria || a.categoria === filtroCategoria);

  return (
    <div>
      <h1>Alimentos</h1>
      <p className="subtitle">Catálogo de opções prontas para montar as dietas dos alunos</p>

      <div className="row" style={{ marginBottom: 12, gap: 8 }}>
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORIAS_ALIMENTO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button className="btn-primary" onClick={abrirNovo}>+ Alimento</button>
      </div>

      {carregando && <p className="empty">Carregando...</p>}
      {!carregando && lista.length === 0 && (
        <p className="empty">Nenhum alimento cadastrado ainda. Cadastre aqui as opções que vai usar nas dietas.</p>
      )}

      <div className="card">
        {lista.map((al) => (
          <div className="list-item" key={al.id}>
            <div onClick={() => abrirEdicao(al)} style={{ cursor: 'pointer', flex: 1 }}>
              <div className="name">{al.nome}</div>
              <div className="meta">
                {CATEGORIAS_ALIMENTO[al.categoria]}
                {al.quantidadePadrao ? ` · ${al.quantidadePadrao} ${UNIDADES_ALIMENTO[al.unidade]}` : ''}
              </div>
            </div>
            <button className="btn-danger btn-small" onClick={() => excluir(al)}>Excluir</button>
          </div>
        ))}
      </div>

      {modalAberto && (
        <div className="modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>{editando ? 'Editar alimento' : 'Novo alimento'}</h1>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={salvar}>
              <label>Nome *</label>
              <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Peito de frango grelhado" />

              <label>Categoria</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                {Object.entries(CATEGORIAS_ALIMENTO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>

              <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <label>Quantidade padrão</label>
                  <input type="number" min="0" step="0.1" value={form.quantidadePadrao} onChange={(e) => setForm({ ...form, quantidadePadrao: e.target.value })} placeholder="150" />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Unidade</label>
                  <select value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })}>
                    {Object.entries(UNIDADES_ALIMENTO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

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
