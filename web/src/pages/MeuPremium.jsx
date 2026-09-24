import { useEffect, useState } from 'react';
import { api, CATEGORIAS_VIDEO, getToken } from '../api.js';

function comToken(url) {
  return `${url}?token=${encodeURIComponent(getToken())}`;
}

export default function MeuPremium() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api
      .meuPremium()
      .then(setDados)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) return <p className="empty">Carregando...</p>;

  if (erro) return <div className="error-msg">{erro}</div>;

  if (!dados?.liberado) {
    return (
      <div>
        <h1>Área Premium</h1>
        <div className="card" style={{ textAlign: 'center', padding: '30px 16px' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
          <div className="name" style={{ marginBottom: 6 }}>Acesso ainda não liberado</div>
          <p className="meta">Fale com sua treinadora pra desbloquear vídeos de cardio, glúteos, técnica e desafios semanais.</p>
        </div>
      </div>
    );
  }

  const desafio = dados.videos.find((v) => v.categoria === 'desafio');
  const outros = dados.videos.filter((v) => v.categoria !== 'desafio');
  const porCategoria = {};
  for (const v of outros) {
    porCategoria[v.categoria] = porCategoria[v.categoria] || [];
    porCategoria[v.categoria].push(v);
  }

  return (
    <div>
      <h1>Área Premium</h1>
      <p className="subtitle">Vídeos exclusivos da sua treinadora</p>

      {desafio && (
        <>
          <h2>🏆 Desafio da semana</h2>
          <div className="card">
            <div className="name" style={{ marginBottom: 4 }}>{desafio.titulo}</div>
            {desafio.descricao && <p className="meta" style={{ marginBottom: 8 }}>{desafio.descricao}</p>}
            <video src={comToken(desafio.url)} controls style={{ width: '100%', borderRadius: 8 }} />
          </div>
        </>
      )}

      {Object.entries(porCategoria).map(([cat, videos]) => (
        <div key={cat}>
          <h2>{CATEGORIAS_VIDEO[cat] || cat}</h2>
          {videos.map((v) => (
            <div className="card" key={v.id}>
              <div className="name" style={{ marginBottom: 4 }}>{v.titulo}</div>
              {v.descricao && <p className="meta" style={{ marginBottom: 8 }}>{v.descricao}</p>}
              <video src={comToken(v.url)} controls style={{ width: '100%', borderRadius: 8 }} />
            </div>
          ))}
        </div>
      ))}

      {dados.videos.length === 0 && <p className="empty">Nenhum vídeo publicado ainda.</p>}
    </div>
  );
}
