import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

function formatarQuando(iso) {
  const d = new Date(iso);
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  return mesmoDia
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function Chat() {
  const [conversas, setConversas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  async function carregar() {
    try {
      setConversas(await api.listarConversas());
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    const intervalo = setInterval(carregar, 5000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div>
      <h1>Conversas</h1>
      <p className="subtitle">Fale com seus alunos e receba fotos e vídeos pra correção</p>

      {erro && <div className="error-msg">{erro}</div>}
      {carregando && <p className="empty">Carregando...</p>}
      {!carregando && conversas.length === 0 && <p className="empty">Cadastre alunos primeiro na aba "Alunos".</p>}

      <div className="card">
        {conversas.map((c) => (
          <Link to={`/chat/${c.alunoId}`} key={c.alunoId} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="list-item">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="name">{c.nome} {!c.ativo && <span className="badge sem-cobranca">inativo</span>}</div>
                <div className="meta" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.ultimaMensagem
                    ? `${c.ultimaMensagem.remetente === 'treinador' ? 'Você: ' : ''}${c.ultimaMensagem.texto || (c.ultimaMensagem.temMidia ? '📎 Anexo' : '')}`
                    : 'Nenhuma mensagem ainda'}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {c.ultimaMensagem && <div className="meta">{formatarQuando(c.ultimaMensagem.createdAt)}</div>}
                {c.naoLidas > 0 && <span className="badge atrasado" style={{ marginTop: 4, display: 'inline-block' }}>{c.naoLidas}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
