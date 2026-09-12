import { useEffect, useState } from 'react';
import { api, TIPOS_REFEICAO } from '../api.js';
import ConstrutorDieta from '../components/ConstrutorDieta.jsx';

function formVazio() {
  return { nome: '', observacoes: '', refeicoesPorTipo: {}, opcoesPorTipo: {}, bancoOrigemPorTipo: {}, horarioPorTipo: {} };
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
    const opcoesPorTipo = {};
    const bancoOrigemPorTipo = {};
    const horarioPorTipo = {};
    for (const r of modelo.refeicoes || []) {
      if (r.horario) horarioPorTipo[r.tipo] = r.horario;
      if (r.opcoes) {
        opcoesPorTipo[r.tipo] = r.opcoes;
        if (r.bancoOrigemId) bancoOrigemPorTipo[r.tipo] = r.bancoOrigemId;
      } else if (r.bancoId) {
        const banco = bancos.find((b) => b.id === r.bancoId);
        opcoesPorTipo[r.tipo] = banco ? JSON.parse(JSON.stringify(banco.opcoes)) : [];
        bancoOrigemPorTipo[r.tipo] = r.bancoId;
      } else {
        refeicoesPorTipo[r.tipo] = r.itens || [];
      }
    }
    setEditando(modelo);
    setForm({ nome: modelo.nome, observacoes: modelo.observacoes || '', refeicoesPorTipo, opcoesPorTipo, bancoOrigemPorTipo, horarioPorTipo });
    setErro('');
    setModalAberto(true);
  }

  function toggleTipo(tipo) {
    setForm((f) => {
      const ativo = f.refeicoesPorTipo[tipo] !== undefined || f.opcoesPorTipo[tipo] !== undefined;
      if (ativo) {
        const { [tipo]: _r, ...refeicoesPorTipo } = f.refeicoesPorTipo;
        const { [tipo]: _o, ...opcoesPorTipo } = f.opcoesPorTipo;
        const { [tipo]: _b, ...bancoOrigemPorTipo } = f.bancoOrigemPorTipo;
        const { [tipo]: _h, ...horarioPorTipo } = f.horarioPorTipo;
        return { ...f, refeicoesPorTipo, opcoesPorTipo, bancoOrigemPorTipo, horarioPorTipo };
      }
      return { ...f, refeicoesPorTipo: { ...f.refeicoesPorTipo, [tipo]: [] } };
    });
  }

  function setItens(tipo, itens) {
    setForm((f) => ({ ...f, refeicoesPorTipo: { ...f.refeicoesPorTipo, [tipo]: itens } }));
  }

  function setOpcoes(tipo, opcoes) {
    setForm((f) => ({ ...f, opcoesPorTipo: { ...f.opcoesPorTipo, [tipo]: opcoes } }));
  }

  function setHorario(tipo, horario) {
    setForm((f) => ({ ...f, horarioPorTipo: { ...f.horarioPorTipo, [tipo]: horario } }));
  }

  function escolherBanco(tipo, bancoId) {
    setForm((f) => {
      const opcoesPorTipo = { ...f.opcoesPorTipo };
      const bancoOrigemPorTipo = { ...f.bancoOrigemPorTipo };
      const refeicoesPorTipo = { ...f.refeicoesPorTipo };
      if (bancoId) {
        const banco = bancos.find((b) => b.id === bancoId);
        opcoesPorTipo[tipo] = banco ? JSON.parse(JSON.stringify(banco.opcoes)) : [];
        bancoOrigemPorTipo[tipo] = bancoId;
        delete refeicoesPorTipo[tipo];
      } else {
        delete opcoesPorTipo[tipo];
        delete bancoOrigemPorTipo[tipo];
        refeicoesPorTipo[tipo] = [];
      }
      return { ...f, opcoesPorTipo, bancoOrigemPorTipo, refeicoesPorTipo };
    });
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      const tiposAtivos = [...new Set([...Object.keys(form.refeicoesPorTipo), ...Object.keys(form.opcoesPorTipo)])];
      const refeicoes = tiposAtivos
        .map((tipo) => {
          if (form.opcoesPorTipo[tipo]) {
            const opcoes = form.opcoesPorTipo[tipo]
              .map((op) => ({
                ...op,
                itens: op.itens
                  .map((it) => ({ ...it, opcoes: it.opcoes.filter((o) => o.nome?.trim()) }))
                  .filter((it) => it.opcoes.length > 0),
              }))
              .filter((op) => op.itens.length > 0);
            return { tipo, nome: TIPOS_REFEICAO[tipo], horario: form.horarioPorTipo[tipo] || '', bancoOrigemId: form.bancoOrigemPorTipo[tipo] || null, opcoes };
          }
          const itens = (form.refeicoesPorTipo[tipo] || [])
            .map((it) => ({ ...it, opcoes: it.opcoes.filter((op) => op.nome?.trim()) }))
            .filter((it) => it.opcoes.length > 0);
          return { tipo, nome: TIPOS_REFEICAO[tipo], horario: form.horarioPorTipo[tipo] || '', itens };
        })
        .filter((r) => (r.opcoes && r.opcoes.length > 0) || (r.itens && r.itens.length > 0));

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

  const tiposAtivos = [...new Set([...Object.keys(form.refeicoesPorTipo), ...Object.keys(form.opcoesPorTipo)])];

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
                opcoesPorTipo={form.opcoesPorTipo}
                bancoOrigemPorTipo={form.bancoOrigemPorTipo}
                onEscolherBanco={escolherBanco}
                onSetOpcoes={setOpcoes}
                horarioPorTipo={form.horarioPorTipo}
                onSetHorario={setHorario}
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
