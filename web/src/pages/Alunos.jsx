import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, TIPOS_ALUNO, CANAIS_CAPTACAO, formatarMoeda } from '../api.js';

const FORM_VAZIO = {
  nome: '',
  telefone: '',
  tipo: 'presencial_domicilio',
  valorMensal: '',
  diaVencimento: '5',
  dataInicio: new Date().toISOString().slice(0, 10),
  observacoes: '',
  comoConheceu: 'nao_informado',
  premium: false,
};

export default function Alunos() {
  const [alunos, setAlunos] = useState([]);
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
      const dados = await api.listarAlunos();
      setAlunos(dados);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

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
      tipo: aluno.tipo,
      valorMensal: String(aluno.valorMensal),
      diaVencimento: String(aluno.diaVencimento),
      dataInicio: aluno.dataInicio,
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
              <div className="meta">{TIPOS_ALUNO[aluno.tipo]} · {formatarMoeda(aluno.valorMensal)}/mês · {CANAIS_CAPTACAO[aluno.comoConheceu] || CANAIS_CAPTACAO.nao_informado}</div>
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

              <label>Tipo de atendimento</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {Object.entries(TIPOS_ALUNO).map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>

              <label>Valor mensal (R$)</label>
              <input type="number" min="0" step="0.01" value={form.valorMensal} onChange={(e) => setForm({ ...form, valorMensal: e.target.value })} />

              <label>Dia de vencimento</label>
              <input type="number" min="1" max="28" value={form.diaVencimento} onChange={(e) => setForm({ ...form, diaVencimento: e.target.value })} />

              <label>Início do acompanhamento</label>
              <input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />

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
