import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatarMoeda, mesAtual, CANAIS_CAPTACAO } from '../api.js';
import { Modulo } from '../componentes/Modulo.jsx';

export default function GrupoFinanceiro() {
  const [dados, setDados] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const mes = mesAtual();
    Promise.all([
      api.listarAlunos(),
      api.listarPagamentos({ mes }),
      api.listarPacotes(),
      api.obterDashboard(mes).catch(() => null),
    ])
      .then(([alunos, pagamentos, pacotes, dash]) => {
        setDados({ alunos, pagamentos, pacotes });
        setDashboard(dash);
      })
      .catch((e) => setErro(e.message));
  }, []);

  const d = dados;
  const ativos = d ? d.alunos.filter((a) => a.ativo) : [];
  const aReceber = d ? d.pagamentos.filter((p) => p.status !== 'pago').reduce((s, p) => s + p.valor, 0) : 0;

  const ehConsultoria = (tipo) => tipo?.startsWith('consultoria_online') || tipo === 'consultoria_semipresencial';
  const consultoriaEmAtencao = dashboard
    ? ativos.filter((a) => ehConsultoria(a.tipo)).filter((a) => {
        const status = dashboard.treinoStatusPorAluno.find((t) => t.alunoId === a.id);
        const ultimo = status?.ultimoTreinoData;
        const diasSemTreinar = ultimo ? Math.floor((Date.now() - new Date(ultimo)) / 86400000) : null;
        return diasSemTreinar == null || diasSemTreinar >= 7;
      }).length
    : 0;

  const canaisComContagem = dashboard
    ? Object.entries(dashboard.porCanal).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])
    : [];
  const maiorCanal = Math.max(1, ...canaisComContagem.map(([, n]) => n));

  return (
    <div>
      <Link to="/">&larr; Início</Link>
      <h1>Financeiro</h1>
      <p className="subtitle">Cobrança, pacotes, agenda e checklist.</p>

      {erro && <div className="error-msg">{erro}</div>}
      {!d && !erro && <p className="empty">Carregando…</p>}

      {d && (
        <>
          <div className="modulos">
            <Modulo para="/pagamentos" icone="cobranca" nome="Cobrança" oQueE="Mensalidade de cada aluno" contagem={d.pagamentos.filter((p) => p.status !== 'pago').length || null} alerta />
            <Modulo para="/pacotes" icone="pacotes" nome="Pacotes" oQueE="Venda fechada, com parcelas e vencimento" contagem={d.pacotes.length || null} />
          </div>

          <div className="grid-stats" style={{ marginBottom: 12 }}>
            <div className={`stat ${aReceber > 0 ? 'amber' : 'green'}`}>
              <div className="value">{formatarMoeda(aReceber)}</div>
              <div className="label">A receber no mês</div>
            </div>
          </div>

          <h2>Agenda e acompanhamento</h2>
          <div className="modulos">
            <Modulo para="/presenca" icone="presenca" nome="Agenda" oQueE="Quem treinou, quem faltou e as consultas do dia" />
            <Modulo
              para="/saude-consultoria"
              icone="saude"
              nome="Saúde da consultoria"
              oQueE="Vídeo, avaliação, treino/dieta e pacote — sinais automáticos"
              contagem={consultoriaEmAtencao || null}
              alerta={consultoriaEmAtencao > 0}
            />
            <Modulo para="/chamadas" icone="chamada" nome="Chamadas" oQueE="Ligação/vídeo mensal, amarrada ao período do pacote" />
          </div>

          {canaisComContagem.length > 0 && (
            <>
              <h2>De onde vêm os alunos</h2>
              <div className="card">
                <div className="grafico-canais">
                  {canaisComContagem.map(([canal, n]) => (
                    <div key={canal} className="grafico-canal-linha">
                      <div className="grafico-canal-label">{CANAIS_CAPTACAO[canal] || canal}</div>
                      <div className="grafico-canal-trilha">
                        <div className="grafico-canal-fill" style={{ width: `${Math.max(6, (n / maiorCanal) * 100)}%` }} />
                      </div>
                      <div className="grafico-canal-valor num">{n}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
