import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, MENSAGENS_PRONTAS } from '../api.js';
import { ehVideo, extrairCapa, prepararFoto } from '../midia.js';

const CATEGORIAS = Object.keys(MENSAGENS_PRONTAS);

export default function Mensagens() {
  const [searchParams] = useSearchParams();
  const [alunos, setAlunos] = useState([]);
  const [alunoId, setAlunoId] = useState('');
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [enviandoMidia, setEnviandoMidia] = useState(false);
  const fimRef = useRef(null);
  const entradaArquivo = useRef(null);

  useEffect(() => {
    api.listarAlunos(true).then((lista) => {
      setAlunos(lista);
      if (lista.length && !alunoId) setAlunoId(searchParams.get('alunoId') || lista[0].id);
    });
  }, []);

  async function carregar(id) {
    setMensagens(await api.listarMensagens(id));
  }

  useEffect(() => { if (alunoId) carregar(alunoId); }, [alunoId]);
  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensagens]);

  async function enviar(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    await api.enviarMensagem({ alunoId, remetente: 'trainer', texto });
    setTexto('');
    await carregar(alunoId);
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
      await carregar(alunoId);
    } catch (e) {
      alert(e.message);
    } finally {
      setEnviandoMidia(false);
    }
  }

  const nomeAluno = alunos.find((a) => a.id === alunoId)?.nome || '';

  function usarModelo(modelo) {
    setTexto(modelo.replaceAll('{nome}', nomeAluno.split(' ')[0] || nomeAluno));
  }

  return (
    <div>
      <h1>Mensagens</h1>
      <p className="subtitle">Comunicação com o cliente dentro da plataforma</p>

      <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)} style={{ marginBottom: 12 }}>
        {alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
      </select>

      <div className="card" style={{ maxHeight: '48vh', overflowY: 'auto' }}>
        {mensagens.length === 0 && <p className="empty">Nenhuma mensagem ainda.</p>}
        {mensagens.map((m) => (
          <div key={m.id} style={{ textAlign: m.remetente === 'trainer' ? 'right' : 'left', marginBottom: 8 }}>
            <span style={{
              display: 'inline-block', padding: m.midia ? 6 : '8px 12px', borderRadius: 12, maxWidth: '80%',
              background: m.remetente === 'trainer' ? 'var(--green)' : '#eef2f0',
              color: m.remetente === 'trainer' ? 'white' : 'var(--text)',
            }}>
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
            <div className="meta">{new Date(m.createdAt).toLocaleString('pt-BR')}</div>
          </div>
        ))}
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
