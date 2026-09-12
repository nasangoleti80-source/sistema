import { useEffect, useMemo, useState } from 'react';
import { api, mesAtual, formatarMesLabel as formatarMes, somarMes, TIPOS_AULA, DIAS_SEMANA_SESSAO } from '../api.js';

const DIAS_CABECALHO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function pad(n) {
  return String(n).padStart(2, '0');
}

function paraISO(ano, mesIdx, dia) {
  return `${ano}-${pad(mesIdx + 1)}-${pad(dia)}`;
}

function hojeISO() {
  const h = new Date();
  return paraISO(h.getFullYear(), h.getMonth(), h.getDate());
}

function primeiroDiaMes(mesStr) {
  return `${mesStr}-01`;
}

function ultimoDiaMes(mesStr) {
  const [ano, mesNum] = mesStr.split('-').map(Number);
  const ultimo = new Date(ano, mesNum, 0).getDate();
  return `${mesStr}-${pad(ultimo)}`;
}

// Monta a grade do mês (linhas de 7 dias), incluindo os dias das pontas dos
// meses vizinhos para fechar a semana, como numa agenda de verdade.
function montarGrade(mesStr) {
  const [ano, mesNum] = mesStr.split('-').map(Number);
  const mesIdx = mesNum - 1;
  const primeiroDiaSemana = new Date(ano, mesIdx, 1).getDay();
  const totalDiasMes = new Date(ano, mesIdx + 1, 0).getDate();
  const diasMesAnterior = new Date(ano, mesIdx, 0).getDate();

  const celulas = [];
  for (let i = 0; i < primeiroDiaSemana; i++) {
    const dia = diasMesAnterior - primeiroDiaSemana + i + 1;
    const dataRef = new Date(ano, mesIdx - 1, dia);
    celulas.push({ dia, iso: paraISO(dataRef.getFullYear(), dataRef.getMonth(), dia), foraDoMes: true });
  }
  for (let dia = 1; dia <= totalDiasMes; dia++) {
    celulas.push({ dia, iso: paraISO(ano, mesIdx, dia), foraDoMes: false });
  }
  while (celulas.length % 7 !== 0) {
    const dia = celulas.length - (primeiroDiaSemana + totalDiasMes) + 1;
    const dataRef = new Date(ano, mesIdx + 1, dia);
    celulas.push({ dia, iso: paraISO(dataRef.getFullYear(), dataRef.getMonth(), dia), foraDoMes: true });
  }
  return celulas;
}

const FORM_VAZIO = {
  alunoId: '',
  data: hojeISO(),
  tipo: 'presencial',
  realizada: true,
  observacao: '',
};

function formProgramacaoVazio(mes) {
  return {
    alunoId: '',
    tipo: 'presencial',
    diasSemana: [],
    dataInicio: primeiroDiaMes(mes),
    dataFim: ultimoDiaMes(mes),
  };
}

