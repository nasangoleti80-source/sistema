import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function MeuTreino() {
  const [treino, setTreino] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api
      .meuTreino()
      .then(setTreino)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div>
      <h1>Meu treino</h1>
      <p className="subtitle">Exercícios definidos pela sua treinadora</p>

      {erro && <div className="error-msg">{erro}</div>}
      {carregando && <p className="empty">Carregando...</p>}

      {!carregando && !treino && (
        <p className="empty">Seu treino ainda não foi cadastrado. Fale com a treinadora.</p>
      )}

      {treino && treino.exercicios.length === 0 && (
        <p className="empty">Nenhum exercício cadastrado ainda.</p>
      )}

      {treino && treino.exercicios.length > 0 && (
        <div className="card">
          {treino.exercicios.map((ex) => (
            <div className="list-item" key={ex.id} style={{ alignItems: 'flex-start' }}>
              <div>
                <div className="name">{ex.nome}</div>
                <div className="meta">
                  {[ex.series && `${ex.series} séries`, ex.repeticoes && `${ex.repeticoes} reps`, ex.carga && ex.carga]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
                {ex.observacao && <div className="meta" style={{ marginTop: 2 }}>{ex.observacao}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {treino?.observacoes && (
        <>
          <h2>Observações</h2>
          <div className="card">
            <p style={{ margin: 0, fontSize: 14 }}>{treino.observacoes}</p>
          </div>
        </>
      )}
    </div>
  );
}
