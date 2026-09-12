import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import ExercicioDoTreino from '../componentes/ExercicioDoTreino.jsx';
import {
  indexarCatalogo, api, formatarData, formatarMoeda, temPacoteAtivo, volumeSemanalPorZona, semanaAtualIntervalo,
  INTENSIDADES_TREINO, TIPOS_REFEICAO, UNIDADES_ALIMENTO, MEDIDAS_CAMPOS, PERIODICIDADES, DIAS_SEMANA_SESSAO,
} from '../api.js';
import { ehVideo, extrairCapa, prepararFoto } from '../midia.js';
import CarrosselOpcoes from '../components/CarrosselOpcoes.jsx';
import { indexarAlimentos, nutrientesDaOpcao, nutrientesDaTroca, kcalCurto, resumoCurto } from '../nutricao.js';
import Bonequinho, { LegendaBonequinho } from '../components/Bonequinho.jsx';

// Vira embed do YouTube (watch?v=, youtu.be/, shorts/) para tocar dentro do
// próprio portal, sem sair para o app do YouTube.
function urlEmbed(url) {
  const m = String(url || '').match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1` : url;
}

function ModalVideo({ url, onFechar }) {
  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal modal-video" onClick={(e) => e.stopPropagation()}>
        <div className="video-embed">
          <iframe
            src={urlEmbed(url)}
            title="Vídeo"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
        <button className="btn-secondary" onClick={onFechar} style={{ marginTop: 10 }}>Fechar</button>
      </div>
    </div>
  );
}

/** Fileiras horizontais por categoria, estilo Netflix — só é chamado depois
 * que o aluno já tem pacote ativo, então nenhum vídeo aqui fica travado. */
function FileirasVideos({ conteudos, onAbrir }) {
  if (conteudos.length === 0) return <p className="empty">Nenhum vídeo disponível ainda.</p>;
  const categorias = [...new Set(conteudos.map((c) => c.categoria))];

  return (
    <div className="videoteca">
      {categorias.map((cat) => (
        <div key={cat} className="fileira-videos">
          <div className="name">{cat}</div>
          <div className="fileira-scroll">
            {conteudos.filter((c) => c.categoria === cat).map((c) => (
              <button key={c.id} type="button" className="video-card" onClick={() => onAbrir(c.videoUrl)}>
                {c.capaUrl && <img src={c.capaUrl} alt="" />}
                <span className="video-titulo">{c.titulo}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Vitrine para quem ainda não tem pacote ativo — banner de chamada,
 * categorias em destaque (sem abrir vídeo nenhum) e os planos cadastrados.
 * O botão "Quero esse plano" manda uma mensagem pra treinadora: o
 * fechamento e o pagamento continuam manuais, como em Pacotes, até existir
 * um checkout de verdade integrado aqui. */
function PlayFlixPromo({ categorias, conteudos, planos, onQuero }) {
  const capaPorCategoria = (cat) => conteudos.find((c) => c.categoria === cat && c.capaUrl)?.capaUrl;

  return (
    <div className="playflix-vitrine">
      <div className="playflix-hero">
        <span className="playflix-hero-tag">Novo</span>
        <div className="playflix-hero-titulo">
          a solução da sua<br /><strong>SAÚDE FÍSICA<br />E MENTAL</strong>
        </div>
        <p className="playflix-hero-sub">Vídeo-aulas exclusivas — treinos extras, bem-estar e muito mais</p>
      </div>

      {categorias.length > 0 && (
        <div className="fileira-videos">
          <div className="name">O que tem no PlayFlix</div>
          <div className="fileira-scroll">
            {categorias.map((cat) => (
              <div key={cat} className="video-card video-card-mostruario">
                {capaPorCategoria(cat) && <img src={capaPorCategoria(cat)} alt="" />}
                <span className="video-titulo">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="playflix-planos">
        <div className="name" style={{ marginBottom: 8 }}>Escolha um plano e libere tudo</div>
        {planos.length === 0 && (
          <p className="empty">Fale com sua treinadora para saber como contratar e liberar o PlayFlix.</p>
        )}
        {planos.map((p) => (
          <div key={p.id} className={`card plano-card ${p.destaque ? 'plano-card-destaque' : ''}`}>
            {p.destaque && <span className="plano-selo">Mais vendido 🔥</span>}
            <div className="name">{p.nome}</div>
            <div className="plano-preco">
              {formatarMoeda(p.preco)}<span className="plano-preco-periodo">/{PERIODICIDADES[p.periodicidade]?.toLowerCase() || p.periodicidade}</span>
            </div>
            <button className="btn-primary" style={{ width: '100%', marginTop: 10 }} onClick={() => onQuero(p)}>
              Quero esse plano
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Um alimento da refeição e as trocas dele.
 *
 * No PDF o aluno lia "pão com ovo" e tinha que virar a página para achar o
 * que podia comer no lugar. Aqui a troca fica no mesmo lugar — e mostra
 * quanto vale, que é o que o nutricionista equilibrou e o papel não dizia.
 *
 * O cartão é miúdo de propósito: este carrossel fica por dentro do que
 * escolhe a refeição inteira, e dois iguais empilhados não deixam claro o
 * que está sendo escolhido.
 */
function ItemDieta({ item, onEscolher, catalogo }) {
  const opcoes = item.opcoes || [];
  if (opcoes.length === 0) return null;
  const escolhida = item.escolhaAtual || 0;
  const quanto = (op) => `${op.quantidade} ${UNIDADES_ALIMENTO[op.unidade] || op.unidade}`;

  if (opcoes.length === 1) {
    const op = opcoes[0];
    const kcal = kcalCurto(nutrientesDaTroca(op, catalogo));
    return (
      <div className="list-item">
        <div>
          <div className="name">{op.nome}</div>
          <div className="meta">
            {quanto(op)}
            {kcal && <> · <span className="num">{kcal}</span></>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bloco-trocas">
      <p className="rotulo-trocas">Escolha um:</p>
      <CarrosselOpcoes
        miudo
        opcoes={opcoes}
        escolhida={escolhida}
        onEscolher={onEscolher}
        render={(op) => {
          const kcal = kcalCurto(nutrientesDaTroca(op, catalogo));
          return (
            <>
              <div className="name" style={{ fontSize: 14 }}>{op.nome}</div>
              <div className="meta">{quanto(op)}</div>
              {kcal && <div className="meta num opcao-kcal">{kcal}</div>}
            </>
          );
        }}
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
function RefeicaoOpcoes({ opcoes, escolhaAtual, onEscolher, catalogo }) {
  if (!opcoes?.length) return <p className="meta">Nenhuma opção cadastrada nesta refeição ainda.</p>;
  const escolhida = escolhaAtual || 0;
  const total = nutrientesDaOpcao(opcoes[escolhida] || opcoes[0], catalogo);
  return (
    <div>
      <CarrosselOpcoes
        opcoes={opcoes}
        escolhida={escolhida}
        onEscolher={onEscolher}
        render={(o, principal) => {
          const kcal = kcalCurto(nutrientesDaOpcao(o, catalogo));
          return (
            <>
              {o.fotoUrl && <img className="opcao-foto" src={o.fotoUrl} alt="" loading="lazy" />}
              <div className="opcao-conteudo">
                <div className="name" style={{ fontSize: 14 }}>{principal ? '✓ ' : ''}{o.nome}</div>
                <div className="meta">{resumoOpcao(o)}</div>
                {kcal && <div className="meta num opcao-kcal">{kcal}</div>}
              </div>
            </>
          );
        }}
      />
      <button type="button" className="btn-trocar-opcao" onClick={() => onEscolher((escolhida + 1) % opcoes.length)}>
        🔄 Trocar opção ({escolhida + 1}/{opcoes.length})
      </button>
      {resumoCurto(total) && <p className="meta num total-refeicao">{resumoCurto(total)}</p>}
    </div>
  );
}

// A próxima refeição do dia entre todas as dietas ativas, pelo horário
// cadastrado — se já passou de todas, volta pra primeira (a do dia seguinte).
function proximaRefeicao(dietas) {
  const agora = new Date();
  const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
  const todas = [];
  for (const d of dietas) {
    for (const r of d.refeicoes || []) {
      if (r.horario) todas.push(r);
    }
  }
  if (todas.length === 0) return null;
  todas.sort((a, b) => a.horario.localeCompare(b.horario));
  return todas.find((r) => r.horario >= horaAtual) || todas[0];
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
  const [conteudos, setConteudos] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [todosTreinos, setTodosTreinos] = useState([]);
  const [texto, setTexto] = useState('');
  const [aba, setAba] = useState('inicio');
  const [catalogo, setCatalogo] = useState(() => new Map());
  const [alimentos, setAlimentos] = useState(() => new Map());
  const [erro, setErro] = useState('');
  const [enviandoMidia, setEnviandoMidia] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [videoAberto, setVideoAberto] = useState(null);
  const fimRef = useRef(null);
  const entradaArquivo = useRef(null);

  async function carregarTudo() {
    try {
      const [a, t, e, av, p, d, m, ex, c, pl, reg, al] = await Promise.all([
        api.obterAluno(alunoId),
        api.listarTreinos(alunoId),
        api.listarEndurance(alunoId),
        api.listarAvaliacoes(alunoId),
        api.listarPacotes(alunoId),
        api.listarDietas(alunoId),
        api.listarMensagens(alunoId),
        // O catálogo traz foto, vídeo e a dica de onde o aparelho fica.
        api.listarExercicios(),
        api.listarConteudos().catch(() => []),
        api.listarPlanos().catch(() => []),
        api.listarRegistrosTreino({ alunoId }).catch(() => []),
        // O catálogo de alimentos é de onde saem as calorias de cada troca.
        api.listarAlimentos().catch(() => []),
      ]);
      setAluno(a);
      setTreinos(t.filter((tr) => tr.ativo));
      setTodosTreinos(t);
      setEndurance(e.filter((pl) => pl.ativo));
      setAvaliacoes(av);
      setPacotes(p);
      setDietas(d.filter((dt) => dt.ativa));
      setMensagens(m);
      setCatalogo(indexarCatalogo(ex));
      setConteudos(c);
      setPlanos(pl);
      setRegistros(reg);
      setAlimentos(indexarAlimentos(al));
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

  async function enviarQueroPlano(plano) {
    try {
      await api.enviarMensagem({ alunoId, remetente: 'aluno', texto: `Quero o ${plano.nome} do PlayFlix (${formatarMoeda(plano.preco)})` });
      alert('Prontinho! Sua treinadora recebeu seu interesse e vai combinar o pagamento com você por aqui mesmo.');
      const m = await api.listarMensagens(alunoId);
      setMensagens(m);
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

  const volumesSemana = volumeSemanalPorZona(registros, todosTreinos);
  const { inicio: inicioSemana } = semanaAtualIntervalo();
  const hojeStr = new Date().toISOString().slice(0, 10);
  const diasComData = DIAS_SEMANA_SESSAO.map((d, i) => {
    const dt = new Date(inicioSemana + 'T00:00:00');
    dt.setDate(dt.getDate() + i);
    return { ...d, data: dt.toISOString().slice(0, 10) };
  });
  const diasComRegistro = new Set(registros.map((r) => r.data));
  const refeicaoSeguinte = proximaRefeicao(dietas);

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
        {['inicio', 'treino', 'endurance', 'evolucao', 'dieta', 'videos', 'mensagens'].map((a) => (
          <button key={a} className={aba === a ? 'btn-primary btn-small' : 'btn-secondary btn-small'} onClick={() => setAba(a)}>
            {{ inicio: 'Início', treino: 'Treino', endurance: 'Endurance', evolucao: 'Evolução', dieta: 'Dieta', videos: 'PlayFlix', mensagens: 'Mensagens' }[a]}
          </button>
        ))}
      </div>

      {aba === 'inicio' && (
        <>
          <div className="row" style={{ gap: 10, marginBottom: 16 }}>
            <button type="button" className="atalho-rapido" onClick={() => setAba('treino')}>
              <span className="atalho-ic">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6.5 6.5h11M6.5 17.5h11" /><path d="M4 9V6a2 2 0 1 1 4 0v12a2 2 0 1 1-4 0v-3" /><path d="M16 9V6a2 2 0 1 1 4 0v12a2 2 0 1 1-4 0v-3" />
                </svg>
              </span>
              <span className="atalho-rotulo">Treino</span>
              <span className="atalho-valor">{treinos[0]?.nome || 'Sem treino ativo'}</span>
            </button>

            <button type="button" className="atalho-rapido" onClick={() => alert('Lembrete: procure beber água ao longo do dia — a meta sugerida é cerca de 2 litros 💧')}>
              <span className="atalho-ic">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.5s6.5 7.2 6.5 12a6.5 6.5 0 1 1-13 0c0-4.8 6.5-12 6.5-12Z" />
                </svg>
              </span>
              <span className="atalho-rotulo">Água</span>
              <span className="atalho-valor">Beba água</span>
            </button>

            <button type="button" className="atalho-rapido" onClick={() => setAba('dieta')}>
              <span className="atalho-ic">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11h18" /><path d="M6 11V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" /><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" />
                </svg>
              </span>
              <span className="atalho-rotulo">Próxima refeição</span>
              <span className="atalho-valor">
                {refeicaoSeguinte ? `${refeicaoSeguinte.horario} - ${TIPOS_REFEICAO[refeicaoSeguinte.tipo] || refeicaoSeguinte.nome}` : 'Sem dieta cadastrada'}
              </span>
            </button>
          </div>

          <div className="card resumo-semana">
            <div className="name" style={{ marginBottom: 10 }}>Resumo da semana</div>
            <div className="row" style={{ gap: 8, marginBottom: 16 }}>
              {diasComData.map((d) => (
                <span
                  key={d.chave}
                  className={`dia-semana-circulo ${diasComRegistro.has(d.data) ? 'feito' : ''} ${d.data === hojeStr ? 'hoje' : ''}`}
                >
                  {diasComRegistro.has(d.data) ? '✓' : d.letra}
                </span>
              ))}
            </div>
            <div className="row" style={{ gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
              <Bonequinho sexo={aluno.sexo} volumes={volumesSemana.frente} />
              <LegendaBonequinho volumes={volumesSemana.frente} costas={volumesSemana.costas} />
            </div>
          </div>

          <button className="btn-primary" style={{ width: '100%' }} onClick={() => setAba('treino')}>
            Ir para o treino de hoje
          </button>
        </>
      )}

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
                        catalogo={alimentos}
                      />
                    )
                    : (r.itens || []).map((item, j) => (
                      <ItemDieta key={j} item={item} catalogo={alimentos} onEscolher={(v) => mudarEscolhaItem(d.id, i, j, v)} />
                    ))}
                  {!r.itens && !r.opcoes && r.alimentos && <div className="meta">{r.alimentos}</div>}
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {aba === 'videos' && (
        temPacoteAtivo(pacotes)
          ? <FileirasVideos conteudos={conteudos} onAbrir={setVideoAberto} />
          : (
            <PlayFlixPromo
              categorias={[...new Set(conteudos.map((c) => c.categoria))]}
              conteudos={conteudos}
              planos={planos}
              onQuero={enviarQueroPlano}
            />
          )
      )}

      {videoAberto && <ModalVideo url={videoAberto} onFechar={() => setVideoAberto(null)} />}

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
