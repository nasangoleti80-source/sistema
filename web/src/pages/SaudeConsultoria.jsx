import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatarData, mesAtual } from '../api.js';

/**
 * Saúde da consultoria — ranking de atenção de quem é acompanhado à
 * distância (online ou semipresencial): tempo sem treinar, vencimento do
 * pacote, próxima avaliação e o checklist de acompanhamento da treinadora.
 */
export default function SaudeConsultoria() {
  const [alunos, setAlunos] = useState(null);
  const [pacotes, setPacotes] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [erro, setErro] = useState('');
  const [tipoConsultoria, setTipoConsultoria] = useState('online');
  const [editandoAvaliacao, setEditandoAvaliacao] = useState(null);

  useEffect(() => {
    Promise.all([
      api.listarAlunos(true),
      api.listarPacotes(),
      api.obterDashboard(mesAtual()).catch(() => null),
    ])
      .then(([listaAlunos, listaPacotes, dash]) => {
        setAlunos(listaAlunos);
        setPacotes(listaPacotes);
        setDashboard(dash);
      })
      .catch((e) => setErro(e.message));
  }, []);

  const ehOnline = (tipo) => tipo?.startsWith('consultoria_online');
  const ehSemipresencial = (tipo) => tipo === 'consultoria_semipresencial';
  const hojeISO = new Date().toISOString().slice(0, 10);

  const todosConsultoria = alunos && dashboard ? alunos.filter((a) => ehOnline(a.tipo) || ehSemipresencial(a.tipo)) : [];
  const consultoriaComStatus = todosConsultoria
    .filter((a) => (tipoConsultoria === 'online' ? ehOnline(a.tipo) : ehSemipresencial(a.tipo)))
    .map((aluno) => {
      const status = dashboard.treinoStatusPorAluno.find((t) => t.alunoId === aluno.id);
      const ultimo = status?.ultimoTreinoData;
      const diasSemTreinar = ultimo ? Math.floor((Date.now() - new Date(ultimo)) / 86400000) : null;
      let grupo = 'engajado';
      if (diasSemTreinar == null) grupo = 'sem_inicio';
      else if (diasSemTreinar >= 14) grupo = 'abandono';
      else if (diasSemTreinar >= 7) grupo = 'em_risco';

      const pacote = pacotes
        .filter((p) => p.alunoId === aluno.id)
        .sort((a, b) => (a.dataVencimento < b.dataVencimento ? -1 : 1))
        .find((p) => p.status !== 'pago') || null;

      const diasProximaAvaliacao = aluno.proximaAvaliacaoData
        ? Math.round((new Date(aluno.proximaAvaliacaoData) - new Date(hojeISO)) / 86400000)
        : null;

      return { aluno, diasSemTreinar, grupo, pacote, diasProximaAvaliacao };
    })
    .sort((a, b) => (b.diasSemTreinar || 0) - (a.diasSemTreinar || 0));

  const contagemPorGrupo = {
    abandono: consultoriaComStatus.filter((c) => c.grupo === 'abandono').length,
    em_risco: consultoriaComStatus.filter((c) => c.grupo === 'em_risco').length,
    engajado: consultoriaComStatus.filter((c) => c.grupo === 'engajado').length,
    sem_inicio: consultoriaComStatus.filter((c) => c.grupo === 'sem_inicio').length,
  };

  async function salvarProximaAvaliacao(alunoId, novaData) {
    const atualizado = await api.atualizarAluno(alunoId, { proximaAvaliacaoData: novaData || null });
    setAlunos((prev) => prev.map((a) => (a.id === alunoId ? atualizado : a)));
    setEditandoAvaliacao(null);
  }

  async function toggleChecklist(aluno, chave) {
    const atualizado = await api.atualizarAluno(aluno.id, {
      checklistConsultoria: { ...aluno.checklistConsultoria, [chave]: !aluno.checklistConsultoria?.[chave] },
    });
    setAlunos((prev) => prev.map((a) => (a.id === aluno.id ? atualizado : a)));
  }

  return (
    <div>
      <h1>Saúde da consultoria</h1>
      <p className="subtitle">Ranking de atenção de quem é acompanhado à distância.</p>

      {erro && <div className="error-msg">{erro}</div>}
      {!alunos && !erro && <p className="empty">Carregando…</p>}

      {alunos && (
        <div className="card">
          <div className="row" style={{ gap: 6, marginBottom: 12 }}>
            <button
              type="button"
              className={tipoConsultoria === 'online' ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
              onClick={() => setTipoConsultoria('online')}
            >
              Online
            </button>
            <button
              type="button"
              className={tipoConsultoria === 'semipresencial' ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
              onClick={() => setTipoConsultoria('semipresencial')}
            >
              Semipresencial
            </button>
          </div>

          <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: consultoriaComStatus.length ? 14 : 0 }}>
            <span className="pilula-atencao critico">{contagemPorGrupo.abandono} abandono</span>
            <span className="pilula-atencao alerta">{contagemPorGrupo.em_risco} em risco</span>
            <span className="pilula-atencao neutro">{contagemPorGrupo.sem_inicio} sem início</span>
            <span className="pilula-atencao bom">{contagemPorGrupo.engajado} engajado</span>
          </div>

          {consultoriaComStatus.length === 0 && (
            <p className="empty">Nenhum aluno {tipoConsultoria === 'online' ? 'de consultoria online' : 'semipresencial'} ativo.</p>
          )}

          {consultoriaComStatus.map(({ aluno, diasSemTreinar, grupo, pacote, diasProximaAvaliacao }) => (
            <div className="card-aluno-consultoria" key={aluno.id}>
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <Link to={`/alunos/${aluno.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}>
                  <div className="name">{aluno.nome}</div>
                </Link>
                <span className={`badge ${{ abandono: 'atrasado', em_risco: 'pendente', engajado: 'pago', sem_inicio: 'sem-cobranca' }[grupo]}`}>
                  {{ abandono: 'Abandono', em_risco: 'Em risco', engajado: 'Engajado', sem_inicio: 'Sem início' }[grupo]}
                </span>
                <Link to={`/mensagens?alunoId=${aluno.id}`} className="btn-secondary btn-small link-botao">Chamar</Link>
              </div>

              <div className="meta" style={{ marginTop: 4 }}>
                {diasSemTreinar != null ? `${diasSemTreinar} dias sem treinar` : 'Nunca treinou'}
                {pacote && ` · pacote vence ${formatarData(pacote.dataVencimento)} (${pacote.status})`}
              </div>

              <div className="row" style={{ marginTop: 6, gap: 8, flexWrap: 'wrap' }}>
                <span className="meta">
                  Próxima avaliação:{' '}
                  {aluno.proximaAvaliacaoData
                    ? `${formatarData(aluno.proximaAvaliacaoData)} (${diasProximaAvaliacao < 0 ? `atrasada ${-diasProximaAvaliacao}d` : `faltam ${diasProximaAvaliacao}d`})`
                    : 'não agendada'}
                </span>
                {editandoAvaliacao === aluno.id ? (
                  <input
                    type="date"
                    autoFocus
                    defaultValue={aluno.proximaAvaliacaoData || ''}
                    onBlur={(e) => salvarProximaAvaliacao(aluno.id, e.target.value)}
                    style={{ padding: '2px 6px', fontSize: 12 }}
                  />
                ) : (
                  <button type="button" className="link-editar" onClick={() => setEditandoAvaliacao(aluno.id)}>editar</button>
                )}
              </div>

              <div className="row" style={{ marginTop: 8, gap: 6, flexWrap: 'wrap' }}>
                {[
                  ['cobreiReacao', 'Cobrei a reação'],
                  ['marqueiAvaliacao', 'Marquei avaliação'],
                  ['faleiRenovacao', 'Falei sobre renovação'],
                  ['ajusteiTreino', 'Ajustei treino/dieta'],
                ].map(([chave, rotulo]) => (
                  <button
                    key={chave}
                    type="button"
                    className={`checklist-item ${aluno.checklistConsultoria?.[chave] ? 'feito' : ''}`}
                    onClick={() => toggleChecklist(aluno, chave)}
                  >
                    {aluno.checklistConsultoria?.[chave] ? '☑' : '☐'} {rotulo}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
