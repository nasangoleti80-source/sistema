import { useEffect, useRef, useState } from 'react';

export default function TimerDescanso({ segundos }) {
  const [restante, setRestante] = useState(segundos);
  const [ativo, setAtivo] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setRestante(segundos);
  }, [segundos]);

  useEffect(() => {
    if (!ativo) return;
    intervalRef.current = setInterval(() => {
      setRestante((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          setAtivo(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [ativo]);

  function iniciar() {
    setRestante(segundos);
    setAtivo(true);
  }

  const min = Math.floor(restante / 60);
  const seg = String(restante % 60).padStart(2, '0');

  return (
    <span className="row" style={{ gap: 6, justifyContent: 'flex-start' }}>
      <span style={{ fontWeight: 700, minWidth: 44, color: restante === 0 && ativo === false && restante !== segundos ? 'var(--red)' : 'inherit' }}>
        ⏱ {min}:{seg}
      </span>
      <button type="button" className="btn-secondary btn-small" onClick={iniciar} disabled={ativo}>
        {ativo ? '...' : 'Iniciar'}
      </button>
    </span>
  );
}