export default function Presenca() {
  const [mes, setMes] = useState(mesAtual());
  const [alunos, setAlunos] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [modalProgramar, setModalProgramar] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState(null); // { iso } — popover do dia
  const [form, setForm] = useState(FORM_VAZIO);
  const [formProgramacao, setFormProgramacao] = useState(() => formProgramacaoVazio(mesAtual()));
  const [programando, setProgramando] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes]);

  const grade = useMemo(() => montarGrade(mes), [mes]);

  const aulasPorDia = useMemo(() => {
    const mapa = new Map();
    for (const a of aulas) {
      if (!mapa.has(a.data)) mapa.set(a.data, []);
      mapa.get(a.data).push(a);
    }
    return mapa;
  }, [aulas]);

  function nomeAluno(id) {
    return alunos.find((a) => a.id === id)?.nome || '(aluno removido)';
  }

  function abrirDia(iso) {
    setDiaSelecionado(iso);
  }

  function abrirNovoNoDia(iso) {
    setForm({ ...FORM_VAZIO, alunoId: alunos[0]?.id || '', data: iso });
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

  async function definirStatus(aula, realizada) {
    if (aula.realizada === realizada) return;
    await api.atualizarAula(aula.id, { realizada });
    await carregar();
  }

  async function excluir(aula) {
    if (!confirm('Remover este registro da agenda?')) return;
    await api.removerAula(aula.id);
    await carregar();
  }

  function abrirProgramar() {
    setFormProgramacao({ ...formProgramacaoVazio(mes), alunoId: alunos[0]?.id || '' });
    setErro('');
    setModalProgramar(true);
  }

  function alternarDiaProgramacao(chave) {
    setFormProgramacao((f) => {
      const diasSemana = f.diasSemana.includes(chave)
        ? f.diasSemana.filter((c) => c !== chave)
        : [...f.diasSemana, chave];
      return { ...f, diasSemana };
    });
  }

  async function programar(e) {
    e.preventDefault();
    if (formProgramacao.diasSemana.length === 0) {
      setErro('Escolha pelo menos um dia da semana.');
      return;
    }
    setErro('');
    setProgramando(true);
    try {
      const criadas = await api.programarAulas(formProgramacao);
      setModalProgramar(false);
      await carregar();
      alert(criadas.length > 0 ? `${criadas.length} aula(s) programada(s)!` : 'Nada novo para programar — todas as datas já tinham essa aula marcada.');
    } catch (e) {
      setErro(e.message);
    } finally {
      setProgramando(false);
    }
  }

  const diaAberto = diaSelecionado ? aulasPorDia.get(diaSelecionado) || [] : [];

  return (
    <div>
      <h1>
        Sua <em>agenda</em>
      </h1>
      <p className="subtitle">
        Toque num dia para ver ou marcar consultas, aulas e faltas — como numa agenda de verdade.
      </p>

      <div className="month-nav">
        <button onClick={() => setMes(somarMes(mes, -1))}>‹</button>
        <span className="month-label">{formatarMes(mes)}</span>
        <button onClick={() => setMes(somarMes(mes, 1))}>›</button>
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <button type="button" className="btn-secondary" style={{ marginLeft: 'auto' }} onClick={abrirProgramar} disabled={alunos.length === 0}>
          📅 Programar aulas
        </button>
      </div>

      {erro && <div className="error-msg">{erro}</div>}

      {!carregando && alunos.length === 0 && (
        <p className="empty">Cadastre um aluno na aba Alunos para começar a usar a agenda.</p>
      )}

      <div className="row" style={{ gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <span className="legenda-item"><span className="legenda-bola aula" /> Aula</span>
        <span className="legenda-item"><span className="legenda-bola consulta" /> Consulta</span>
        <span className="legenda-item"><span className="legenda-bola reposicao" /> Reposição</span>
        <span className="legenda-item"><span className="legenda-bola falta" /> Falta</span>
      </div>

      <div className="calendario">
        <div className="calendario-cabecalho">
          {DIAS_CABECALHO.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="calendario-grade">
          {grade.map((c) => {
            const doDia = aulasPorDia.get(c.iso) || [];
            const ehHoje = c.iso === hojeISO();
            return (
              <button
                type="button"
                key={c.iso + (c.foraDoMes ? '-fora' : '')}
                className={`dia-celula ${c.foraDoMes ? 'fora-mes' : ''} ${ehHoje ? 'hoje' : ''}`}
                onClick={() => abrirDia(c.iso)}
              >
                <span className="dia-numero">{c.dia}</span>
                <span className="dia-chips">
                  {doDia.slice(0, 3).map((a) => (
                    <span
                      key={a.id}
                      className={`dia-chip ${!a.realizada ? 'falta' : a.tipo === 'consulta' ? 'consulta' : a.tipo === 'reposicao' ? 'reposicao' : 'aula'}`}
                    >
                      {nomeAluno(a.alunoId)}
                    </span>
                  ))}
                  {doDia.length > 3 && <span className="dia-chip-extra">+{doDia.length - 3}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {diaSelecionado && (
        <div className="modal-backdrop" onClick={() => setDiaSelecionado(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>{diaSelecionado.split('-').reverse().join('/')}</h1>

            {diaAberto.length === 0 && <p className="empty">Nada marcado neste dia ainda.</p>}

            {diaAberto.length > 0 && (
              <div className="card">
                {diaAberto.map((aula) => (
                  <div className="item-agenda" key={aula.id}>
                    <div className="row">
                      <div>
                        <div className="name">{nomeAluno(aula.alunoId)}</div>
                        <div className="meta">{TIPOS_AULA[aula.tipo] || aula.tipo}</div>
                      </div>
                      <button className="btn-secondary btn-small" onClick={() => excluir(aula)}>Remover</button>
                    </div>
                    {aula.observacao && <div className="meta" style={{ marginTop: 4 }}>{aula.observacao}</div>}
                    <div className="row" style={{ gap: 6, marginTop: 8 }}>
                      <button
                        type="button"
                        className={`btn-status-agenda ${aula.realizada ? 'ativo-ok' : ''}`}
                        onClick={() => definirStatus(aula, true)}
                      >
                        ✅ Concluído
                      </button>
                      <button
                        type="button"
                        className={`btn-status-agenda ${!aula.realizada ? 'ativo-falta' : ''}`}
                        onClick={() => definirStatus(aula, false)}
                      >
                        ❌ Faltou
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn-primary"
                disabled={alunos.length === 0}
                onClick={() => {
                  const iso = diaSelecionado;
                  setDiaSelecionado(null);
                  abrirNovoNoDia(iso);
                }}
              >
                + Marcar neste dia
              </button>
              <button type="button" className="btn-secondary" onClick={() => setDiaSelecionado(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {modalAberto && (
        <div className="modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>Marcar na agenda</h1>
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
                {Object.entries(TIPOS_AULA).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>

              <label>Status</label>
              <div className="row" style={{ gap: 6 }}>
                <button
                  type="button"
                  className={`btn-status-agenda ${form.realizada ? 'ativo-ok' : ''}`}
                  onClick={() => setForm({ ...form, realizada: true })}
                >
                  ✅ Concluído
                </button>
                <button
                  type="button"
                  className={`btn-status-agenda ${!form.realizada ? 'ativo-falta' : ''}`}
                  onClick={() => setForm({ ...form, realizada: false })}
                >
                  ❌ Faltou
                </button>
              </div>
              <p className="dica">Marcando um dia futuro, deixe em "Concluído" — é só o que aparece agendado.</p>

              <label>Observação</label>
              <textarea rows={2} value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} placeholder="Correções feitas, evolução, etc." />

              <div className="form-actions">
                <button type="submit" className="btn-primary">Salvar</button>
                <button type="button" className="btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalProgramar && (
        <div className="modal-backdrop" onClick={() => !programando && setModalProgramar(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>Programar aulas</h1>
            <p className="subtitle">
              Escolha os dias da semana e o período — a agenda já nasce com todas as aulas daquele padrão.
            </p>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={programar}>
              <label>Aluno</label>
              <select value={formProgramacao.alunoId} onChange={(e) => setFormProgramacao({ ...formProgramacao, alunoId: e.target.value })}>
                {alunos.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>

              <label>Tipo</label>
              <select value={formProgramacao.tipo} onChange={(e) => setFormProgramacao({ ...formProgramacao, tipo: e.target.value })}>
                {Object.entries(TIPOS_AULA).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>

              <label>Dias da semana</label>
              <div className="row" style={{ marginBottom: 10, justifyContent: 'flex-start', gap: 0 }}>
                {DIAS_SEMANA_SESSAO.map((d) => (
                  <button
                    type="button"
                    key={d.chave}
                    className={`dia-semana-circulo ${formProgramacao.diasSemana.includes(d.chave) ? 'ativo' : ''}`}
                    onClick={() => alternarDiaProgramacao(d.chave)}
                  >
                    {d.letra}
                  </button>
                ))}
              </div>

              <div className="row" style={{ gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label>De</label>
                  <input type="date" value={formProgramacao.dataInicio} onChange={(e) => setFormProgramacao({ ...formProgramacao, dataInicio: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Até</label>
                  <input type="date" value={formProgramacao.dataFim} onChange={(e) => setFormProgramacao({ ...formProgramacao, dataFim: e.target.value })} />
                </div>
              </div>
              <p className="dica">Já vem preenchido com o mês inteiro que está aberto no calendário — mas dá para ajustar o período.</p>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={programando}>{programando ? 'Programando...' : 'Programar'}</button>
                <button type="button" className="btn-secondary" onClick={() => setModalProgramar(false)} disabled={programando}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
