import { useState } from 'react';
import { acharNoCatalogo, capaDoExercicio, METODOS_TREINO } from '../api.js';

/**
 * Um exercício dentro de um treino, enriquecido com o catálogo.
 *
 * No treino o exercício é guardado só pelo nome — venha ele da IA ou digitado à
 * mão. Aqui esse nome é casado com o catálogo (sem acento, sem caixa) para
 * puxar a foto do aparelho, o vídeo e a dica de onde ele fica na academia.
 * Sem esse casamento a aluna vê apenas "Supino reto · 3x12", que é justamente
 * o que não resolve o medo de chegar na academia.
 *
 * Quando o nome não existe no catálogo, cai no básico e não quebra nada.
 */
export default function ExercicioDoTreino({ ex, indice, ordem }) {
  const [aberto, setAberto] = useState(false);
  const doCatalogo = acharNoCatalogo(indice, ex.nome);
  const capa = capaDoExercicio(doCatalogo);
  const video = doCatalogo?.midia?.find((m) => m.tipo === 'video');
  const link = ex.videoUrl || doCatalogo?.videoUrl;
  const temDetalhe = Boolean(video || doCatalogo?.ondeFica || doCatalogo?.descricao || link);

  return (
    <div className="ex-treino">
      <div className="row" style={{ alignItems: 'flex-start' }}>
        {ordem !== undefined && <span className="ex-ordem num">{ordem}</span>}

        <span className="miniatura" style={{ width: 46, height: 46 }}>
          {capa ? <img src={capa} alt="" loading="lazy" /> : <span className="miniatura-vazia">sem foto</span>}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* O catálogo manda no nome: no treino ele pode vir em caixa alta ou
              com o espaçamento torto, da IA ou da digitação. */}
          <div className="name">{doCatalogo?.nome || ex.nome}</div>
          <div className="meta">
            <span className="num">
              {ex.series}×{ex.repeticoes}
            </span>
            {ex.descansoSeg ? (
              <>
                {' · descanso '}
                <span className="num">{ex.descansoSeg}s</span>
              </>
            ) : null}
            {ex.metodo && ex.metodo !== 'convencional' && ` · ${METODOS_TREINO[ex.metodo] || ex.metodo}`}
            {ex.cargaAlvoKg ? (
              <>
                {' · alvo '}
                <span className="num">{ex.cargaAlvoKg} kg</span>
              </>
            ) : null}
          </div>

          {/* A informação que mais importa para quem está começando. */}
          {doCatalogo?.ondeFica && <div className="onde-fica">Onde fica: {doCatalogo.ondeFica}</div>}

          {ex.observacao && <div className="meta">{ex.observacao}</div>}
        </div>

        {temDetalhe && (
          <button
            type="button"
            className="btn-secondary btn-small"
            aria-expanded={aberto}
            onClick={() => setAberto(!aberto)}
          >
            {aberto ? 'Fechar' : video ? 'Ver vídeo' : 'Ver mais'}
          </button>
        )}
      </div>

      {aberto && (
        <div className="ex-detalhe">
          {video && (
            <video
              src={`/midia/${video.arquivo}`}
              poster={video.capa ? `/midia/${video.capa}` : undefined}
              controls
              playsInline
              preload="none"
            />
          )}
          {doCatalogo?.descricao && <p className="ex-como">{doCatalogo.descricao}</p>}
          {link && (
            <a className="ex-link" href={link} target="_blank" rel="noreferrer">
              Abrir vídeo externo
            </a>
          )}
        </div>
      )}
    </div>
  );
}
