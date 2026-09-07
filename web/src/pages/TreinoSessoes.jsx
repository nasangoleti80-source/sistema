import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api, DIAS_SEMANA_SESSAO } from '../api.js';
import ModalRegistroTreino from '../components/ModalRegistroTreino.jsx';

function proximaLetra(dias) {
  const usadas = new Set((dias || []).map((d) => d.letra));
  for (const letra of 'ABCDEFGH') {
    if (!usadas.has(letra)) return letra;
  }
  return `S${(dias || []).length + 1}`;
}

export default function TreinoSessoes() {
  const { treinoId } = useParams();
  const navigate = useNavigate();
  const [treino, setTreino] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [modalRegistro, setModalRegistro] = useState(null);

  async function carregar() {
    setCarregando(true);
    try {
      setTreino(await api.obterTreino(treinoId));
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, [treinoId]);

  async function salvarDias(novosDias) {
    const atualizado = await api.atualizarTreino(treinoId, { dias: novosDias });
    setTreino(atualizado);
  }

  function moverSessao(indice, direcao) {
    const dias = [...treino.dias];
    const alvo = indice + direcao;
    if (alvo < 0 || alvo >= dias.length) return;
    [dias[indice], dias[alvo]] = [dias[alvo], dias[indice]];
    salvarDias(dias);
  }

  function renomearSessao(indice) {
    const novoNome = prompt('Nome da sessão:', treino.dias[indice].nome);
    if (!novoNome || !novoNome.trim()) return;
    const dias = treino.dias.map((d, i) => (i === indice ? { ...d, nome: novoNome.trim() } : d));
    salvarDias(dias);
  }

  function duplicarSessao(indice) {
    const original = treino.dias[indice];
    const nova = { ...original, letra: proximaLetra(treino.dias), nome: `${original.nome} (cópia)` };
    salvarDias([...treino.dias, nova]);
  }

  function excluirSessao(indice) {
    if (!confirm(`Excluir a sessão "${treino.dias[indice].nome}"?`)) return;
    salvarDias(treino.dias.filter((_, i) => i !== indice));
  }

  function alternarDiaSemana(indice, chave) {
    const dias = treino.dias.map((d, i) => {
      if (i !== indice) return d;
      const diasSemana = d.diasSemana || [];
      const novo = diasSemana.includes(chave) ? diasSemana.filter((c) => c !== chave) : [...diasSemana, chave];
      return { ...d, diasSemana: novo };
    });
    salvarDias(dias);
  }

  function adicionarSessao() {
    const letra = proximaLetra(treino.dias);
    const nome = prompt('Nome da nova sessão:', `Sessão ${letra}`);
    if (!nome || !nome.trim()) return;
    salvarDias([...(treino.dias || []), { letra, nome: nome.trim(), diasSemana: [], exercicios: [] }]);
  }

  if (carregando) return <p className="empty">Carregando...</p>;
  if (erro) return <p className="empty">{erro}</p>;
  if (!treino) return <p className="empty">Treino não encontrado.</p>;

  return (
    <div>
      <Link to="/treinos">&larr; Voltar para treinos</Link>
      <h1>{treino.nome}</h1>
      <p className="subtitle">{(treino.dias || []).length} sessão(ões)</p>

      {(treino.dias || []).map((dia, i) => (
        <div className="card sessao-card" key={dia.letra}>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div className="mover-sessao">
              <button type="button" onClick={() => moverSessao(i, -1)} disabled={i === 0}>▲</button>
              <button type="button" onClick={() => moverSessao(i, 1)} disabled={i === treino.dias.length - 1}>▼</button>
            </div>
            <span className="letra-badge">{dia.letra}</span>
            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/treinos/${treinoId}/sessoes/${dia.letra}`)}>
              <div className="name">{dia.nome}</div>
              <div className="meta">≡ {(dia.exercicios || []).length} exercícios</div>
            </div>
            <div className="row" style={{ width: 'auto', gap: 4 }}>
              <button type="button" className="btn-secondary btn-small" onClick={() => renomearSessao(i)} title="Renomear">✎</button>
              <button type="button" className="btn-secondary btn-small" onClick={() => duplicarSessao(i)} title="Duplicar">⧉</button>
              <button type="button" className="btn-danger btn-small" onClick={() => excluirSessao(i)} title="Excluir">🗑</button>
              <button type="button" className="btn-secondary btn-small" onClick={() => navigate(`/treinos/${treinoId}/sessoes/${dia.letra}`)} title="Abrir">›</button>
            </div>
          </div>

          <div className="row" style={{ marginTop: 10, justifyContent: 'flex-start', gap: 0 }}>
            <span className="meta" style={{ marginRight: 8 }}>DIAS</span>
            {DIAS_SEMANA_SESSAO.map((d) => (
              <button
                type="button"
                key={d.chave}
                className={`dia-semana-circulo ${(dia.diasSemana || []).includes(d.chave) ? 'ativo' : ''}`}
                onClick={() => alternarDiaSemana(i, d.chave)}
              >
                {d.letra}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn-iniciar-presencial"
            onClick={() => setModalRegistro(dia)}
            disabled={(dia.exercicios || []).length === 0}
          >
            ▶ Iniciar treino presencial
          </button>
        </div>
      ))}

      <button type="button" className="btn-secondary" style={{ width: '100%', marginTop: 8 }} onClick={adicionarSessao}>
        + Adicionar Sessão
      </button>

      {modalRegistro && (
        <ModalRegistroTreino
          treino={treino}
          dia={modalRegistro}
          alunoId={treino.alunoId}
          onClose={() => setModalRegistro(null)}
          onSalvo={() => {}}
        />
      )}
    </div>
  );
}
