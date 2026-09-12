import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import ExercicioDoTreino from '../componentes/ExercicioDoTreino.jsx';
import {
  indexarCatalogo, api, formatarData, formatarMoeda,
  INTENSIDADES_TREINO, TIPOS_REFEICAO, UNIDADES_ALIMENTO, MEDIDAS_CAMPOS,
} from '../api.js';
import { ehVideo, extrairCapa, prepararFoto } from '../midia.js';
import CarrosselOpcoes from '../components/CarrosselOpcoes.jsx';

function ItemDieta({ item, onEscolher }) {
  const opcoes = item.opcoes || [];
  if (opcoes.length === 0) return null;
  const escolhida = item.escolhaAtual || 0;

  if (opcoes.length === 1) {
    const op = opcoes[0];
    return (
      <div className="list-item">
        <div>
          <div className="name">{op.nome}</div>
          <div className="meta">{op.quantidade} {UNIDADES_ALIMENTO[op.unidade] || op.unidade}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 10 }}>
      <CarrosselOpcoes
        opcoes={opcoes}
        escolhida={escolhida}
        onEscolher={onEscolher}
        render={(op) => (
          <>
            <div className="name" style={{ fontSize: 14 }}>{op.nome}</div>
            <div className="meta">{op.quantidade} {UNIDADES_ALIMENTO[op.unidade] || op.unidade}</div>
          </>
        )}
      />
      <button type="button" className="btn-trocar-opcao" onClick={() => onEscolher((escolhida + 1) % opcoes.length)}>
        🔄 Trocar opção ({escolhida + 1}/{opcoes.length})
      </button>
    </div>
  );
}

// Um alimento dentro de uma opção, em texto corrido: "1 fatia de pão de
// forma" — usa a alternativa já escolhida quando o item tiver mais de uma.
function textoItem(item) {
  const op = item.opcoes?.[item.escolhaAtual || 0] || item.opcoes?.[0];
  if (!op?.nome) return '';
  return `${op.quantidade} ${UNIDADES_ALIMENTO[op.unidade] || op.unidade} de ${op.nome}`;
}

function resumoOpcao(opcao) {
  return (opcao.itens || []).map(textoItem).filter(Boolean).join(' + ');
}

// Refeição com opções completas (vieram de um banco de opções, copiadas
// para dentro desta dieta): o aluno arrasta para o lado e troca a refeição
// inteira — ex: "1 fatia de pão + 15g de doce de leite" vira "café com uma
// dose de whey". A opção escolhida fica fixa à esquerda como principal.
function RefeicaoOpcoes({ opcoes, escolhaAtual, onEscolher }) {
  if (!opcoes?.length) return <p className="meta">Nenhuma opção cadastrada nesta refeição ainda.</p>;
  const escolhida = escolhaAtual || 0;
  return (
    <div>
      <CarrosselOpcoes
        opcoes={opcoes}
        escolhida={escolhida}
        onEscolher={onEscolher}
        render={(o, principal) => (
          <>
            {o.fotoUrl && <img className="opcao-foto" src={o.fotoUrl} alt="" loading="lazy" />}
            <div className="opcao-conteudo">
              <div className="name" style={{ fontSize: 14 }}>{principal ? '✓ ' : ''}{o.nome}</div>
              <div className="meta">{resumoOpcao(o)}</div>
            </div>
          </>
        )}
      />
      <button type="button" className="btn-trocar-opcao" onClick={() => onEscolher((escolhida + 1) % opcoes.length)}>
        🔄 Trocar opção ({escolhida + 1}/{opcoes.length})
      </button>
    </div>
  );
}

function pegarCaminho(obj, caminho) {
  return caminho.split('.').reduce((v, k) => v?.[k], obj);
}

