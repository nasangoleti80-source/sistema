import { useEffect, useMemo, useState } from 'react';
import { api, mesAtual, formatarMesLabel as formatarMes, somarMes, TIPOS_AULA } from '../api.js';

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

export default function Presenca() {
  const [mes, setMes] = useState(mesAtual());
  const [alunos, setAlunos] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState(null); // { iso } — popover do dia
  const [form, setForm] = useState(FORM_VAZIO);

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

  async function alternarRealizada(aula) {
    await api.atualizarAula(aula.id, { realizada: !aula.realizada });
    await carregar();
  }

  async function excluir(aula) {
    if (!confirm('Remover este registro da agenda?')) return;
    await api.removerAula(aula.id);
    await carregar();
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

      {erro && <div className="error-msg">{erro}</div>}

      {!carregando && alunos.length === 0 && (
        <p className="empty">Cadastre um aluno na aba Alunos para começar a usar a agenda.</p>
      )}

      <div className="row" style={{ gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <span className="legenda-item"><span className="legenda-bola aula" /> Aula</span>
        <span className="legenda-item"><span className="legenda-bola consulta" /> Consulta</span>
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
                      className={`dia-chip ${!a.realizada ? 'falta' : a.tipo === 'consulta' ? 'consulta' : 'aula'}`}
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
                  <div className="list-item" key={aula.id}>
                    <div onClick={() => alternarRealizada(aula)} style={{ cursor: 'pointer', flex: 1 }}>
                      <div className="name">{nomeAluno(aula.alunoId)}</div>
                      <div className="meta">
                        {TIPOS_AULA[aula.tipo] || aula.tipo}
                        {' · '}
                        <span className={aula.realizada ? 'badge pago' : 'badge atrasado'}>
                          {aula.realizada ? 'Realizada' : 'Faltou'}
                        </span>
                      </div>
                      {aula.observacao && <div className="meta">{aula.observacao}</div>}
                    </div>
                    <button className="btn-secondary btn-small" onClick={() => excluir(aula)}>Remover</button>
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

              <label className="checkbox-row" style={{ marginTop: 14 }}>
                <input type="checkbox" checked={form.realizada} onChange={(e) => setForm({ ...form, realizada: e.target.checked })} />
                Vai acontecer normalmente (desmarque para já registrar falta)
              </label>

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
    </div>
  );
}
