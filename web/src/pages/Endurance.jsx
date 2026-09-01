import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  api, NIVEIS_ENDURANCE, MODALIDADES_ENDURANCE, OBJETIVOS_ENDURANCE,
  PERIODIZACOES_ENDURANCE, DIAS_SEMANA,
} from '../api.js';

const CONFIG_VAZIA = {
  nivel: 'intermediario',
  modalidade: 'corrida',
  objetivoProva: '10k',
  dataProva: '',
  periodizacao: 'linear',
  duracaoSemanas: 12,
  sessoesPorSemana: 4,
  kmInicial: 20,
  kmPico: 50,
  progressaoPercent: 10,
  diaLongao: 'domingo',
  incluirForca: true,
};

export default function Endurance() {
  const [searchParams] = useSearchParams();
  const [alunos, setAlunos] = useState([]);
  const [alunoId, setAlunoId] = useState('');
  const [planos, setPlanos] = useState([]);
  const [expandido, setExpandido] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [gerando, setGerando] = useState(false);
  const [modalIA, setModalIA] = useState(false);
  const [config, setConfig] = useState(CONFIG_VAZIA);

  useEffect(() => {
    api.listarAlunos(true).then((lista) => {
      setAlunos(lista);
      if (lista.length && !alunoId) setAlunoId(searchParams.get('alunoId') || lista[0].id);
    });
  }, []);

  async function carregar(id) {
    setCarregando(true);
    try {
      setPlanos(await api.listarEndurance(id));
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { if (alunoId) carregar(alunoId); }, [alunoId]);

  async function gerarComIA(e) {
    e.preventDefault();
    setErro('');
    setGerando(true);
    try {
      await api.gerarEnduranceIA({ alunoId, configuracao: config });
      setModalIA(false);
      setConfig(CONFIG_VAZIA);
      await carregar(alunoId);
    } catch (e) {
      setErro(e.message);
    } finally {
      setGerando(false);
    }
  }

  async function excluir(plano) {
    if (!confirm(`Excluir o plano "${plano.nome}"?`)) return;
    await api.removerEndurance(plano.id);
    await carregar(alunoId);
  }

  return (
    <div>
      <h1>Endurance</h1>
      <p className="subtitle">Corrida, ciclismo, natação e triathlon — periodização e progressão de volume</p>

      <div className="row" style={{ marginBottom: 12, gap: 8 }}>
        <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)}>
          {alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
        <button className="btn-primary" onClick={() => setModalIA(true)} disabled={!alunoId}>✨ Montar com IA</button>
      </div>

      {erro && <div className="error-msg">{erro}</div>}
      {carregando && <p className="empty">Carregando...</p>}
      {!carregando && planos.length === 0 && <p className="empty">Nenhum plano de endurance cadastrado para este aluno.</p>}

      {planos.map((p) => (
        <div className="card" key={p.id}>
          <div className="row">
            <div>
              <div className="name">{p.nome} {p.geradoPorIA && <span className="badge pago">IA</span>}</div>
              <div className="meta">
                {NIVEIS_ENDURANCE[p.configuracao?.nivel]} · {MODALIDADES_ENDURANCE[p.configuracao?.modalidade]} ·{' '}
                {OBJETIVOS_ENDURANCE[p.configuracao?.objetivoProva]} {p.configuracao?.dataProva && `· prova em ${p.configuracao.dataProva}`} ·{' '}
                {PERIODIZACOES_ENDURANCE[p.configuracao?.periodizacao]} · {p.configuracao?.duracaoSemanas} semanas
              </div>
            </div>
            <button className="btn-secondary btn-small" onClick={() => setExpandido(expandido === p.id ? null : p.id)}>
              {expandido === p.id ? 'Fechar' : 'Ver plano'}
            </button>
          </div>

          {expandido === p.id && (
            <div style={{ marginTop: 12 }}>
              {p.orientacoesGerais && <p className="meta">{p.orientacoesGerais}</p>}
              {(p.semanas || []).map((s, i) => (
                <div key={i} className="card" style={{ background: 'var(--bg)' }}>
                  <div className="name">Semana {s.numero} {s.kmTotal ? `· ${s.kmTotal}km` : ''}</div>
                  {(s.sessoes || []).map((sessao, j) => (
                    <div key={j} className="list-item">
                      <div>
                        <div className="name">{DIAS_SEMANA[sessao.dia] || sessao.dia} — {sessao.tipo}</div>
                        <div className="meta">
                          {sessao.distanciaKm ? `${sessao.distanciaKm}km` : ''} {sessao.ritmo && `· ritmo ${sessao.ritmo}`}
                        </div>
                        {sessao.descricao && <div className="meta">{sessao.descricao}</div>}
                      </div>
                      {sessao.tipo?.toLowerCase().includes('long') && <span className="badge pendente">longão</span>}
                    </div>
                  ))}
                </div>
              ))}
              <button className="btn-danger btn-small" onClick={() => excluir(p)}>Excluir plano</button>
            </div>
          )}
        </div>
      ))}

      {modalIA && (
        <div className="modal-backdrop" onClick={() => !gerando && setModalIA(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>Montar plano de endurance com IA</h1>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={gerarComIA}>
              <label>Nível do atleta</label>
              <select value={config.nivel} onChange={(e) => setConfig({ ...config, nivel: e.target.value })}>
                {Object.entries(NIVEIS_ENDURANCE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>

              <label>Modalidade</label>
              <select value={config.modalidade} onChange={(e) => setConfig({ ...config, modalidade: e.target.value })}>
                {Object.entries(MODALIDADES_ENDURANCE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>

              <label>Objetivo / prova</label>
              <select value={config.objetivoProva} onChange={(e) => setConfig({ ...config, objetivoProva: e.target.value })}>
                {Object.entries(OBJETIVOS_ENDURANCE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>

              <label>Data da prova</label>
              <input type="date" value={config.dataProva} onChange={(e) => setConfig({ ...config, dataProva: e.target.value })} />

              <label>Modelo de periodização</label>
              <select value={config.periodizacao} onChange={(e) => setConfig({ ...config, periodizacao: e.target.value })}>
                {Object.entries(PERIODIZACOES_ENDURANCE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>

              <div className="row" style={{ gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label>Duração (semanas)</label>
                  <input type="number" min="1" value={config.duracaoSemanas} onChange={(e) => setConfig({ ...config, duracaoSemanas: Number(e.target.value) })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Sessões por semana</label>
                  <select value={config.sessoesPorSemana} onChange={(e) => setConfig({ ...config, sessoesPorSemana: Number(e.target.value) })}>
                    {[2, 3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}x</option>)}
                  </select>
                </div>
              </div>

              <div className="row" style={{ gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label>Km inicial (semana)</label>
                  <input type="number" value={config.kmInicial} onChange={(e) => setConfig({ ...config, kmInicial: Number(e.target.value) })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Km pico (semana)</label>
                  <input type="number" value={config.kmPico} onChange={(e) => setConfig({ ...config, kmPico: Number(e.target.value) })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Progressão (%)</label>
                  <input type="number" value={config.progressaoPercent} onChange={(e) => setConfig({ ...config, progressaoPercent: Number(e.target.value) })} />
                </div>
              </div>

              <label>Dia do longão</label>
              <select value={config.diaLongao} onChange={(e) => setConfig({ ...config, diaLongao: e.target.value })}>
                {Object.entries(DIAS_SEMANA).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>

              <label className="checkbox-row" style={{ marginTop: 12 }}>
                <input type="checkbox" checked={config.incluirForca} onChange={(e) => setConfig({ ...config, incluirForca: e.target.checked })} />
                Incluir treino de força específico (estratégico com a corrida)
              </label>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={gerando}>{gerando ? 'Gerando...' : 'Gerar plano'}</button>
                <button type="button" className="btn-secondary" onClick={() => setModalIA(false)} disabled={gerando}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
