import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, formatarData, formatarMoeda, INTENSIDADES_TREINO } from '../api.js';

export default function Portal() {
  const { alunoId } = useParams();
  const [aluno, setAluno] = useState(null);
  const [treinos, setTreinos] = useState([]);
  const [endurance, setEndurance] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [pacotes, setPacotes] = useState([]);
  const [dietas, setDietas] = useState([]);
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [aba, setAba] = useState('treino');
  const [erro, setErro] = useState('');
  const fimRef = useRef(null);

  async function carregarTudo() {
    try {
      const [a, t, e, av, p, d, m] = await Promise.all([
        api.obterAluno(alunoId),
        api.listarTreinos(alunoId),
        api.listarEndurance(alunoId),
        api.listarAvaliacoes(alunoId),
        api.listarPacotes(alunoId),
        api.listarDietas(alunoId),
        api.listarMensagens(alunoId),
      ]);
      setAluno(a);
      setTreinos(t.filter((tr) => tr.ativo));
      setEndurance(e.filter((pl) => pl.ativo));
      setAvaliacoes(av);
      setPacotes(p);
      setDietas(d.filter((dt) => dt.ativa));
      setMensagens(m);
    } catch (e) {
      setErro(e.message);
    }
  }

  useEffect(() => { carregarTudo(); }, [alunoId]);
  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensagens]);

  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    await api.enviarMensagem({ alunoId, remetente: 'aluno', texto });
    setTexto('');
    const m = await api.listarMensagens(alunoId);
    setMensagens(m);
  }

  async function registrarRapido(treino, diaLetra) {
    const duracaoMin = prompt('Quanto tempo durou o treino (minutos)?', String(treino.configuracao?.duracaoSessaoMin || 60));
    if (!duracaoMin) return;
    const intensidade = prompt('Intensidade percebida (leve, moderada, intensa, muito_intensa)?', 'moderada');
    try {
      const registro = await api.registrarTreino({
        alunoId, treinoId: treino.id, diaLetra, duracaoMin: Number(duracaoMin),
        intensidadePercebida: intensidade, cansaco: 3, cargas: [],
      });
      alert(`Treino registrado! Calorias estimadas: ${registro.caloriasGastas ?? '—'}`);
    } catch (e) {
      alert(e.message);
    }
  }

  if (erro) return <p className="empty">{erro}</p>;
  if (!aluno) return <p className="empty">Carregando...</p>;

  const proximoPacote = pacotes.sort((a, b) => (a.dataVencimento < b.dataVencimento ? -1 : 1))[0];
  const ultimaAvaliacao = avaliacoes[0];

  return (
    <div>
      <h1>Olá, {aluno.nome.split(' ')[0]} 👋</h1>
      <p className="subtitle">Seu espaço de acompanhamento</p>

      {proximoPacote && (
        <div className="card">
          <div className="row">
            <div className="name">Plano: {proximoPacote.nomePacote}</div>
            <span className={`badge ${proximoPacote.status}`}>{proximoPacote.status}</span>
          </div>
          <div className="meta">Válido até {formatarData(proximoPacote.dataFim)} · Vencimento: {formatarData(proximoPacote.dataVencimento)}</div>
        </div>
      )}

      <div className="row" style={{ gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {['treino', 'endurance', 'evolucao', 'dieta', 'mensagens'].map((a) => (
          <button key={a} className={aba === a ? 'btn-primary btn-small' : 'btn-secondary btn-small'} onClick={() => setAba(a)}>
            {{ treino: 'Treino', endurance: 'Endurance', evolucao: 'Evolução', dieta: 'Dieta', mensagens: 'Mensagens' }[a]}
          </button>
        ))}
      </div>

      {aba === 'treino' && (
        <>
          {treinos.length === 0 && <p className="empty">Nenhum treino ativo no momento.</p>}
          {treinos.map((t) => (
            <div className="card" key={t.id}>
              <div className="name">{t.nome}</div>
              {(t.dias || []).map((dia, i) => (
                <div key={i} className="card" style={{ background: 'var(--bg)' }}>
                  <div className="row">
                    <div className="name">Treino {dia.letra} — {dia.nome}</div>
                    <button className="btn-secondary btn-small" onClick={() => registrarRapido(t, dia.letra)}>Marcar como feito</button>
                  </div>
                  {(dia.exercicios || []).map((ex, j) => (
                    <div key={j} className="list-item">
                      <div>
                        <div className="name">{ex.nome}</div>
                        <div className="meta">{ex.series}x{ex.repeticoes} · descanso {ex.descansoSeg}s {ex.metodo && ex.metodo !== 'convencional' ? `· ${ex.metodo}` : ''}</div>
                      </div>
                      {ex.videoUrl && <a href={ex.videoUrl} target="_blank" rel="noreferrer">🎥 vídeo</a>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {aba === 'endurance' && (
        <>
          {endurance.length === 0 && <p className="empty">Nenhum plano de endurance ativo.</p>}
          {endurance.map((p) => (
            <div className="card" key={p.id}>
              <div className="name">{p.nome}</div>
              {(p.semanas || []).map((s, i) => (
                <div key={i} className="meta" style={{ marginBottom: 6 }}>
                  <strong>Semana {s.numero}</strong> — {(s.sessoes || []).map((ss) => `${ss.dia}: ${ss.tipo}`).join(', ')}
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {aba === 'evolucao' && (
        <>
          {ultimaAvaliacao && (
            <div className="grid-stats">
              <div className="stat"><div className="value">{ultimaAvaliacao.calculado?.imc}</div><div className="label">IMC</div></div>
              <div className="stat green"><div className="value">{ultimaAvaliacao.calculado?.percentualGordura}%</div><div className="label">Gordura</div></div>
              <div className="stat"><div className="value">{ultimaAvaliacao.pesoKg}kg</div><div className="label">Peso atual</div></div>
              <div className="stat green"><div className="value">{ultimaAvaliacao.calculado?.massaMagraKg}kg</div><div className="label">Massa magra</div></div>
            </div>
          )}
          {avaliacoes.map((a) => (
            <div className="card" key={a.id}>
              <div className="name">{formatarData(a.data)}</div>
              {a.fotos?.length > 0 && (
                <div className="row" style={{ gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {a.fotos.map((f, i) => <img key={i} src={f.url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />)}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {aba === 'dieta' && (
        <>
          {dietas.length === 0 && <p className="empty">Nenhuma dieta ativa.</p>}
          {dietas.map((d) => (
            <div className="card" key={d.id}>
              <div className="name">{d.nome}</div>
              {(d.refeicoes || []).map((r, i) => (
                <div key={i} className="list-item">
                  <div><div className="name">{r.nome} {r.horario && `· ${r.horario}`}</div><div className="meta">{r.alimentos}</div></div>
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {aba === 'mensagens' && (
        <>
          <div className="card" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
            {mensagens.map((m) => (
              <div key={m.id} style={{ textAlign: m.remetente === 'aluno' ? 'right' : 'left', marginBottom: 8 }}>
                <span style={{
                  display: 'inline-block', padding: '8px 12px', borderRadius: 12, maxWidth: '80%',
                  background: m.remetente === 'aluno' ? 'var(--green)' : '#eef2f0',
                  color: m.remetente === 'aluno' ? 'white' : 'var(--text)',
                }}>{m.texto}</span>
              </div>
            ))}
            <div ref={fimRef} />
          </div>
          <form onSubmit={enviar} className="row" style={{ marginTop: 10, gap: 8 }}>
            <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva uma mensagem..." />
            <button className="btn-primary" type="submit">Enviar</button>
          </form>
        </>
      )}
    </div>
  );
}