// Comparação visual simples entre a primeira e a última avaliação — o
// "antes e depois" em barras, sem precisar de biblioteca de gráfico.
function ComparativoEvolucao({ primeira, ultima }) {
  if (!primeira || !ultima || primeira.id === ultima.id) return null;

  const metricas = [
    { label: 'Peso', chave: 'pesoKg', unidade: 'kg', menorMelhor: null },
    { label: 'Gordura corporal', chave: 'calculado.percentualGordura', unidade: '%', menorMelhor: true },
    { label: 'Massa gorda', chave: 'calculado.massaGordaKg', unidade: 'kg', menorMelhor: true },
    { label: 'Massa magra', chave: 'calculado.massaMagraKg', unidade: 'kg', menorMelhor: false },
  ];

  const linhas = metricas
    .map((m) => ({ ...m, antes: pegarCaminho(primeira, m.chave), depois: pegarCaminho(ultima, m.chave) }))
    .filter((m) => m.antes != null && m.depois != null);

  if (linhas.length === 0) return null;

  return (
    <div className="card">
      <div className="name" style={{ marginBottom: 2 }}>Antes e depois</div>
      <div className="meta" style={{ marginBottom: 14 }}>
        {formatarData(primeira.data)} → {formatarData(ultima.data)}
      </div>
      {linhas.map((m) => {
        const diferenca = Number((m.depois - m.antes).toFixed(1));
        const favoravel = m.menorMelhor === null ? null : m.menorMelhor ? diferenca < 0 : diferenca > 0;
        const maior = Math.max(Math.abs(m.antes), Math.abs(m.depois)) || 1;
        return (
          <div key={m.label} style={{ marginBottom: 14 }}>
            <div className="row" style={{ marginBottom: 6 }}>
              <span className="meta">{m.label}</span>
              <span className={`badge ${favoravel === null ? 'sem-cobranca' : favoravel ? 'pago' : 'atrasado'}`}>
                {diferenca > 0 ? '+' : ''}{diferenca}{m.unidade}
              </span>
            </div>
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <span className="meta" style={{ width: 48, flexShrink: 0 }}>{m.antes}{m.unidade}</span>
              <span className="barra-trilho" style={{ flex: 1 }}>
                <span className="barra-preenche antes" style={{ width: `${Math.round((Math.abs(m.antes) / maior) * 100)}%` }} />
              </span>
            </div>
            <div className="row" style={{ gap: 8, alignItems: 'center', marginTop: 4 }}>
              <span className="meta" style={{ width: 48, flexShrink: 0 }}>{m.depois}{m.unidade}</span>
              <span className="barra-trilho" style={{ flex: 1 }}>
                <span className={`barra-preenche ${favoravel === false ? 'baixo' : ''}`} style={{ width: `${Math.round((Math.abs(m.depois) / maior) * 100)}%` }} />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
  const [catalogo, setCatalogo] = useState(() => new Map());
  const [erro, setErro] = useState('');
  const [enviandoMidia, setEnviandoMidia] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const fimRef = useRef(null);
  const entradaArquivo = useRef(null);

  async function carregarTudo() {
    try {
      const [a, t, e, av, p, d, m, ex] = await Promise.all([
        api.obterAluno(alunoId),
        api.listarTreinos(alunoId),
        api.listarEndurance(alunoId),
        api.listarAvaliacoes(alunoId),
        api.listarPacotes(alunoId),
        api.listarDietas(alunoId),
        api.listarMensagens(alunoId),
        // O catálogo traz foto, vídeo e a dica de onde o aparelho fica.
        api.listarExercicios(),
      ]);
      setAluno(a);
      setTreinos(t.filter((tr) => tr.ativo));
      setEndurance(e.filter((pl) => pl.ativo));
      setAvaliacoes(av);
      setPacotes(p);
      setDietas(d.filter((dt) => dt.ativa));
      setMensagens(m);
      setCatalogo(indexarCatalogo(ex));
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

  async function enviarArquivo(arquivo) {
    setEnviandoMidia(true);
    try {
      const mensagem = await api.enviarMensagem({ alunoId, remetente: 'aluno', texto: '' });
      if (ehVideo(arquivo)) {
        await api.enviarMidiaMensagem(mensagem.id, arquivo);
        const capa = await extrairCapa(arquivo);
        if (capa) await api.enviarMidiaMensagem(mensagem.id, capa, { capaDe: true });
      } else {
        const foto = await prepararFoto(arquivo);
        await api.enviarMidiaMensagem(mensagem.id, foto);
      }
      const m = await api.listarMensagens(alunoId);
      setMensagens(m);
    } catch (e) {
      alert(e.message);
    } finally {
      setEnviandoMidia(false);
    }
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

  async function mudarEscolhaRefeicao(dietaId, refeicaoIndex, novaEscolha) {
    const dieta = dietas.find((d) => d.id === dietaId);
    if (!dieta) return;
    const refeicoes = dieta.refeicoes.map((r, i) => (i === refeicaoIndex ? { ...r, escolhaAtual: novaEscolha } : r));
    const atualizado = await api.atualizarDieta(dietaId, { refeicoes });
    setDietas((ds) => ds.map((d) => (d.id === dietaId ? atualizado : d)));
  }

  async function mudarEscolhaItem(dietaId, refeicaoIndex, itemIndex, novaEscolha) {
    const dieta = dietas.find((d) => d.id === dietaId);
    if (!dieta) return;
    const refeicoes = dieta.refeicoes.map((r, i) => {
      if (i !== refeicaoIndex) return r;
      const itens = (r.itens || []).map((it, j) => (j === itemIndex ? { ...it, escolhaAtual: novaEscolha } : it));
      return { ...r, itens };
    });
    const atualizado = await api.atualizarDieta(dietaId, { refeicoes });
    setDietas((ds) => ds.map((d) => (d.id === dietaId ? atualizado : d)));
  }

  if (erro) return <p className="empty">{erro}</p>;
  if (!aluno) return <p className="empty">Carregando...</p>;

  const proximoPacote = pacotes.sort((a, b) => (a.dataVencimento < b.dataVencimento ? -1 : 1))[0];
  const ultimaAvaliacao = avaliacoes[0];
  const primeiraAvaliacao = avaliacoes[avaliacoes.length - 1];

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
                    <ExercicioDoTreino key={j} ex={ex} indice={catalogo} ordem={j + 1} />
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

          {avaliacoes.length >= 2 && (
            <ComparativoEvolucao primeira={primeiraAvaliacao} ultima={ultimaAvaliacao} />
          )}

          {avaliacoes.map((a) => {
            const medidasPreenchidas = MEDIDAS_CAMPOS.filter(([c]) => a.medidas?.[c] != null && a.medidas[c] !== '');
            return (
              <div className="card" key={a.id}>
                <div className="name">{formatarData(a.data)}</div>

                {medidasPreenchidas.length > 0 && (
                  <div className="medidas-grid">
                    {medidasPreenchidas.map(([c, label]) => (
                      <div key={c} className="medida-item">
                        <span className="medida-valor">{a.medidas[c]}<span className="medida-unidade">cm</span></span>
                        <span className="medida-label">{label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {a.fotos?.length > 0 && (
                  <div className="row" style={{ gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {a.fotos.map((f, i) => (
                      <img
                        key={i}
                        src={f.url}
                        alt=""
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, cursor: 'zoom-in' }}
                        onClick={() => setFotoAmpliada(f.url)}
                      />
                    ))}
                  </div>
                )}

                {a.observacoes && <p className="meta" style={{ marginTop: 8 }}>{a.observacoes}</p>}
              </div>
            );
          })}
        </>
      )}

      {aba === 'dieta' && (
        <>
          {dietas.length === 0 && <p className="empty">Nenhuma dieta ativa.</p>}
          {dietas.map((d) => (
            <div className="card" key={d.id}>
              <div className="name">{d.nome}</div>
              {(d.refeicoes || [])
                .map((r, i) => ({ r, i }))
                .sort((a, b) => (a.r.horario || '99:99').localeCompare(b.r.horario || '99:99'))
                .map(({ r, i }) => (
                <div key={i} className="card" style={{ background: 'var(--bg)' }}>
                  <div className="name">{r.horario ? `${r.horario} - ` : ''}{TIPOS_REFEICAO[r.tipo] || r.nome}</div>
                  {r.opcoes
                    ? (
                      <RefeicaoOpcoes
                        opcoes={r.opcoes}
                        escolhaAtual={r.escolhaAtual}
                        onEscolher={(v) => mudarEscolhaRefeicao(d.id, i, v)}
                      />
                    )
                    : (r.itens || []).map((item, j) => (
                      <ItemDieta key={j} item={item} onEscolher={(v) => mudarEscolhaItem(d.id, i, j, v)} />
                    ))}
                  {!r.itens && !r.opcoes && r.alimentos && <div className="meta">{r.alimentos}</div>}
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
                <span className={`bolha-mensagem remetente-${m.remetente} ${m.midia ? 'com-midia' : ''}`}>
                  {m.midia && (
                    m.midia.tipo === 'video' ? (
                      <video
                        src={`/midia/${m.midia.arquivo}`}
                        poster={m.midia.capa ? `/midia/${m.midia.capa}` : undefined}
                        controls
                        playsInline
                        preload="none"
                        style={{ maxWidth: 220, borderRadius: 8, display: 'block' }}
                      />
                    ) : (
                      <img src={`/midia/${m.midia.arquivo}`} alt="" style={{ maxWidth: 220, borderRadius: 8, display: 'block' }} />
                    )
                  )}
                  {m.texto && <span style={{ display: 'block', padding: m.midia ? '6px 4px 2px' : 0 }}>{m.texto}</span>}
                </span>
              </div>
            ))}
            <div ref={fimRef} />
          </div>
          <form onSubmit={enviar} className="row" style={{ marginTop: 10, gap: 8 }}>
            <input
              ref={entradaArquivo}
              type="file"
              accept="image/*,video/*"
              hidden
              onChange={(e) => {
                const arquivo = e.target.files[0];
                e.target.value = '';
                if (arquivo) enviarArquivo(arquivo);
              }}
            />
            <button
              type="button"
              className="btn-secondary"
              disabled={enviandoMidia}
              onClick={() => entradaArquivo.current.click()}
              title="Mandar foto ou vídeo"
            >
              {enviandoMidia ? '…' : '📎'}
            </button>
            <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva uma mensagem..." style={{ flex: 1 }} />
            <button className="btn-primary" type="submit">Enviar</button>
          </form>
        </>
      )}

      {fotoAmpliada && (
        <div className="modal-backdrop" onClick={() => setFotoAmpliada(null)}>
          <div className="lightbox" onClick={(e) => e.stopPropagation()}>
            <img src={fotoAmpliada} alt="" />
            <div className="row" style={{ marginTop: 10, gap: 8 }}>
              <a className="btn-primary" href={fotoAmpliada} download="foto-evolucao.jpg">Baixar foto</a>
              <button type="button" className="btn-secondary" onClick={() => setFotoAmpliada(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
