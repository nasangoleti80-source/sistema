import { useEffect, useState } from 'react';
import { api, TIPOS_REFEICAO } from '../api.js';
import ConstrutorDieta from '../components/ConstrutorDieta.jsx';

function formVazio() {
  return { nome: '', observacoes: '', refeicoesPorTipo: {}, bancoPorTipo: {} };
}

export default function ModelosDieta() {
  const [modelos, setModelos] = useState([]);
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
      setModelos(await api.listarModelosDieta());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    api.listarBancosOpcoes().then(setBancos);
    api.listarAlimentos().then(setCatalogo);
  }, []);

  function abrirNovo() {
    setEditando(null);
    setForm(formVazio());
    setErro('');
    setModalAberto(true);
  }

  function abrirEdicao(modelo) {
    const refeicoesPorTipo = {};
    const bancoPorTipo = {};
    for (const r of modelo.refeicoes || []) {
      if (r.bancoId) bancoPorTipo[r.tipo] = r.bancoId;
      else refeicoesPorTipo[r.tipo] = r.itens || [];
    }
    setEditando(modelo);
    setForm({ nome: modelo.nome, observacoes: modelo.observacoes || '', refeicoesPorTipo, bancoPorTipo });
    setErro('');
    setModalAberto(true);
  }

  function toggleTipo(tipo) {
    setForm((f) => {
      const ativo = f.refeicoesPorTipo[tipo] !== undefined || f.bancoPorTipo[tipo] !== undefined;
      if (ativo) {
        const { [tipo]: _r, ...refeicoesPorTipo } = f.refeicoesPorTipo;
        const { [tipo]: _b, ...bancoPorTipo } = f.bancoPorTipo;
        return { ...f, refeicoesPorTipo, bancoPorTipo };
      }
      return { ...f, refeicoesPorTipo: { ...f.refeicoesPorTipo, [tipo]: [] } };
    });
  }

  function setItens(tipo, itens) {
    setForm((f) => ({ ...f, refeicoesPorTipo: { ...f.refeicoesPorTipo, [tipo]: itens } }));
  }

  function setBanco(tipo, bancoId) {
    setForm((f) => {
      const bancoPorTipo = { ...f.bancoPorTipo };
      const refeicoesPorTipo = { ...f.refeicoesPorTipo };
      if (bancoId) {
        bancoPorTipo[tipo] = bancoId;
        delete refeicoesPorTipo[tipo];
      } else {
        delete bancoPorTipo[tipo];
        refeicoesPorTipo[tipo] = [];
      }
      return { ...f, bancoPorTipo, refeicoesPorTipo };
    });
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      const tiposAtivos = [...new Set([...Object.keys(form.refeicoesPorTipo), ...Object.keys(form.bancoPorTipo)])];
      const refeicoes = tiposAtivos
        .map((tipo) => {
          if (form.bancoPorTipo[tipo]) return { tipo, nome: TIPOS_REFEICAO[tipo], bancoId: form.bancoPorTipo[tipo] };
          const itens = (form.refeicoesPorTipo[tipo] || [])
            .map((it) => ({ ...it, opcoes: it.opcoes.filter((op) => op.nome?.trim()) }))
            .filter((it) => it.opcoes.length > 0);
          return { tipo, nome: TIPOS_REFEICAO[tipo], itens };
        })
        .filter((r) => r.bancoId || (r.itens && r.itens.length > 0));

      if (editando) await api.atualizarModeloDieta(editando.id, { nome: form.nome, observacoes: form.observacoes, refeicoes });
      else await api.criarModeloDieta({ nome: form.nome, observacoes: form.observacoes, refeicoes });
      setModalAberto(false);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function excluir(modelo) {
    if (!confirm(`Excluir o modelo "${modelo.nome}"?`)) return;
    await api.removerModeloDieta(modelo.id);
    await carregar();
  }

  const tiposAtivos = [...new Set([...Object.keys(form.refeicoesPorTipo), ...Object.keys(form.bancoPorTipo)])];

  return (
    <div>
      <h1>Modelos de dieta</h1>
      <p className="subtitle">Dietas prontas para reaproveitar — monte uma vez e aplique em qualquer aluno na tela de Dieta.</p>

      <button className="btn-primary" onClick={abrirNovo} style={{ marginBottom: 12 }}>+ Modelo</button>

      {carregando && <p className="empty">Carregando...</p>}
      {!carregando && modelos.length === 0 && <p className="empty">Nenhum modelo cadastrado ainda.</p>}

      {modelos.map((m) => (
        <div className="card" key={m.id}>
          <div className="row">
            <div onClick={() => abrirEdicao(m)} style={{ cursor: 'pointer', flex: 1 }}>
              <div className="name">{m.nome}</div>
              <div className="meta">{(m.refeicoes || []).map((r) => TIPOS_REFEICAO[r.tipo]).join(', ')}</div>
            </div>
            <button className="btn-danger btn-small" onClick={() => excluir(m)}>Excluir</button>
          </div>
        </div>
      ))}

      {modalAberto && (
        <div className="modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>{editando ? 'Editar modelo' : 'Novo modelo de dieta'}</h1>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={salvar}>
              <label>Nome do modelo</label>
              <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Cutting padrão" />

              <ConstrutorDieta
                tiposAtivos={tiposAtivos}
                onToggleTipo={toggleTipo}
                refeicoesPorTipo={form.refeicoesPorTipo}
                onSetItens={setItens}
                bancoPorTipo={form.bancoPorTipo}
                onSetBanco={setBanco}
                bancos={bancos}
                catalogo={catalogo}
              />

              <label>Observações gerais</label>
              <textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />

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
