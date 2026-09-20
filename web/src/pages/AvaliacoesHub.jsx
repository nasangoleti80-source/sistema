import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatarData } from '../api.js';

/**
 * Avaliações — porta de entrada própria, separada de Alunos. Mostra o
 * calendário de cada aluno num relance (feitas, faltam, próxima) antes de
 * abrir a ficha detalhada dele.
 */
export default function AvaliacoesHub() {
  const [alunos, setAlunos] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.listarAlunos(true).then(setAlunos).catch((e) => setErro(e.message));
  }, []);

  function resumo(aluno) {
    const cronograma = aluno.cronogramaAvaliacoes || [];
    if (cronograma.length === 0) return { temCalendario: false };
    const feitas = cronograma.filter((c) => c.feito).length;
    const proximaPendente = cronograma.filter((c) => !c.feito).sort((a, b) => (a.data < b.data ? -1 : 1))[0];
    return { temCalendario: true, feitas, total: cronograma.length, proximaPendente };
  }

  const lista = alunos
    ? alunos
        .map((aluno) => ({ aluno, resumo: resumo(aluno) }))
        .sort((a, b) => {
          const da = a.resumo.proximaPendente?.data;
          const db = b.resumo.proximaPendente?.data;
          if (!da && !db) return 0;
          if (!da) return 1;
          if (!db) return -1;
          return da < db ? -1 : 1;
        })
    : [];

  return (
    <div>
      <h1>Avaliações</h1>
      <p className="subtitle">Calendário de avaliação de cada aluno — feitas, faltam e a próxima.</p>

      {erro && <div className="error-msg">{erro}</div>}
      {!alunos && !erro && <p className="empty">Carregando…</p>}
      {alunos && alunos.length === 0 && <p className="empty">Nenhum aluno ativo ainda.</p>}

      {alunos && alunos.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          {lista.map(({ aluno, resumo: r }) => (
            <Link
              to={`/avaliacoes/${aluno.id}`}
              key={aluno.id}
              className="list-item"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="name">{aluno.nome}</div>
                <div className="meta">
                  {r.temCalendario
                    ? `${r.feitas} de ${r.total} feitas · faltam ${r.total - r.feitas}`
                    : 'Sem calendário gerado ainda'}
                </div>
              </div>
              {r.temCalendario && (
                <span className={`badge ${r.proximaPendente ? 'pendente' : 'pago'}`}>
                  {r.proximaPendente ? `próxima ${formatarData(r.proximaPendente.data)}` : 'tudo em dia 🎉'}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
