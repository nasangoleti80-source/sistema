import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  api, OBJETIVOS_TREINO, TIPOS_PERIODIZACAO, NIVEIS_ALUNO, DIVISOES_TREINO,
  DURACOES_SESSAO, SEMANAS_MESOCICLO, MODALIDADES_TREINO, OPCOES_AEROBIO, GRUPOS_MUSCULARES,
} from '../api.js';

const CONFIG_VAZIA = {
  objetivo: 'hipertrofia',
  tipoPeriodizacao: 'linear',
  nivel: 'intermediario',
  diasPorSemana: 3,
  divisao: 'ABC',
  duracaoSessaoMin: 60,
  semanasMesociclo: 4,
  modalidade: 'musculacao',
  aerobio: 'automatico',
  enfaseMuscular: [],
};

export default function Treinos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [alunos, setAlunos] = useState([]);
  const [alunoId, setAlunoId] = useState('');
  const [treinos, setTreinos] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [modalNovo, setModalNovo] = useState(false);

  useEffect(() => {
    api.listarAlunos(true).then((lista) => {
      setAlunos(lista);
      if (lista.length && !alunoId) setAlunoId(searchParams.get('alunoId') || lista[0].id);
    });
  }, []);

  async function carregar(id) {
    setCarregando(true);
    try {
      const [t, r] = await Promise.all([api.listarTreinos(id), api.listarRegistrosTreino({ alunoId: id })]);
      setTreinos(t);
      setRegistros(r);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { if (alunoId) carregar(alunoId); }, [alunoId]);

  async function excluir(treino) {
    if (!confirm(`Excluir o treino "${treino.nome}"?`)) return;
    await api.removerTreino(treino.id);
    await carregar(alunoId);
  }

  function ultimoTreinoData(treinoId) {
    const doTreino = registros.filter((r) => r.treinoId === treinoId).sort((a, b) => (a.data < b.data ? 1 : -1));
    return doTreino[0]?.data || null;
  }

  function totalExercicios(treino) {
    return (treino.dias || []).reduce((s, d) => s + (d.exercicios || []).length, 0);
  }

  return (
    <div>
      <h1>Treinos</h1>
      <p className="subtitle">Programas de treino do aluno</p>

      <div className="row" style={{ marginBottom: 12, gap: 8 }}>
        <select value={alunoId} onChange={(e) => setAlunoId(e.target.value)}>
          {alunos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
      </div>

      {erro && <div className="error-msg">{erro}</div>}
      {carregando && <p className="empty">Carregando...</p>}
      {!carregando && treinos.length === 0 && <p className="empty">Nenhum treino cadastrado para este aluno.</p>}

      {treinos.map((t) => {
        const ultima = ultimoTreinoData(t.id);
        return (
          <div className="card programa-card" key={t.id} onClick={() => navigate(`/treinos/${t.id}`)}>
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <span className="programa-icone">🏋️</span>
              <div style={{ flex: 1 }}>
                <div className="name">{t.nome}</div>
                <div className="meta">🏋️ {totalExercicios(t)} exercícios</div>
                <div className="meta">🕐 Último treino: {ultima ? new Date(ultima).toLocaleDateString('pt-BR') : '—'}</div>
              </div>
              <span className={`badge ${t.ativo ? 'pago' : 'sem-cobranca'}`}>{t.ativo ? 'Ativo' : 'Inativo'}</span>
            </div>
          </div>
        );
      })}

      <button className="fab" onClick={() => setModalNovo(true)} disabled={!alunoId} aria-label="Novo treino">+</button>

      {modalNovo && (
        <ModalNovoTreino
          alunoId={alunoId}
          onClose={() => setModalNovo(false)}
          onCriado={async (treino) => {
            setModalNovo(false);
            await carregar(alunoId);
            if (treino) navigate(`/treinos/${treino.id}`);
          }}
          onIrEndurance={() => navigate(`/endurance?alunoId=${alunoId}`)}
        />
      )}
    </div>
  );
}

function ModalNovoTreino({ alunoId, onClose, onCriado, onIrEndurance }) {
  const [modo, setModo] = useState(null); // 'personalizado' | 'ia'
  const [nome, setNome] = useState('');
  const [config, setConfig] = useState(CONFIG_VAZIA);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  function alternarEnfase(grupo) {
    setConfig((c) => {
      const atual = c.enfaseMuscular;
      if (atual.includes(grupo)) return { ...c, enfaseMuscular: atual.filter((g) => g !== grupo) };
      if (atual.length >= 3) return c;
      return { ...c, enfaseMuscular: [...atual, grupo] };
    });
  }

  async function criarPersonalizado(e) {
    e.preventDefault();
    if (!nome.trim()) return;
    setSalvando(true);
    setErro('');
    try {
      const treino = await api.criarTreino({ alunoId, nome, configuracao: {}, dias: [] });
      onCriado(treino);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function gerarComIA(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const treino = await api.gerarTreinoIA({ alunoId, configuracao: config });
      onCriado(treino);
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={() => !salvando && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h1>Criar novo treino</h1>
        {erro && <div className="error-msg">{erro}</div>}

        {!modo && (
          <div className="escolha-tipo-treino">
            <button type="button" className="escolha-card" onClick={() => setModo('personalizado')}>
              <span className="escolha-icone">+</span>
              <div className="name">Personalizado</div>
              <div className="meta">Criar manual</div>
            </button>
            <button type="button" className="escolha-card destaque" onClick={() => setModo('ia')}>
              <span className="escolha-icone">✨</span>
              <div className="name">Periodização</div>
              <div className="meta">Musculação auto (IA)</div>
            </button>
            <button type="button" className="escolha-card" onClick={onIrEndurance}>
              <span className="escolha-icone">🏃</span>
              <div className="name">Endurance</div>
              <div className="meta">Corrida, bike, natação</div>
            </button>
          </div>
        )}

        {modo === 'personalizado' && (
          <form onSubmit={criarPersonalizado}>
            <label>Nome do treino</label>
            <input required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Treino Setembro 2026" autoFocus />
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={salvando}>{salvando ? 'Criando...' : 'Criar e adicionar sessões'}</button>
              <button type="button" className="btn-secondary" onClick={() => setModo(null)}>Voltar</button>
            </div>
          </form>
        )}

        {modo === 'ia' && (
          <form onSubmit={gerarComIA}>
            <label>Objetivo</label>
            <select value={config.objetivo} onChange={(e) => setConfig({ ...config, objetivo: e.target.value })}>
              {Object.entries(OBJETIVOS_TREINO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>

            <label>Tipo de periodização</label>
            <select value={config.tipoPeriodizacao} onChange={(e) => setConfig({ ...config, tipoPeriodizacao: e.target.value })}>
              {Object.entries(TIPOS_PERIODIZACAO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>

            <label>Nível do cliente</label>
            <select value={config.nivel} onChange={(e) => setConfig({ ...config, nivel: e.target.value })}>
              {Object.entries(NIVEIS_ALUNO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>

            <div className="row" style={{ gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label>Dias por semana</label>
                <input type="number" min="1" max="7" value={config.diasPorSemana} onChange={(e) => setConfig({ ...config, diasPorSemana: Number(e.target.value) })} />
              </div>
              <div style={{ flex: 1 }}>
                <label>Divisão</label>
                <select value={config.divisao} onChange={(e) => setConfig({ ...config, divisao: e.target.value })}>
                  {Object.entries(DIVISOES_TREINO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="row" style={{ gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label>Duração da sessão (min)</label>
                <select value={config.duracaoSessaoMin} onChange={(e) => setConfig({ ...config, duracaoSessaoMin: Number(e.target.value) })}>
                  {DURACOES_SESSAO.map((d) => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label>Semanas do mesociclo</label>
                <select value={config.semanasMesociclo} onChange={(e) => setConfig({ ...config, semanasMesociclo: Number(e.target.value) })}>
                  {SEMANAS_MESOCICLO.map((s) => <option key={s} value={s}>{s} semanas</option>)}
                </select>
              </div>
            </div>

            <label>Modalidade</label>
            <select value={config.modalidade} onChange={(e) => setConfig({ ...config, modalidade: e.target.value })}>
              {Object.entries(MODALIDADES_TREINO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>

            <label>Aeróbio</label>
            <select value={config.aerobio} onChange={(e) => setConfig({ ...config, aerobio: e.target.value })}>
              {Object.entries(OPCOES_AEROBIO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>

            <label>Ênfase muscular principal (até 3)</label>
            <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'flex-start', gap: 6 }}>
              {Object.entries(GRUPOS_MUSCULARES).map(([v, l]) => (
                <button type="button" key={v}
                  className={config.enfaseMuscular.includes(v) ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
                  onClick={() => alternarEnfase(v)}>
                  {l}
                </button>
              ))}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={salvando}>{salvando ? 'Gerando...' : 'Gerar treino'}</button>
              <button type="button" className="btn-secondary" onClick={() => setModo(null)} disabled={salvando}>Voltar</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
