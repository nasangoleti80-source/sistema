import { useEffect, useState } from 'react';
import { api, mesAtual, formatarMesLabel as formatarMes, somarMes, STATUS_AULA } from '../api.js';

function formatarData(dataStr) {
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}`;
}

const BADGE_STATUS = { presente: 'pago', falta: 'atrasado', reposicao: 'pendente' };
const PROXIMO_STATUS = { presente: 'falta', falta: 'reposicao', reposicao: 'presente' };
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const FORM_VAZIO = {
  alunoId: '',
  data: new Date().toISOString().slice(0, 10),
  tipo: 'presencial',
  status: 'presente',
  observacao: '',
};

function gerarGradeMes(mes) {
  const [ano, m] = mes.split('-').map(Number);
  const primeiroDiaSemana = new Date(ano, m - 1, 1).getDay();
  const totalDias = new Date(ano, m, 0).getDate();
  const celulas = [];
  for (let i = 0; i < primeiroDiaSemana; i++) celulas.push(null);
  for (let d = 1; d <= totalDias; d++) {
    celulas.push(`${ano}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (celulas.length % 7 !== 0) celulas.push(null);
  return celulas;
}

export default function Presenca() {
  const [mes, setMes] = useState(mesAtual());
  const [alunos, setAlunos] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState('');
  const [visualizacao, setVisualizacao] = useState('lista');
  const [diaSelecionado, setDiaSelecionado] = useState(null);

  async function carregar() {
    setCarregando(true);
    try {
      const [listaAlunos, listaAulas] = await Promise.all([
        api.listarAlunos('true'),
        api.listarAulas({ mes }),
      ]);
      setAlunos(listaAlunos);
      setAulas(listaAulas);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    setDiaSelecionado(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes]);

  function abrirNovo(alunoId, data) {
    setForm({ ...FORM_VAZIO, alunoId: alunoId || alunos[0]?.id || '', data: data || FORM_VAZIO.data });
    setErro('');
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      await api.registrarAula(form);
      setModalAberto(false);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function avancarStatus(aula) {
    await api.atualizarAula(aula.id, { status: PROXIMO_STATUS[aula.status] || 'presente' });
    await carregar();
  }

  async function excluir(aula) {
    if (!confirm('Remover este registro de aula?')) return;
    await api.removerAula(aula.id);
    await carregar();
  }

  function nomeAluno(id) {
    return alunos.find((a) => a.id === id)?.nome || '(aluno removido)';
  }

  return (
    <div>
      <h1>Presença</h1>
      <p className="subtitle">Registre as aulas dadas para saber quem treinou no mês</p>

      <div className="month-nav">
        <button onClick={() => setMes(somarMes(mes, -1))}>‹</button>
        <span className="month-label">{formatarMes(mes)}</span>
        <button onClick={() => setMes(somarMes(mes, 1))}>›</button>
      </div>

      <div className="view-toggle">
        <button
          className={visualizacao === 'lista' ? 'active' : ''}
          onClick={() => setVisualizacao('lista')}
        >
          Lista
        </button>
        <button
          className={visualizacao === 'calendario' ? 'active' : ''}
          onClick={() => setVisualizacao('calendario')}
        >
          Calendário
        </button>
      </div>

      {erro && <div className="error-msg">{erro}</div>}
      {carregando && <p className="empty">Carregando...</p>}

      {!carregando && alunos.length === 0 && (
        <p className="empty">Cadastre alunos primeiro na aba "Alunos".</p>
      )}

      {!carregando && alunos.length > 0 && visualizacao === 'lista' && (
        <div className="card">
          {alunos.map((aluno) => {
            const doAluno = aulas.filter((a) => a.alunoId === aluno.id);
            const realizadas = doAluno.filter((a) => a.status === 'presente' || a.status === 'reposicao').length;
            return (
              <div className="list-item" key={aluno.id}>
                <div>
                  <div className="name">{aluno.nome}</div>
                  <div className="meta">{realizadas} aula(s) realizada(s) neste mês</div>
                </div>
                <button className="btn-primary btn-small" onClick={() => abrirNovo(aluno.id)}>+ Aula</button>
              </div>
            );
          })}
        </div>
      )}

      {!carregando && aulas.length > 0 && visualizacao === 'lista' && (
        <>
          <h2>Histórico do mês</h2>
          <p className="subtitle">Toque numa aula pra alternar entre presente, falta e reposição.</p>
          <div className="card">
            {aulas.map((aula) => (
              <div className="list-item" key={aula.id}>
                <div onClick={() => avancarStatus(aula)} style={{ cursor: 'pointer', flex: 1 }}>
                  <div className="name">{formatarData(aula.data)} · {nomeAluno(aula.alunoId)}</div>
                  <div className="meta">
                    {aula.tipo === 'presencial' ? 'Aula presencial' : 'Ajuste de consultoria'}
                    {' · '}
                    <span className={`badge ${BADGE_STATUS[aula.status] || 'pago'}`}>
                      {STATUS_AULA[aula.status] || STATUS_AULA.presente}
                    </span>
                    {aula.status === 'falta' && aula.observacao && ` · ${aula.observacao}`}
                  </div>
                </div>
                <button className="btn-secondary btn-small" onClick={() => excluir(aula)}>Remover</button>
              </div>
            ))}
          </div>
        </>
      )}

      {!carregando && visualizacao === 'calendario' && (
        <>
          <div className="cal-legenda">
            <span><span className="cal-dot presente" /> Presente</span>
            <span><span className="cal-dot falta" /> Falta</span>
            <span><span className="cal-dot reposicao" /> Reposição</span>
          </div>

          <div className="cal-head">
            {DIAS_SEMANA.map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="cal-grid">
            {gerarGradeMes(mes).map((data, i) => {
              if (!data) return <div key={`vazia-${i}`} className="cal-cell vazia" />;
              const doDia = aulas.filter((a) => a.data === data);
              const hoje = data === new Date().toISOString().slice(0, 10);
              const dia = Number(data.slice(8, 10));
              return (
                <div
                  key={data}
                  className={`cal-cell${hoje ? ' hoje' : ''}${diaSelecionado === data ? ' selecionada' : ''}`}
                  onClick={() => setDiaSelecionado(data === diaSelecionado ? null : data)}
                >
                  <div className="cal-day-num">{dia}</div>
                  <div className="cal-dots">
                    {doDia.slice(0, 6).map((a) => (
                      <span key={a.id} className={`cal-dot ${a.status}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {diaSelecionado && (
            <>
              <h2>{formatarData(diaSelecionado)}</h2>
              <div className="card">
                {aulas.filter((a) => a.data === diaSelecionado).length === 0 && (
                  <p className="empty">Nenhuma aula registrada nesse dia.</p>
                )}
                {aulas.filter((a) => a.data === diaSelecionado).map((aula) => (
                  <div className="list-item" key={aula.id}>
                    <div onClick={() => avancarStatus(aula)} style={{ cursor: 'pointer', flex: 1 }}>
                      <div className="name">{nomeAluno(aula.alunoId)}</div>
                      <div className="meta">
                        {aula.tipo === 'presencial' ? 'Aula presencial' : 'Ajuste de consultoria'}
                        {' · '}
                        <span className={`badge ${BADGE_STATUS[aula.status] || 'pago'}`}>
                          {STATUS_AULA[aula.status] || STATUS_AULA.presente}
                        </span>
                        {aula.status === 'falta' && aula.observacao && ` · ${aula.observacao}`}
                      </div>
                    </div>
                    <button className="btn-secondary btn-small" onClick={() => excluir(aula)}>Remover</button>
                  </div>
                ))}
                <button
                  className="btn-primary btn-small"
                  style={{ marginTop: 10 }}
                  onClick={() => abrirNovo(null, diaSelecionado)}
                >
                  + Aula nesse dia
                </button>
              </div>
            </>
          )}
        </>
      )}

      {modalAberto && (
        <div className="modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>Registrar aula</h1>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={salvar}>
              <label>Aluno</label>
              <select value={form.alunoId} onChange={(e) => setForm({ ...form, alunoId: e.target.value })}>
                {alunos.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>

              <label>Data</label>
              <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />

              <label>Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="presencial">Aula presencial</option>
                <option value="consultoria_ajuste">Ajuste de consultoria (vídeo/whats)</option>
              </select>

              <label>Situação</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(STATUS_AULA).map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>

              <label>{form.status === 'falta' ? 'Motivo da falta' : 'Observação'}</label>
              <textarea
                rows={2}
                value={form.observacao}
                onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                placeholder={form.status === 'falta' ? 'O que o aluno relatou (dor, viagem, imprevisto...)' : 'Correções feitas, evolução, etc.'}
              />

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
