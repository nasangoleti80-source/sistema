import { useEffect, useRef, useState } from 'react';

export default function TimerDescanso({ segundos }) {
  const [restante, setRestante] = useState(segundos);
  const [ativo, setAtivo] = useState(false);
  const [terminou, setTerminou] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setRestante(segundos);
    setTerminou(false);
  }, [segundos]);

  useEffect(() => {
    if (!ativo) return;
    intervalRef.current = setInterval(() => {
      setRestante((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          setAtivo(false);
          setTerminou(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [ativo]);

  function iniciar() {
    setRestante(segundos);
    setTerminou(false);
    setAtivo(true);
  }

  function ajustar(delta) {
    setRestante((r) => Math.max(0, r + delta));
    setTerminou(false);
  }

  function pular() {
    clearInterval(intervalRef.current);
    setAtivo(false);
    setTerminou(false);
    setRestante(0);
  }

  const min = Math.floor(restante / 60);
  const seg = String(restante % 60).padStart(2, '0');

  return (
    <div className="timer-descanso">
      <span className="row" style={{ gap: 6, justifyContent: 'flex-start' }}>
        <span style={{ fontWeight: 700, minWidth: 44, color: terminou ? 'var(--red)' : 'inherit' }}>
          ⏱ {min}:{seg}
        </span>
        {!ativo && (
          <button type="button" className="btn-secondary btn-small" onClick={iniciar}>
            {terminou || restante !== segundos ? 'Reiniciar' : 'Iniciar'}
          </button>
        )}
      </span>

      {ativo && (
        <span className="row" style={{ gap: 6, justifyContent: 'flex-start', marginTop: 6 }}>
          <button type="button" className="btn-secondary btn-small" onClick={() => ajustar(-15)}>-15s</button>
          <button type="button" className="btn-secondary btn-small" onClick={pular}>Pular</button>
          <button type="button" className="btn-secondary btn-small" onClick={() => ajustar(15)}>+15s</button>
        </span>
      )}
    </div>
  );
}
