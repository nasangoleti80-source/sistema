import { useEffect, useState } from 'react';
import { api, TIPOS_DESAFIO, formatarData } from '../api.js';

const FORM_VAZIO = { nome: '', descricao: '', tipo: 'treino', dataInicio: '', dataFim: '', participantes: [] };

function statusDesafio(d) {
  const hoje = new Date().toISOString().slice(0, 10);
  if (hoje < d.dataInicio) return 'agendado';
  if (hoje > d.dataFim) return 'encerrado';
  return 'em andamento';
}

export default function Desafios() {
  const [desafios, setDesafios] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    try {
      const [d, a] = await Promise.all([api.listarDesafios(), api.listarAlunos(true)]);
      setDesafios(d);
      setAlunos(a);
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

  function abrirEdicao(d) {
    setEditando(d);
    setForm({
      nome: d.nome, descricao: d.descricao, tipo: d.tipo,
      dataInicio: d.dataInicio, dataFim: d.dataFim, participantes: d.participantes || [],
    });
    setErro('');
    setModalAberto(true);
  }

  function toggleParticipante(alunoId) {
    setForm((f) => ({
      ...f,
      participantes: f.participantes.includes(alunoId)
        ? f.participantes.filter((id) => id !== alunoId)
        : [...f.participantes, alunoId],
    }));
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      if (editando) await api.atualizarDesafio(editando.id, form);
      else await api.criarDesafio(form);
      setModalAberto(false);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function excluir(d) {
    if (!confirm(`Excluir o desafio "${d.nome}"?`)) return;
    await api.removerDesafio(d.id);
    await carregar();
  }

  async function toggleConcluido(desafio, alunoId) {
    const concluidos = desafio.concluidos.includes(alunoId)
      ? desafio.concluidos.filter((id) => id !== alunoId)
      : [...desafio.concluidos, alunoId];
    const atualizado = await api.atualizarDesafio(desafio.id, { concluidos });
    setDesafios((ds) => ds.map((d) => (d.id === desafio.id ? atualizado : d)));
  }

  const participantesDe = (d) => (d.participantes?.length ? alunos.filter((a) => d.participantes.includes(a.id)) : alunos);

  return (
    <div>
      <h1>Desafios</h1>
      <p className="subtitle">Desafios de treino ou dieta, com prazo — motive a turma toda ou só quem você escolher.</p>

      <button className="btn-primary" onClick={abrirNovo} style={{ marginBottom: 12 }}>+ Desafio</button>

      {carregando && <p className="empty">Carregando...</p>}
      {!carregando && desafios.length === 0 && <p className="empty">Nenhum desafio cadastrado ainda.</p>}

      {desafios.map((d) => {
        const status = statusDesafio(d);
        const participantes = participantesDe(d);
        return (
          <div className="card" key={d.id}>
            <div className="row">
              <div onClick={() => abrirEdicao(d)} style={{ cursor: 'pointer', flex: 1 }}>
                <div className="name">{d.nome}</div>
                <div className="meta">
                  {TIPOS_DESAFIO[d.tipo]} · {formatarData(d.dataInicio)} a {formatarData(d.dataFim)} ·{' '}
                  <span className={`badge ${status === 'em andamento' ? 'pago' : status === 'agendado' ? 'pendente' : 'sem-cobranca'}`}>
                    {status}
                  </span>
                </div>
                {d.descricao && <div className="meta">{d.descricao}</div>}
              </div>
              <button className="btn-danger btn-small" onClick={() => excluir(d)}>Excluir</button>
            </div>

            <div className="meta" style={{ marginTop: 10, marginBottom: 6 }}>
              {d.concluidos.length}/{participantes.length} concluíram
              {!d.participantes?.length ? ' · vale para todos os alunos ativos' : ''}
            </div>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              {participantes.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={d.concluidos.includes(a.id) ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
                  onClick={() => toggleConcluido(d, a.id)}
                >
                  {d.concluidos.includes(a.id) ? '✓ ' : ''}{a.nome}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {modalAberto && (
        <div className="modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>{editando ? 'Editar desafio' : 'Novo desafio'}</h1>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={salvar}>
              <label>Nome *</label>
              <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: 30 dias sem açúcar" />

              <label>Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {Object.entries(TIPOS_DESAFIO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>

              <label>Descrição</label>
              <textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Regras do desafio" />

              <div className="row" style={{ gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label>Início *</label>
                  <input required type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Fim *</label>
                  <input required type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} />
                </div>
              </div>

              <label>Participantes (nenhum marcado = vale para todos os alunos ativos)</label>
              <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {alunos.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={form.participantes.includes(a.id) ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
                    onClick={() => toggleParticipante(a.id)}
                  >
                    {a.nome}
                  </button>
                ))}
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
