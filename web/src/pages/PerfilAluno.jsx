import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  api, mesAtual, formatarMoeda, formatarData, TIPOS_ALUNO, PERIODICIDADES,
} from '../api.js';

function iniciais(nome) {
  return nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

function calcularStreak(registros) {
  const dias = [...new Set(registros.map((r) => r.data))].sort().reverse();
  if (!dias.length) return 0;
  let streak = 1;
  for (let i = 0; i < dias.length - 1; i++) {
    const diff = Math.round((new Date(dias[i]) - new Date(dias[i + 1])) / 86400000);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

function AcaoRapida({ to, onClick, icone, titulo, sub }) {
  const conteudo = (
    <>
      <span className="acao-rapida-icone">{icone}</span>
      <div className="acao-rapida-titulo">{titulo}</div>
      {sub && <div className="acao-rapida-sub">{sub}</div>}
    </>
  );
  if (to) return <Link to={to} className="acao-rapida">{conteudo}</Link>;
  return <button type="button" className="acao-rapida" onClick={onClick}>{conteudo}</button>;
}

export default function PerfilAluno() {
  const { alunoId } = useParams();
  const [aluno, setAluno] = useState(null);
  const [treinos, setTreinos] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [pacotes, setPacotes] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    try {
      const [a, t, r, p, av] = await Promise.all([
        api.obterAluno(alunoId),
        api.listarTreinos(alunoId),
        api.listarRegistrosTreino({ alunoId }),
        api.listarPacotes(alunoId),
        api.listarAvaliacoes(alunoId),
      ]);
      setAluno(a);
      setTreinos(t);
      setRegistros(r);
      setPacotes(p);
      setAvaliacoes(av);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, [alunoId]);

  async function copiarLinkPortal() {
    const link = `${window.location.origin}/portal/${alunoId}`;
    try {
      await navigator.clipboard.writeText(link);
      alert(`Link copiado!\n${link}`);
    } catch {
      prompt('Copie o link de acesso do aluno:', link);
    }
  }

  if (carregando) return <p className="empty">Carregando...</p>;
  if (erro) return <p className="empty">{erro}</p>;
  if (!aluno) return <p className="empty">Aluno não encontrado.</p>;

  const mes = mesAtual();
  const registrosDoMes = registros.filter((r) => r.data.startsWith(mes));
  const treinosAtivos = treinos.filter((t) => t.ativo).length;
  const volumeNoMes = registrosDoMes.reduce((s, r) => s + (r.volumeTotal || 0), 0);
  const streak = calcularStreak(registros);
  const proximoPacote = [...pacotes].sort((a, b) => (a.dataVencimento < b.dataVencimento ? -1 : 1))[0];
  const ultimasAvaliacoes = avaliacoes.slice(0, 3);

  return (
    <div>
      <Link to="/alunos">&larr; Voltar para alunos</Link>

      <div className="card perfil-header" style={{ marginTop: 10 }}>
        <div className="avatar-aluno">{iniciais(aluno.nome)}</div>
        <div style={{ flex: 1 }}>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <h1 style={{ margin: 0 }}>{aluno.nome}</h1>
            <span className={`badge ${aluno.ativo ? 'pago' : 'sem-cobranca'}`}>{aluno.ativo ? 'Ativo' : 'Inativo'}</span>
          </div>
          <div className="meta">{aluno.email || 'sem e-mail cadastrado'}</div>
          <div className="meta">Desde {formatarData(aluno.dataInicio)}</div>
          <div className="meta">
            {TIPOS_ALUNO[aluno.tipo]} · {formatarMoeda(aluno.valorMensal)} ({PERIODICIDADES[aluno.periodicidade] || 'Mensal'})
          </div>
        </div>
      </div>

      <div className="grid-stats" style={{ marginTop: 12 }}>
        <div className="stat">
          <div className="value">{treinosAtivos}</div>
          <div className="label">Treinos atribuídos</div>
        </div>
        <div className="stat green">
          <div className="value">{registrosDoMes.length}</div>
          <div className="label">Concluídos no mês</div>
        </div>
        <div className="stat">
          <div className="value">{volumeNoMes}kg</div>
          <div className="label">Volume total no mês</div>
        </div>
        <div className="stat amber">
          <div className="value">{streak}</div>
          <div className="label">Streak atual (dias)</div>
        </div>
      </div>

      <h2>Ações rápidas</h2>
      <div className="acoes-rapidas">
        <AcaoRapida to={`/treinos?alunoId=${alunoId}`} icone="🏋️" titulo="Treinos" sub={`${treinosAtivos} ativo(s)`} />
        <AcaoRapida to={`/endurance?alunoId=${alunoId}`} icone="🏃" titulo="Endurance" sub="Corrida e ciclismo" />
        <AcaoRapida to={`/avaliacoes/${alunoId}`} icone="📋" titulo="Avaliação" sub="Anamnese, medidas e fotos" />
        <AcaoRapida to={`/dietas?alunoId=${alunoId}`} icone="🍽" titulo="Dieta" sub="Plano alimentar" />
        <AcaoRapida to={`/pacotes?alunoId=${alunoId}`} icone="💳" titulo="Pacotes" sub={`${pacotes.length} pacote(s)`} />
        <AcaoRapida to={`/mensagens?alunoId=${alunoId}`} icone="💬" titulo="Mensagens" sub="Conversar" />
        <AcaoRapida onClick={copiarLinkPortal} icone="🔗" titulo="Link do aluno" sub="Copiar link" />
      </div>

      <h2>Assinaturas</h2>
      {pacotes.length === 0 ? (
        <div className="card">
          <p className="empty" style={{ padding: '10px 0' }}>Nenhum pacote cadastrado ainda.</p>
          <Link to={`/pacotes?alunoId=${alunoId}&novo=1`}><button className="btn-primary btn-small">+ Criar pacote</button></Link>
        </div>
      ) : (
        <div className="card">
          {pacotes.map((p) => (
            <div className="list-item" key={p.id}>
              <div>
                <div className="name">{p.nomePacote}</div>
                <div className="meta">{formatarMoeda(p.valorTotal)} · vence {formatarData(p.dataVencimento)}</div>
              </div>
              <span className={`badge ${p.status}`}>{p.status}</span>
            </div>
          ))}
        </div>
      )}
      {proximoPacote && proximoPacote.status !== 'pago' && (
        <p className="meta">Próximo vencimento: {formatarData(proximoPacote.dataVencimento)}</p>
      )}

      <h2>Avaliações</h2>
      {ultimasAvaliacoes.length === 0 ? (
        <p className="empty">Nenhuma avaliação registrada ainda.</p>
      ) : (
        <div className="card">
          {ultimasAvaliacoes.map((a) => (
            <Link to={`/avaliacoes/${alunoId}`} key={a.id} className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div>
                <div className="name">{formatarData(a.data)}</div>
                <div className="meta">
                  {a.pesoKg}kg · IMC {a.calculado?.imc ?? '—'}
                  {a.calculado?.percentualGordura != null ? ` · ${a.calculado.percentualGordura}% gordura` : ''}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
