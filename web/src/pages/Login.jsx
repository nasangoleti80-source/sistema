import { useEffect, useState } from 'react';
import { api, salvarSessao } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { entrar } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [configurado, setConfigurado] = useState(true);
  const [modo, setModo] = useState('treinador');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [usuario, setUsuario] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api
      .statusAuth()
      .then((r) => setConfigurado(r.configurado))
      .catch(() => setConfigurado(true))
      .finally(() => setCarregando(false));
  }, []);

  async function criarSenha(e) {
    e.preventDefault();
    setErro('');
    if (senha.length < 4) return setErro('A senha precisa ter pelo menos 4 caracteres');
    if (senha !== confirmarSenha) return setErro('As senhas não coincidem');
    setEnviando(true);
    try {
      const r = await api.setupTreinador(senha);
      salvarSessao(r.token, { role: 'treinador' });
      entrar({ role: 'treinador' });
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function loginTreinador(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const r = await api.loginTreinador(senha);
      salvarSessao(r.token, { role: 'treinador' });
      entrar({ role: 'treinador' });
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function loginAluno(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const r = await api.loginAluno(usuario, senha);
      const sessao = { role: 'aluno', alunoId: r.alunoId, nome: r.nome };
      salvarSessao(r.token, sessao);
      entrar(sessao);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <div className="login-screen">
        <p className="empty">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="brand" style={{ marginBottom: 18, fontSize: 22 }}>💪 Nayara PT</div>

        {!configurado ? (
          <>
            <h1>Criar sua senha de acesso</h1>
            <p className="subtitle">Essa é a primeira vez que o sistema é aberto. Crie uma senha só sua.</p>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={criarSenha}>
              <label>Nova senha</label>
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoFocus />
              <label>Confirmar senha</label>
              <input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} />
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 16 }} disabled={enviando}>
                {enviando ? 'Criando...' : 'Criar senha e entrar'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="view-toggle" style={{ marginBottom: 18 }}>
              <button className={modo === 'treinador' ? 'active' : ''} onClick={() => { setModo('treinador'); setErro(''); }}>
                Sou a treinadora
              </button>
              <button className={modo === 'aluno' ? 'active' : ''} onClick={() => { setModo('aluno'); setErro(''); }}>
                Sou aluno(a)
              </button>
            </div>

            {erro && <div className="error-msg">{erro}</div>}

            {modo === 'treinador' ? (
              <form onSubmit={loginTreinador}>
                <label>Senha</label>
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoFocus />
                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 16 }} disabled={enviando}>
                  {enviando ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
            ) : (
              <form onSubmit={loginAluno}>
                <label>Usuário</label>
                <input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoFocus />
                <label>Senha</label>
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 16 }} disabled={enviando}>
                  {enviando ? 'Entrando...' : 'Entrar'}
                </button>
                <p className="subtitle" style={{ marginTop: 12, marginBottom: 0 }}>
                  Não sabe seu usuário e senha? Peça pra sua treinadora.
                </p>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
