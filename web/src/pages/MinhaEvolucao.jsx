import { useEffect, useState } from 'react';
import { api, getToken } from '../api.js';

function formatarData(dataStr) {
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

function comToken(url) {
  return `${url}?token=${encodeURIComponent(getToken())}`;
}

export default function MinhaEvolucao() {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api
      .minhaEvolucao()
      .then(setAvaliacoes)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  const antes = avaliacoes[0]?.fotos[0];
  const depois = avaliacoes.length > 1 ? avaliacoes[avaliacoes.length - 1].fotos[0] : null;

  return (
    <div>
      <h1>Minha evolução</h1>
      <p className="subtitle">Fotos que sua treinadora compartilhou com você</p>

      {erro && <div className="error-msg">{erro}</div>}
      {carregando && <p className="empty">Carregando...</p>}

      {!carregando && avaliacoes.length === 0 && (
        <p className="empty">Nenhuma foto compartilhada ainda.</p>
      )}

      {antes && depois && (
        <>
          <h2>Antes e depois</h2>
          <div className="card">
            <div className="compare-row">
              <div>
                <div className="foto-item"><img src={comToken(antes.url)} alt="Antes" /></div>
                <div className="legenda">{formatarData(avaliacoes[0].data)}</div>
              </div>
              <div>
                <div className="foto-item"><img src={comToken(depois.url)} alt="Depois" /></div>
                <div className="legenda">{formatarData(avaliacoes[avaliacoes.length - 1].data)}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {avaliacoes.length > 0 && (
        <>
          <h2>Histórico de fotos</h2>
          {avaliacoes.map((av) => (
            <div className="card" key={av.id}>
              <div className="name" style={{ marginBottom: 6 }}>{formatarData(av.data)}</div>
              <div className="foto-grid">
                {av.fotos.map((foto) => (
                  <div className="foto-item" key={foto.id}>
                    <img src={comToken(foto.url)} alt={foto.tipo} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
