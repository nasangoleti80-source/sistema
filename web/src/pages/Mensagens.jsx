import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';

export default function Mensagens() {
  const [searchParams] = useSearchParams();
  const [alunos, setAlunos] = useState([]);
  const [alunoId, setAlunoId] = useState('');
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const fimRef = useRef(null);

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

  return (
    <div>
      <h1>Mensagens</h1>
      <p className="subtitle">Comunicação com o cliente dentro da plataforma</p>

      <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)} style={{ marginBottom: 12 }}>
        {alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
      </select>

      <div className="card" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
        {mensagens.length === 0 && <p className="empty">Nenhuma mensagem ainda.</p>}
        {mensagens.map((m) => (
          <div key={m.id} style={{ textAlign: m.remetente === 'trainer' ? 'right' : 'left', marginBottom: 8 }}>
            <span style={{
              display: 'inline-block', padding: '8px 12px', borderRadius: 12, maxWidth: '80%',
              background: m.remetente === 'trainer' ? 'var(--green)' : '#eef2f0',
              color: m.remetente === 'trainer' ? 'white' : 'var(--text)',
            }}>
              {m.texto}
            </span>
            <div className="meta">{new Date(m.createdAt).toLocaleString('pt-BR')}</div>
          </div>
        ))}
        <div ref={fimRef} />
      </div>

      <form onSubmit={enviar} className="row" style={{ marginTop: 10, gap: 8 }}>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva uma mensagem..." />
        <button className="btn-primary" type="submit">Enviar</button>
      </form>
    </div>
  );
}
