import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, TIPOS_ALUNO, CANAIS_CAPTACAO, PERIODICIDADES, formatarMoeda } from '../api.js';

const MESES_PERIODICIDADE = { mensal: 1, bimestral: 2, trimestral: 3, semestral: 6, anual: 12 };

function calcularProximoVencimento(dataInicio, periodicidade) {
  const meses = MESES_PERIODICIDADE[periodicidade];
  if (!dataInicio || !meses) return null;
  const [ano, mes, dia] = dataInicio.split('-').map(Number);
  const data = new Date(ano, mes - 1 + meses, dia);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

function formatarDataBr(dataStr) {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

const FORM_VAZIO = {
  nome: '',
  telefone: '',
  dataInicio: new Date().toISOString().slice(0, 10),
  planoId: '',
  periodicidade: '',
  valorMensal: '',
  diaVencimento: '5',
  tipo: 'presencial_domicilio',
  observacoes: '',
  comoConheceu: 'nao_informado',
  premium: false,
};

export default function Alunos() {
  const [alunos, setAlunos] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [acessoGerado, setAcessoGerado] = useState(null);

  async function carregar() {
    setCarregando(true);
    try {
      const [dados, listaPlanos] = await Promise.all([api.listarAlunos(), api.listarPlanos()]);
      setAlunos(dados);
      setPlanos(listaPlanos);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function escolherPeriodicidade(periodicidade) {
    const plano = planos.find((p) => p.id === form.planoId);
    const preco = plano?.precos[periodicidade];
    setForm((f) => {
      const proximo = calcularProximoVencimento(f.dataInicio, periodicidade);
      return {
        ...f,
        periodicidade,
        valorMensal: preco?.valorCheio != null ? String(preco.valorCheio) : f.valorMensal,
        diaVencimento: proximo ? String(Number(proximo.slice(8, 10))) : f.diaVencimento,
      };
    });
  }

  const planoAtual = planos.find((p) => p.id === form.planoId);
  const proximoVencimentoPrevia = calcularProximoVencimento(form.dataInicio, form.periodicidade);

  function abrirNovo() {
    setEditando(null);
    setForm(FORM_VAZIO);
    setErro('');
    setModalAberto(true);
  }

  function abrirEdicao(aluno) {
    setEditando(aluno);
    setForm({
      nome: aluno.nome,
      telefone: aluno.telefone,
      dataInicio: aluno.dataInicio,
      planoId: aluno.planoId || '',
      periodicidade: aluno.periodicidade || '',
      valorMensal: String(aluno.valorMensal),
      diaVencimento: String(aluno.diaVencimento),
      tipo: aluno.tipo,
      observacoes: aluno.observacoes,
      comoConheceu: aluno.comoConheceu || 'nao_informado',
      premium: Boolean(aluno.premium),
    });
    setErro('');
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      if (editando) {
        await api.atualizarAluno(editando.id, form);
      } else {
        const criado = await api.criarAluno(form);
        setAcessoGerado({ nome: criado.nome, usuario: criado.usuario, senha: criado.senhaGerada });
      }
      setModalAberto(false);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function gerarNovaSenha(aluno) {
    if (!confirm(`Gerar uma nova senha de acesso pra ${aluno.nome}? A senha antiga deixa de funcionar.`)) return;
    const r = await api.redefinirSenhaAluno(aluno.id);
    setAcessoGerado({ nome: aluno.nome, usuario: r.usuario, senha: r.senhaGerada });
    setModalAberto(false);
  }

  async function alternarAtivo(aluno) {
    await api.atualizarAluno(aluno.id, { ativo: !aluno.ativo });
    await carregar();
  }

  async function excluir(aluno) {
    if (!confirm(`Excluir ${aluno.nome}? Isso também apaga o histórico de presença e pagamentos dele.`)) return;
    await api.removerAluno(aluno.id);
    await carregar();
  }

  const listaFiltrada = alunos.filter((a) => mostrarInativos || a.ativo);

  return (
    <div>
      <h1>Alunos</h1>
      <p className="subtitle">Cadastro dos seus clientes</p>

      <Link to="/premium" style={{ textDecoration: 'none' }}>
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="row">
            <div className="name">🔒 Área Premium</div>
            <span className="meta">Gerenciar vídeos ›</span>
          </div>
        </div>
      </Link>

      <Link to="/planos" style={{ textDecoration: 'none' }}>
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="row">
            <div className="name">💰 Planos e preços</div>
            <span className="meta">Gerenciar valores ›</span>
          </div>
        </div>
      </Link>

      <div className="row" style={{ marginBottom: 12 }}>
        <label className="checkbox-row" style={{ margin: 0 }}>
          <input
            type="checkbox"
            checked={mostrarInativos}
            onChange={(e) => setMostrarInativos(e.target.checked)}
          />
          Mostrar inativos
        </label>
        <button className="btn-primary" onClick={abrirNovo}>+ Novo aluno</button>
      </div>

      {carregando && <p className="empty">Carregando...</p>}
      {!carregando && listaFiltrada.length === 0 && (
        <p className="empty">Nenhum aluno cadastrado ainda. Toque em "Novo aluno" para começar.</p>
      )}

      <div className="card">
        {listaFiltrada.map((aluno) => (
          <div className="list-item" key={aluno.id} style={{ flexWrap: 'wrap', gap: 8 }}>
            <div onClick={() => abrirEdicao(aluno)} style={{ cursor: 'pointer', flex: '1 1 200px' }}>
              <div className="name">{aluno.nome} {!aluno.ativo && <span className="badge sem-cobranca">inativo</span>}</div>
              <div className="meta">
                {planos.find((p) => p.id === aluno.planoId)?.nome || TIPOS_ALUNO[aluno.tipo]}
                {aluno.periodicidade && ` · ${PERIODICIDADES[aluno.periodicidade]}`}
                {' · '}{formatarMoeda(aluno.valorMensal)}/mês
                {aluno.proximoVencimento && ` · vence ${formatarDataBr(aluno.proximoVencimento)}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Link to={`/alunos/${aluno.id}/treino`}><button className="btn-secondary btn-small">Treino</button></Link>
              <Link to={`/alunos/${aluno.id}/avaliacao`}><button className="btn-secondary btn-small">Avaliação</button></Link>
              <Link to={`/alunos/${aluno.id}/dieta`}><button className="btn-secondary btn-small">Dieta</button></Link>
              <button className="btn-secondary btn-small" onClick={() => alternarAtivo(aluno)}>
                {aluno.ativo ? 'Pausar' : 'Reativar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalAberto && (
        <div className="modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>{editando ? 'Editar aluno' : 'Novo aluno'}</h1>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={salvar}>
              <label>Nome *</label>
              <input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />

              <label>Telefone (WhatsApp)</label>
              <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 91234-5678" />

              <label>Início do acompanhamento</label>
              <input
                type="date"
                value={form.dataInicio}
                onChange={(e) => {
                  const dataInicio = e.target.value;
                  setForm((f) => ({
                    ...f,
                    dataInicio,
                    diaVencimento: f.periodicidade
                      ? String(Number(calcularProximoVencimento(dataInicio, f.periodicidade)?.slice(8, 10) || f.diaVencimento))
                      : f.diaVencimento,
                  }));
                }}
              />

              <label>Plano</label>
              <select value={form.planoId} onChange={(e) => setForm({ ...form, planoId: e.target.value, periodicidade: '' })}>
                <option value="">Selecione um plano...</option>
                {planos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>

              {form.planoId && (
                <>
                  <label>Periodicidade</label>
                  <select value={form.periodicidade} onChange={(e) => escolherPeriodicidade(e.target.value)}>
                    <option value="">Selecione...</option>
                    {Object.entries(PERIODICIDADES).map(([valor, label]) => {
                      const preco = planoAtual?.precos[valor];
                      const info =
                        preco?.valorCheio != null
                          ? ` — ${formatarMoeda(preco.valorCheio)}${preco.valorDesconto != null ? ` (${formatarMoeda(preco.valorDesconto)} c/ desconto)` : ''}`
                          : '';
                      return (
                        <option key={valor} value={valor}>{label}{info}</option>
                      );
                    })}
                  </select>
                </>
              )}

              {proximoVencimentoPrevia && (
                <p className="meta" style={{ marginTop: 6 }}>
                  Próximo vencimento calculado: <strong>{formatarDataBr(proximoVencimentoPrevia)}</strong>
                </p>
              )}

              <label>Valor mensal (R$)</label>
              <input type="number" min="0" step="0.01" value={form.valorMensal} onChange={(e) => setForm({ ...form, valorMensal: e.target.value })} />

              <label>Dia de vencimento</label>
              <input type="number" min="1" max="28" value={form.diaVencimento} onChange={(e) => setForm({ ...form, diaVencimento: e.target.value })} />

              <label>Tipo de atendimento</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {Object.entries(TIPOS_ALUNO).map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>

              <label>Como conheceu você</label>
              <select value={form.comoConheceu} onChange={(e) => setForm({ ...form, comoConheceu: e.target.value })}>
                {Object.entries(CANAIS_CAPTACAO).map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>

              <label>Observações</label>
              <textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Lesões, objetivos, restrições..." />

              <label className="checkbox-row" style={{ marginTop: 14 }}>
                <input
                  type="checkbox"
                  checked={form.premium}
                  onChange={(e) => setForm({ ...form, premium: e.target.checked })}
                />
                Acesso liberado à Área Premium (vídeos)
              </label>

              {editando && (
                <>
                  <label>Acesso do aluno ao sistema</label>
                  <div className="row" style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 10px' }}>
                    <span style={{ fontSize: 13 }}>Usuário: <strong>{editando.usuario || '—'}</strong></span>
                    <button type="button" className="btn-secondary btn-small" onClick={() => gerarNovaSenha(editando)}>
                      Gerar nova senha
                    </button>
                  </div>
                </>
              )}

              <div className="form-actions">
                <button type="submit" className="btn-primary">Salvar</button>
                <button type="button" className="btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
                {editando && (
                  <button type="button" className="btn-danger" onClick={() => excluir(editando)} style={{ marginLeft: 'auto' }}>
                    Excluir
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {acessoGerado && (
        <div className="modal-backdrop" onClick={() => setAcessoGerado(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>Acesso de {acessoGerado.nome}</h1>
            <p className="subtitle">Envie esses dados pro aluno (por WhatsApp, por exemplo). A senha não fica salva em nenhum outro lugar.</p>
            <div className="card">
              <div className="list-item">
                <span>Usuário</span>
                <strong>{acessoGerado.usuario}</strong>
              </div>
              <div className="list-item">
                <span>Senha</span>
                <strong>{acessoGerado.senha}</strong>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-primary" onClick={() => setAcessoGerado(null)}>Entendi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
