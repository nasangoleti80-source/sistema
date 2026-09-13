import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, MENSAGENS_PRONTAS } from '../api.js';
import { ehVideo, extrairCapa, prepararFoto } from '../midia.js';

const CATEGORIAS = Object.keys(MENSAGENS_PRONTAS);

function iniciais(nome) {
  return nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

// "14:32" se for hoje, "09/09" se não for — igual a lista de conversa do WhatsApp.
function horaOuData(iso) {
  const d = new Date(iso);
  const hoje = new Date();
  const mesmodia = d.toDateString() === hoje.toDateString();
  return mesmodia
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function resumoMensagem(m) {
  if (m.texto) return m.texto;
  if (m.midia) return m.midia.tipo === 'video' ? '🎥 Vídeo' : '📷 Foto';
  return '';
}

export default function Mensagens() {
  const [searchParams] = useSearchParams();
  const [alunos, setAlunos] = useState([]);
  const [todasMensagens, setTodasMensagens] = useState([]);
  const [alunoId, setAlunoId] = useState(searchParams.get('alunoId') || null);
  const [notas, setNotas] = useState([]);
  const [busca, setBusca] = useState('');
  const [texto, setTexto] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [enviandoMidia, setEnviandoMidia] = useState(false);
  const fimRef = useRef(null);
  const entradaArquivo = useRef(null);

  async function carregarListaBase() {
    const [listaAlunos, listaMensagens] = await Promise.all([
      api.listarAlunos(true),
      api.listarMensagens(''),
    ]);
    setAlunos(listaAlunos);
    setTodasMensagens(listaMensagens);
  }

  useEffect(() => { carregarListaBase(); }, []);
  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [alunoId, todasMensagens]);

  const mensagens = alunoId ? todasMensagens.filter((m) => m.alunoId === alunoId) : [];

  // Ao abrir a conversa, marca de leu o que a aluna mandou — o símbolo de
  // "chegou mensagem" (bolinha na lista) some sozinho, como no WhatsApp.
  useEffect(() => {
    if (!alunoId) return;
    api.listarNotas(alunoId).then(setNotas);
    const naoLidas = todasMensagens.filter((m) => m.alunoId === alunoId && m.remetente === 'aluno' && !m.lida);
    if (naoLidas.length === 0) return;
    Promise.all(naoLidas.map((m) => api.marcarMensagemLida(m.id))).then(() => {
      setTodasMensagens((ms) => ms.map((m) => (naoLidas.some((nl) => nl.id === m.id) ? { ...m, lida: true } : m)));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alunoId]);

  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim() || !alunoId) return;
    await api.enviarMensagem({ alunoId, remetente: 'trainer', texto });
    setTexto('');
    setTodasMensagens(await api.listarMensagens(''));
  }

  async function enviarArquivo(arquivo) {
    setEnviandoMidia(true);
    try {
      const mensagem = await api.enviarMensagem({ alunoId, remetente: 'trainer', texto: '' });
      if (ehVideo(arquivo)) {
        await api.enviarMidiaMensagem(mensagem.id, arquivo);
        const capa = await extrairCapa(arquivo);
        if (capa) await api.enviarMidiaMensagem(mensagem.id, capa, { capaDe: true });
      } else {
        const foto = await prepararFoto(arquivo);
        await api.enviarMidiaMensagem(mensagem.id, foto);
      }
      setTodasMensagens(await api.listarMensagens(''));
    } catch (e) {
      alert(e.message);
    } finally {
      setEnviandoMidia(false);
    }
  }

  async function alternarEstrela(m) {
    const notaExistente = notas.find((n) => n.origemMensagemId === m.id);
    if (notaExistente) {
      await api.removerNota(notaExistente.id);
      setNotas((ns) => ns.filter((n) => n.id !== notaExistente.id));
      return;
    }
    const quando = new Date(m.createdAt).toLocaleString('pt-BR');
    const remetenteLabel = m.remetente === 'aluno' ? nomeAluno.split(' ')[0] : 'Eu';
    const nota = await api.criarNota({
      alunoId,
      texto: `Mensagem salva (${quando}) — ${remetenteLabel}: ${resumoMensagem(m) || '(mídia)'}`,
      origemMensagemId: m.id,
    });
    setNotas((ns) => [nota, ...ns]);
  }

  const nomeAluno = alunos.find((a) => a.id === alunoId)?.nome || '';

  function usarModelo(modelo) {
    setTexto(modelo.replaceAll('{nome}', nomeAluno.split(' ')[0] || nomeAluno));
  }

  // Lista de conversas: última mensagem, quantas não lidas, ordenado por
  // quem falou mais recente — igual à tela inicial do WhatsApp.
  const conversas = alunos
    .map((a) => {
      const msgs = todasMensagens.filter((m) => m.alunoId === a.id);
      const ultima = msgs[msgs.length - 1] || null;
      const naoLidas = msgs.filter((m) => m.remetente === 'aluno' && !m.lida).length;
      return { aluno: a, ultima, naoLidas };
    })
    .filter((c) => c.aluno.nome.toLowerCase().includes(busca.trim().toLowerCase()))
    .sort((a, b) => {
      if (!a.ultima && !b.ultima) return a.aluno.nome.localeCompare(b.aluno.nome, 'pt-BR');
      if (!a.ultima) return 1;
      if (!b.ultima) return -1;
      return a.ultima.createdAt < b.ultima.createdAt ? 1 : -1;
    });

  // -------------------------------------------------------- conversa aberta
  if (alunoId) {
    return (
      <div>
        <div className="row chat-cabecalho">
          <button type="button" className="btn-secondary btn-small" onClick={() => setAlunoId(null)}>← Conversas</button>
          <h1 style={{ margin: 0, fontSize: 20 }}>{nomeAluno}</h1>
        </div>

        <div className="card" style={{ maxHeight: '48vh', overflowY: 'auto' }}>
          {mensagens.length === 0 && <p className="empty">Nenhuma mensagem ainda.</p>}
          {mensagens.map((m) => {
            const salva = notas.some((n) => n.origemMensagemId === m.id);
            return (
              <div key={m.id} style={{ textAlign: m.remetente === 'trainer' ? 'right' : 'left', marginBottom: 8 }}>
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
                <button
                  type="button"
                  className={`estrela-mensagem ${salva ? 'ativa' : ''}`}
                  onClick={() => alternarEstrela(m)}
                  title={salva ? 'Remover das anotações' : 'Salvar nas minhas anotações'}
                >
                  {salva ? '★' : '☆'}
                </button>
                <div className="meta">{new Date(m.createdAt).toLocaleString('pt-BR')}</div>
              </div>
            );
          })}
          <div ref={fimRef} />
        </div>

        <h2 style={{ marginTop: 16, marginBottom: 6 }}>Mensagens prontas</h2>
        <div className="categorias-mensagem">
          {CATEGORIAS.map((c) => (
            <button type="button" key={c} className={c === categoria ? 'ativa' : ''} onClick={() => setCategoria(c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="lista-mensagens-prontas">
          {MENSAGENS_PRONTAS[categoria].map((modelo, i) => (
            <button type="button" key={i} className="mensagem-pronta-item" onClick={() => usarModelo(modelo)}>
              {modelo.replaceAll('{nome}', nomeAluno.split(' ')[0] || nomeAluno)}
            </button>
          ))}
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
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva ou escolha uma mensagem pronta acima..." style={{ flex: 1 }} />
          <button className="btn-primary" type="submit">Enviar</button>
        </form>
      </div>
    );
  }

  // -------------------------------------------------------- lista de conversas
  return (
    <div>
      <h1>Mensagens</h1>
      <p className="subtitle">Comunicação com o cliente dentro da plataforma</p>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome..."
        style={{ marginBottom: 12 }}
      />

      <div className="card" style={{ padding: 0 }}>
        {conversas.length === 0 && <p className="empty" style={{ padding: 15 }}>Nenhum aluno encontrado.</p>}
        {conversas.map(({ aluno, ultima, naoLidas }) => (
          <button type="button" key={aluno.id} className="conversa-item" onClick={() => setAlunoId(aluno.id)}>
            <span className="conversa-avatar">{iniciais(aluno.nome)}</span>
            <span className="conversa-info">
              <span className="conversa-nome">{aluno.nome}</span>
              <span className="conversa-preview">{ultima ? resumoMensagem(ultima) : 'Nenhuma mensagem ainda'}</span>
            </span>
            <span className="conversa-lado">
              {ultima && <span className="conversa-hora">{horaOuData(ultima.createdAt)}</span>}
              {naoLidas > 0 && <span className="conversa-badge">{naoLidas}</span>}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
