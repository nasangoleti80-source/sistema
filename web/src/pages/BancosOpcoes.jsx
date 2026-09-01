import { useEffect, useState } from 'react';
import { api } from '../api.js';
import EditorItens from '../components/EditorItens.jsx';

function novaOpcao(numero) {
  return { id: crypto.randomUUID(), nome: `Opção ${numero}`, itens: [] };
}

function formVazio() {
  return { nome: '', opcoes: [novaOpcao(1)] };
}

export default function BancosOpcoes() {
  const [bancos, setBancos] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(formVazio());
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    try {
      setBancos(await api.listarBancosOpcoes());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    api.listarAlimentos().then(setCatalogo);
  }, []);

  function abrirNovo() {
    setEditando(null);
    setForm(formVazio());
    setErro('');
    setModalAberto(true);
  }

  function abrirEdicao(banco) {
    setEditando(banco);
    setForm({ nome: banco.nome, opcoes: banco.opcoes.length ? banco.opcoes : [novaOpcao(1)] });
    setErro('');
    setModalAberto(true);
  }

  function addOpcao() {
    setForm((f) => ({ ...f, opcoes: [...f.opcoes, novaOpcao(f.opcoes.length + 1)] }));
  }

  function removerOpcao(id) {
    setForm((f) => ({ ...f, opcoes: f.opcoes.filter((o) => o.id !== id) }));
  }

  function renomearOpcao(id, nome) {
    setForm((f) => ({ ...f, opcoes: f.opcoes.map((o) => (o.id === id ? { ...o, nome } : o)) }));
  }

  function setItensOpcao(id, itens) {
    setForm((f) => ({ ...f, opcoes: f.opcoes.map((o) => (o.id === id ? { ...o, itens } : o)) }));
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      const opcoesLimpas = form.opcoes
        .map((o) => ({
          ...o,
          itens: o.itens
            .map((it) => ({ ...it, opcoes: it.opcoes.filter((op) => op.alimentoId) }))
            .filter((it) => it.opcoes.length > 0),
        }))
        .filter((o) => o.itens.length > 0);
      if (editando) await api.atualizarBancoOpcoes(editando.id, { ...form, opcoes: opcoesLimpas });
      else await api.criarBancoOpcoes({ ...form, opcoes: opcoesLimpas });
      setModalAberto(false);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function excluir(banco) {
    if (!confirm(`Excluir o banco "${banco.nome}"? Refeições que usam ele ficarão sem opções.`)) return;
    await api.removerBancoOpcoes(banco.id);
    await carregar();
  }

  return (
    <div>
      <h1>Bancos de opções</h1>
      <p className="subtitle">
        Grupos de refeições completas intercambiáveis (ex: "Opção 02", "Opção 03"...) que o aluno escolhe
        inteira — várias refeições podem usar o mesmo banco.
      </p>

      <button className="btn-primary" onClick={abrirNovo} style={{ marginBottom: 12 }}>+ Banco de opções</button>

      {carregando && <p className="empty">Carregando...</p>}
      {!carregando && bancos.length === 0 && <p className="empty">Nenhum banco de opções cadastrado ainda.</p>}

      {bancos.map((b) => (
        <div className="card" key={b.id}>
          <div className="row">
            <div onClick={() => abrirEdicao(b)} style={{ cursor: 'pointer', flex: 1 }}>
              <div className="name">{b.nome}</div>
              <div className="meta">{b.opcoes?.length || 0} opção(ões) cadastrada(s)</div>
            </div>
            <button className="btn-danger btn-small" onClick={() => excluir(b)}>Excluir</button>
          </div>
        </div>
      ))}

      {modalAberto && (
        <div className="modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>{editando ? 'Editar banco de opções' : 'Novo banco de opções'}</h1>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={salvar}>
              <label>Nome do banco</label>
              <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Café da manhã / lanche / jantar — 450kcal" />

              {form.opcoes.map((op) => (
                <div key={op.id} className="card" style={{ background: 'var(--bg)', marginTop: 12 }}>
                  <div className="row">
                    <input value={op.nome} onChange={(e) => renomearOpcao(op.id, e.target.value)} style={{ flex: 1 }} />
                    <button type="button" className="btn-danger btn-small" onClick={() => removerOpcao(op.id)}>Excluir opção</button>
                  </div>
                  <EditorItens
                    itens={op.itens}
                    catalogo={catalogo}
                    onChange={(itens) => setItensOpcao(op.id, itens)}
                    rotuloItem="Alimento"
                  />
                </div>
              ))}

              <button type="button" className="btn-secondary btn-small" style={{ marginTop: 12 }} onClick={addOpcao}>
                + Opção
              </button>

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
