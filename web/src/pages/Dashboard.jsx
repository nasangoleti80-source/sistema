import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, mesAtual, formatarMoeda, formatarMesLabel as formatarMes, somarMes } from '../api.js';

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
      <h1>Resumo do mês</h1>
      <p className="subtitle">Visão geral de aulas e pagamentos</p>

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

          {dados.semCobrancaGerada > 0 && (
            <div className="card">
              <div className="row">
                <span>{dados.semCobrancaGerada} aluno(s) sem cobrança gerada este mês</span>
                <Link to="/pagamentos"><button className="btn-primary btn-small">Resolver</button></Link>
              </div>
            </div>
          )}

          <h2>Por aluno</h2>
          <div className="card">
            {dados.porAluno.length === 0 && <p className="empty">Nenhum aluno ativo cadastrado.</p>}
            {dados.porAluno.map((item) => (
              <div className="list-item" key={item.alunoId}>
                <div>
                  <div className="name">{item.nome}</div>
                  <div className="meta">
                    {item.aulasRealizadas} aula(s) realizada(s)
                    {item.faltas > 0 && ` · ${item.faltas} falta(s)`}
                  </div>
                </div>
                <span className={`badge ${item.pagamento ? item.pagamento.status : 'sem-cobranca'}`}>
                  {item.pagamento ? STATUS_LABEL[item.pagamento.status] : 'Sem cobrança'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
