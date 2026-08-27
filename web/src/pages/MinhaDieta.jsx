import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function MinhaDieta() {
  const [dieta, setDieta] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [abertas, setAbertas] = useState({});

  useEffect(() => {
    api
      .minhaDieta()
      .then(setDieta)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  function alternar(id) {
    setAbertas((a) => ({ ...a, [id]: !a[id] }));
  }

  return (
    <div>
      <h1>Minha dieta</h1>
      <p className="subtitle">Plano alimentar da sua treinadora</p>

      {erro && <div className="error-msg">{erro}</div>}
      {carregando && <p className="empty">Carregando...</p>}

      {!carregando && !dieta && <p className="empty">Sua dieta ainda não foi cadastrada. Fale com a treinadora.</p>}

      {dieta?.orientacoes && (
        <div className="card">
          <div className="name" style={{ marginBottom: 4 }}>Orientações</div>
          <p style={{ margin: 0, fontSize: 14 }}>{dieta.orientacoes}</p>
        </div>
      )}

      {dieta?.refeicoes.map((r) => (
        <div className="card" key={r.id}>
          <div className="row">
            <div className="name">{r.nome}{r.horario && ` · ${r.horario}`}</div>
            {r.substituicoes.length > 0 && (
              <button className="btn-secondary btn-small" onClick={() => alternar(r.id)}>
                {abertas[r.id] ? 'Fechar' : 'Substituir'}
              </button>
            )}
          </div>

          {r.itens.map((item) => (
            <div className="list-item" key={item.id}>
              <span>{item.alimento}</span>
              <span className="meta">{item.quantidade}</span>
            </div>
          ))}

          {abertas[r.id] && (
            <>
              <div className="meta" style={{ marginTop: 10, marginBottom: 4 }}>Opções equivalentes:</div>
              {r.substituicoes.map((item) => (
                <div className="list-item" key={item.id}>
                  <span>{item.alimento}</span>
                  <span className="meta">{item.quantidade}</span>
                </div>
              ))}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
