import { useState } from 'react';
import { api, INTENSIDADES_TREINO } from '../api.js';

// Registra o treino que o aluno/personal acabou de executar numa sessão
// específica (dia A, B, C...). Pede a carga usada em cada série.
export default function ModalRegistroTreino({ treino, dia, alunoId, onClose, onSalvo }) {
  const [duracaoMin, setDuracaoMin] = useState(treino.configuracao?.duracaoSessaoMin || 60);
  const [intensidadePercebida, setIntensidade] = useState('moderada');
  const [cansaco, setCansaco] = useState(3);
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [cargas, setCargas] = useState({});

  function setSerie(exNome, idx, campo, valor) {
    setCargas((c) => {
      const series = c[exNome] ? [...c[exNome]] : [];
      series[idx] = { ...(series[idx] || {}), [campo]: valor };
      return { ...c, [exNome]: series };
    });
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const cargasArr = Object.entries(cargas).map(([exercicioNome, series]) => ({
        exercicioNome,
        series: series.filter(Boolean).map((s) => ({ peso: Number(s.peso) || 0, repeticoes: Number(s.repeticoes) || 0 })),
      }));
      const registro = await api.registrarTreino({
        alunoId, treinoId: treino.id, diaLetra: dia.letra, duracaoMin: Number(duracaoMin),
        intensidadePercebida, cansaco, cargas: cargasArr, observacoes,
      });
      setResultado(registro);
      onSalvo();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h1>Treino presencial — {dia.letra} · {dia.nome}</h1>
        {erro && <div className="error-msg">{erro}</div>}
        {resultado ? (
          <div>
            <div className="grid-stats">
              <div className="stat green"><div className="value">{resultado.volumeTotal}kg</div><div className="label">Volume total</div></div>
              <div className="stat"><div className="value">{resultado.caloriasGastas ?? '—'}</div><div className="label">Calorias estimadas</div></div>
            </div>
            <button className="btn-primary" onClick={onClose}>Fechar</button>
          </div>
        ) : (
          <form onSubmit={salvar}>
            {(dia.exercicios || []).map((ex, i) => (
              <div key={i} style={{ marginTop: 10 }}>
                <label>{ex.nome} ({ex.series}x{ex.repeticoes})</label>
                {Array.from({ length: ex.series || 1 }).map((_, s) => (
                  <div className="row" key={s} style={{ gap: 6 }}>
                    <input type="number" placeholder="kg" style={{ flex: 1 }}
                      onChange={(e) => setSerie(ex.nome, s, 'peso', e.target.value)} />
                    <input type="number" placeholder="reps" style={{ flex: 1 }}
                      onChange={(e) => setSerie(ex.nome, s, 'repeticoes', e.target.value)} />
                  </div>
                ))}
              </div>
            ))}

            <div className="row" style={{ gap: 10, marginTop: 10 }}>
              <div style={{ flex: 1 }}>
                <label>Duração (min)</label>
                <input type="number" value={duracaoMin} onChange={(e) => setDuracaoMin(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label>Intensidade percebida</label>
                <select value={intensidadePercebida} onChange={(e) => setIntensidade(e.target.value)}>
                  {Object.entries(INTENSIDADES_TREINO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>

            <label>Nível de cansaço (1 a 5)</label>
            <input type="range" min="1" max="5" value={cansaco} onChange={(e) => setCansaco(Number(e.target.value))} />
            <div className="meta">Cansaço: {cansaco}/5</div>

            <label>Observações</label>
            <textarea rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
              <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
