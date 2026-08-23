import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';

/** Lista de alunos com a contagem de treinos, e os treinos de um aluno. */
export default function Treinos() {
  const { alunoId } = useParams();
  const [alunos, setAlunos] = useState([]);
  const [treinos, setTreinos] = useState([]);
  const [exercicios, setExercicios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [novo, setNovo] = useState('');

  async function carregar() {
    try {
      const [a, t, e] = await Promise.all([
        api.listarAlunos('true'),
        api.listarTreinos(alunoId),
        api.listarExercicios(),
      ]);
      setAlunos(a);
      setTreinos(t);
      setExercicios(e);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    setCarregando(true);
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alunoId]);

  async function criar(e) {
    e.preventDefault();
    setErro('');
    try {
      await api.criarTreino({ alunoId, nome: novo });
      setNovo('');
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  const aluno = alunos.find((a) => a.id === alunoId);

  /* ----------------------------------------- escolher de quem é o treino */
  if (!alunoId) {
    return (
      <div>
        <h1>
          Montar <em>treino</em>
        </h1>
        <p className="subtitle">Escolha de quem é o treino.</p>

        {erro && <div className="error-msg">{erro}</div>}

        {exercicios.length === 0 && !carregando && (
          <div className="card">
            <div className="row">
              <span>Seu catálogo de exercícios está vazio — é dele que o treino é montado.</span>
              <Link to="/exercicios">
                <button className="btn-primary btn-small">Cadastrar</button>
              </Link>
            </div>
          </div>
        )}

        {carregando && <p className="empty">Carregando…</p>}
        {!carregando && alunos.length === 0 && (
          <p className="empty">Nenhum aluno ativo. Cadastre na aba Alunos.</p>
        )}

        {alunos.length > 0 && (
          <div className="card">
            {alunos.map((a) => {
              const meus = treinos.filter((t) => t.alunoId === a.id);
              const ativos = meus.filter((t) => t.ativo).length;
              return (
                <Link className="list-item link-limpo" to={`/treinos/${a.id}`} key={a.id}>
                  <div>
                    <div className="name">{a.nome}</div>
                    <div className="meta">
                      {meus.length === 0 ? (
                        'Sem treino montado'
                      ) : (
                        <>
                          <span className="num">{meus.length}</span> treino(s) ·{' '}
                          <span className="num">{ativos}</span> ativo(s)
                        </>
                      )}
                    </div>
                  </div>
                  <span className="chevron">›</span>
                </Link>
              );
            })}
          </div>
        )}

        <h2>Catálogo</h2>
        <Link to="/exercicios" className="link-limpo">
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="row">
              <div>
                <div className="name">Seus exercícios</div>
                <div className="meta">
                  <span className="num">{exercicios.length}</span> cadastrado(s)
                </div>
              </div>
              <span className="chevron">›</span>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  /* ------------------------------------------------ treinos de um aluno */
  return (
    <div>
      <Link to="/treinos" className="voltar">
        ‹ Todos os alunos
      </Link>
      <h1>
        Treinos de <em>{aluno?.nome.split(' ')[0] || 'aluno'}</em>
      </h1>
      <p className="subtitle">Cada treino tem sessões, e cada sessão tem os exercícios do dia.</p>

      {erro && <div className="error-msg">{erro}</div>}

      <form className="card" onSubmit={criar}>
        <label>Novo treino</label>
        <div className="row">
          <input
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
            placeholder="Corpo inteiro — agosto"
            style={{ flex: 1 }}
            required
          />
          <button type="submit" className="btn-primary" style={{ flexShrink: 0 }}>
            Criar
          </button>
        </div>
      </form>

      {carregando && <p className="empty">Carregando…</p>}
      {!carregando && treinos.length === 0 && (
        <p className="empty">Nenhum treino ainda. Crie o primeiro acima.</p>
      )}

      {treinos.length > 0 && (
        <div className="card">
          {treinos.map((t) => {
            const sessoes = t.sessoes.length;
            const exs = t.sessoes.reduce((s, x) => s + x.itens.length, 0);
            return (
              <Link className="list-item link-limpo" to={`/treinos/programa/${t.id}`} key={t.id}>
                <div>
                  <div className="name">{t.nome}</div>
                  <div className="meta">
                    <span className="num">{sessoes}</span> sessão(ões) ·{' '}
                    <span className="num">{exs}</span> exercício(s)
                  </div>
                </div>
                <span className={`badge ${t.ativo ? 'pago' : 'sem-cobranca'}`}>
                  {t.ativo ? 'Ativo' : 'Guardado'}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
