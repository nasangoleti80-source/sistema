import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, mesAtual, formatarMoeda, formatarMesLabel as formatarMes, somarMes, formatarData, CANAIS_CAPTACAO } from '../api.js';

const STATUS_LABEL = { pago: 'Pago', pendente: 'Pendente', atrasado: 'Atrasado', sem_cobranca: 'Sem cobrança' };

export default function Dashboard() {
  const [mes, setMes] = useState(mesAtual());
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setCarregando(true);
    api
      .obterDashboard(mes)
      .then(setDados)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [mes]);

  return (
    <div>
      <h1>
        Resumo do <em>mês</em>
      </h1>
      <p className="subtitle">O que entrou, o que ainda falta e quem treinou.</p>

      <div className="month-nav">
        <button onClick={() => setMes(somarMes(mes, -1))}>‹</button>
        <span className="month-label">{formatarMes(mes)}</span>
        <button onClick={() => setMes(somarMes(mes, 1))}>›</button>
      </div>

      {erro && <div className="error-msg">{erro}</div>}
      {carregando && <p className="empty">Carregando...</p>}

      {dados && (
        <>
          <div className="grid-stats">
            <div className="stat green">
              <div className="value">{formatarMoeda(dados.totalRecebido)}</div>
              <div className="label">Recebido</div>
            </div>
            <div className="stat amber">
              <div className="value">{formatarMoeda(dados.totalPendente + dados.totalAtrasado)}</div>
              <div className="label">A receber</div>
            </div>
            <div className="stat">
              <div className="value">{dados.totalAulasRealizadas}</div>
              <div className="label">Aulas realizadas</div>
            </div>
            <div className="stat red">
              <div className="value">{dados.totalFaltas}</div>
              <div className="label">Faltas</div>
            </div>
          </div>

          {dados.aniversariantes?.length > 0 && (
            <div className="card">
              <div className="name">🎂 Aniversários próximos</div>
              {dados.aniversariantes.map((a) => (
                <div className="list-item" key={a.alunoId}>
                  <span>{a.nome}</span>
                  <span className="badge pendente">{a.hoje ? 'Hoje!' : formatarData(a.proximaData)}</span>
                </div>
              ))}
            </div>
          )}

          {dados.treinoStatusPorAluno?.length > 0 && (
            <>
              <h2>Treino no mês</h2>
              <div className="card">
                {dados.treinoStatusPorAluno.map((t) => (
                  <div className="list-item" key={t.alunoId}>
                    <div className="name">{t.nome}</div>
                    <span className={`badge ${t.treinosNoMes > 0 ? 'pago' : 'atrasado'}`}>
                      {t.treinosNoMes > 0 ? `${t.treinosNoMes} treino(s)` : 'Sem treino este mês'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {dados.semCobrancaGerada > 0 && (
            <div className="card">
              <div className="row">
                <span>
                  <strong className="num">{dados.semCobrancaGerada}</strong> aluno(s) ainda sem cobrança gerada neste mês
                </span>
                <Link to="/pagamentos"><button className="btn-primary btn-small">Resolver</button></Link>
              </div>
            </div>
          )}

          <h2>Por aluno</h2>
          <div className="card">
            {dados.porAluno.length === 0 && <p className="empty">Nenhum aluno ativo por enquanto.</p>}
            {dados.porAluno.map((item) => (
              <div className="list-item" key={item.alunoId}>
                <div>
                  <div className="name">{item.nome}</div>
                  <div className="meta">
                    <span className="num">{item.aulasRealizadas}</span> aula(s) realizada(s)
                    {item.faltas > 0 && (
                      <>
                        {' · '}
                        <span className="num">{item.faltas}</span> falta(s)
                      </>
                    )}
                  </div>
                </div>
                <span className={`badge ${item.pagamento ? item.pagamento.status : 'sem-cobranca'}`}>
                  {item.pagamento ? STATUS_LABEL[item.pagamento.status] : 'Sem cobrança'}
                </span>
              </div>
            ))}
          </div>

          {dados.porCanal && Object.keys(dados.porCanal).length > 0 && (
            <>
              <h2>De onde vêm seus alunos</h2>
              <p className="subtitle">Todos os alunos já cadastrados, por canal de entrada.</p>
              <div className="card">
                {Object.entries(dados.porCanal)
                  .sort((a, b) => b[1] - a[1])
                  .map(([canal, qtd]) => (
                    <div className="list-item" key={canal}>
                      <div className="name">{CANAIS_CAPTACAO[canal] || CANAIS_CAPTACAO.nao_informado}</div>
                      <span className="badge sem-cobranca">{qtd}</span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
