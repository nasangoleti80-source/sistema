import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function BancoAlimentos() {
  const [grupos, setGrupos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [novoGrupo, setNovoGrupo] = useState('');
  const [novoItem, setNovoItem] = useState({});

  async function carregar() {
    try {
      setGrupos(await api.listarGruposAlimentos());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function criarGrupo(e) {
    e.preventDefault();
    if (!novoGrupo.trim()) return;
    try {
      await api.criarGrupoAlimentos(novoGrupo.trim());
      setNovoGrupo('');
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function removerGrupo(id) {
    if (!confirm('Remover esse grupo de alimentos?')) return;
    await api.removerGrupoAlimentos(id);
    await carregar();
  }

  async function adicionarItem(grupoId) {
    const dados = novoItem[grupoId];
    if (!dados?.alimento?.trim()) return;
    try {
      await api.adicionarItemAlimento(grupoId, dados);
      setNovoItem({ ...novoItem, [grupoId]: { alimento: '', quantidade: '' } });
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function removerItem(grupoId, itemId) {
    await api.removerItemAlimento(grupoId, itemId);
    await carregar();
  }

  return (
    <div>
      <Link to="/alunos" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>‹ Voltar pra Alunos</Link>
      <h1>Banco de alimentos</h1>
      <p className="subtitle">Grupos de alimentos equivalentes que você pode usar em qualquer dieta como opção de substituição.</p>

      {erro && <div className="error-msg">{erro}</div>}

      <form onSubmit={criarGrupo} className="row" style={{ marginBottom: 14, gap: 8 }}>
        <input value={novoGrupo} onChange={(e) => setNovoGrupo(e.target.value)} placeholder="Nome do grupo (ex: Fontes de carboidrato)" />
        <button type="submit" className="btn-primary btn-small">+ Grupo</button>
      </form>

      {carregando && <p className="empty">Carregando...</p>}
      {!carregando && grupos.length === 0 && <p className="empty">Nenhum grupo cadastrado ainda.</p>}

      {grupos.map((g) => (
        <div className="card" key={g.id}>
          <div className="row">
            <div className="name">{g.nome}</div>
            <button className="btn-secondary btn-small" onClick={() => removerGrupo(g.id)}>Remover grupo</button>
          </div>

          {g.itens.map((item) => (
            <div className="list-item" key={item.id}>
              <span>{item.alimento} {item.quantidade && `· ${item.quantidade}`}</span>
              <button className="btn-secondary btn-small" onClick={() => removerItem(g.id, item.id)}>×</button>
            </div>
          ))}

          <div className="row" style={{ marginTop: 8, gap: 6 }}>
            <input
              placeholder="Alimento"
              value={novoItem[g.id]?.alimento || ''}
              onChange={(e) => setNovoItem({ ...novoItem, [g.id]: { ...novoItem[g.id], alimento: e.target.value } })}
              style={{ flex: 2 }}
            />
            <input
              placeholder="Qtd"
              value={novoItem[g.id]?.quantidade || ''}
              onChange={(e) => setNovoItem({ ...novoItem, [g.id]: { ...novoItem[g.id], quantidade: e.target.value } })}
              style={{ flex: 1 }}
            />
            <button type="button" className="btn-secondary btn-small" onClick={() => adicionarItem(g.id)}>+</button>
          </div>
        </div>
      ))}
    </div>
  );
}
