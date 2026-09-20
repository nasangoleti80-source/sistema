import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, formatarData } from '../api.js';

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Gera as datas de início até fim, de tantos em tantos dias, incluindo as duas pontas. */
function gerarDatas(inicio, fim, intervaloDias) {
  const datas = [];
  const cursor = new Date(`${inicio}T00:00:00`);
  const limite = new Date(`${fim}T00:00:00`);
  while (cursor <= limite) {
    datas.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + intervaloDias);
  }
  return datas;
}

export default function Chamadas() {
  const { alunoId } = useParams();
  const [aluno, setAluno] = useState(null);
  const [pacotes, setPacotes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [mostrarGerar, setMostrarGerar] = useState(false);
  const [form, setForm] = useState({ dataInicio: hojeISO(), dataFim: '', intervalo: '30' });

  async function carregar() {
    setCarregando(true);
    try {
      const [a, pcts] = await Promise.all([api.obterAluno(alunoId), api.listarPacotes(alunoId)]);
      setAluno(a);
      setPacotes(pcts);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, [alunoId]);

  function abrirGerar() {
    const ultimoPacote = [...pacotes].sort((a, b) => (a.dataVencimento < b.dataVencimento ? 1 : -1))[0];
    setForm({ dataInicio: ultimoPacote?.dataInicio || hojeISO(), dataFim: ultimoPacote?.dataVencimento || '', intervalo: '30' });
    setMostrarGerar(true);
  }

  async function gerar(e) {
    e.preventDefault();
    if (!form.dataInicio || !form.dataFim) return;
    const cronogramaAtual = aluno.cronogramaChamadas || [];
    if (cronogramaAtual.length > 0 && !confirm('Isso substitui o calendário de chamadas atual. Continuar?')) return;
    const datas = gerarDatas(form.dataInicio, form.dataFim, Number(form.intervalo));
    const cronogramaChamadas = datas.map((data) => ({ id: crypto.randomUUID(), data, feito: false }));
    const atualizado = await api.atualizarAluno(alunoId, { cronogramaChamadas });
    setAluno(atualizado);
    setMostrarGerar(false);
  }

  async function alternar(item) {
    const cronogramaChamadas = (aluno.cronogramaChamadas || []).map((c) =>
      c.id === item.id ? { ...c, feito: !c.feito } : c
    );
    const atualizado = await api.atualizarAluno(alunoId, { cronogramaChamadas });
    setAluno(atualizado);
  }

  if (carregando) return <p className="empty">Carregando...</p>;
  if (!aluno) return <p className="empty">Aluno não encontrado.</p>;

  const cronograma = aluno.cronogramaChamadas || [];
  const feitas = cronograma.filter((c) => c.feito).length;
  const proximaPendente = cronograma.filter((c) => !c.feito).sort((a, b) => (a.data < b.data ? -1 : 1))[0];

  return (
    <div>
      <Link to="/chamadas">&larr; Voltar para Chamadas</Link>
      <h1>Chamadas — {aluno.nome}</h1>
      <p className="subtitle">Ligação/vídeo mensal de acompanhamento.</p>
      {erro && <div className="error-msg">{erro}</div>}

      <div className="card">
        <div className="row">
          <h2 style={{ margin: 0 }}>Calendário de chamadas</h2>
          <button type="button" className="btn-secondary btn-small" onClick={abrirGerar}>
            {cronograma.length ? 'Gerar de novo' : 'Gerar chamadas'}
          </button>
        </div>

        {cronograma.length > 0 && (
          <p className="meta" style={{ marginTop: 8 }}>
            {feitas} de {cronograma.length} feitas · faltam {cronograma.length - feitas} · próxima:{' '}
            {proximaPendente ? formatarData(proximaPendente.data) : 'nenhuma pendente 🎉'}
          </p>
        )}
        {cronograma.length === 0 && !mostrarGerar && (
          <p className="empty">Nenhum calendário gerado ainda — clique em "Gerar chamadas".</p>
        )}
        {cronograma.length > 0 && (
          <div className="row" style={{ marginTop: 10, gap: 6, flexWrap: 'wrap' }}>
            {cronograma.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`checklist-item ${c.feito ? 'feito' : ''}`}
                onClick={() => alternar(c)}
              >
                {c.feito ? '☑' : '☐'} {formatarData(c.data)}
              </button>
            ))}
          </div>
        )}

        {mostrarGerar && (
          <form onSubmit={gerar} style={{ marginTop: 12 }}>
            <div className="row" style={{ gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label>Data de início</label>
                <input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label>Até (fim do pacote)</label>
                <input type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} />
              </div>
            </div>
            <label>A cada quantos dias</label>
            <select value={form.intervalo} onChange={(e) => setForm({ ...form, intervalo: e.target.value })}>
              <option value="30">30 dias</option>
              <option value="45">45 dias</option>
              <option value="60">60 dias</option>
            </select>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Gerar chamadas</button>
              <button type="button" className="btn-secondary" onClick={() => setMostrarGerar(false)}>Cancelar</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
