import { useEffect, useState } from 'react';
import { api, TIPOS_ALUNO, PERIODICIDADES, CANAIS_CAPTACAO, calcularVencimentoPlano, formatarMoeda, formatarData, mesAtual, mensagemAcessoPortal, compartilharOuCopiar } from '../api.js';
import { useNavigate } from 'react-router-dom';

const FORM_VAZIO = {
  nome: '',
  telefone: '',
  email: '',
  tipo: 'presencial',
  dietaAvulsa: false,
  valorMensal: '',
  desconto: '',
  periodicidade: 'mensal',
  dataInicio: new Date().toISOString().slice(0, 10),
  observacoes: '',
  comoConheceu: 'nao_informado',
  dataNascimento: '',
  altura: '',
  sexo: 'masculino',
};

export default function Alunos() {
  const navigate = useNavigate();
  const [alunos, setAlunos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [busca, setBusca] = useState('');
  const [pacotes, setPacotes] = useState([]);

  async function carregar() {
    setCarregando(true);
    try {
      const [dados, todosPacotes] = await Promise.all([api.listarAlunos(), api.listarPacotes()]);
      setAlunos(dados);
      setPacotes(todosPacotes);
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
      email: aluno.email || '',
      tipo: aluno.tipo,
      dietaAvulsa: aluno.dietaAvulsa || false,
      valorMensal: String(aluno.valorMensal),
      desconto: aluno.desconto || '',
      periodicidade: aluno.periodicidade || 'mensal',
      dataInicio: aluno.dataInicio,
      observacoes: aluno.observacoes,
      comoConheceu: aluno.comoConheceu || 'nao_informado',
      dataNascimento: aluno.dataNascimento || '',
      altura: aluno.altura ? String(aluno.altura) : '',
      sexo: aluno.sexo || 'masculino',
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
        await api.criarAluno(form);
      }
      setModalAberto(false);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function alternarAtivo(aluno) {
    await api.atualizarAluno(aluno.id, { ativo: !aluno.ativo });
    await carregar();
  }

  async function copiarAcessoPortal(aluno) {
    const texto = mensagemAcessoPortal(aluno, window.location.origin);
    const resultado = await compartilharOuCopiar(texto, `Acesso de ${aluno.nome.split(' ')[0]}`);
    if (resultado === 'copiado') alert(`Copiado! Já pode colar e mandar para ${aluno.nome.split(' ')[0]}.\n\n${texto}`);
  }

  async function excluir(aluno) {
    if (!confirm(`Excluir ${aluno.nome}? Isso também apaga o histórico de presença e pagamentos dele.`)) return;
    await api.removerAluno(aluno.id);
    await carregar();
  }

  const FILTROS_TIPO = {
    todos: () => true,
    presencial: (a) => a.tipo === 'presencial',
    online: (a) => a.tipo === 'consultoria_online',
    semipresencial: (a) => a.tipo === 'consultoria_semipresencial',
    treino_dieta: (a) => a.tipo === 'consultoria_online_treino_dieta',
  };
  function normalizar(texto) {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }
  const buscaNormalizada = normalizar(busca).trim();
  const listaFiltrada = alunos.filter(
    (a) =>
      (mostrarInativos || a.ativo) &&
      FILTROS_TIPO[filtroTipo](a) &&
      (!buscaNormalizada || normalizar(a.nome).includes(buscaNormalizada) || (a.telefone || '').includes(busca.trim()))
  );
  const mes = mesAtual();
  const pacotesVencendo = pacotes
    .filter((p) => p.dataVencimento?.startsWith(mes))
    .sort((a, b) => (a.dataVencimento < b.dataVencimento ? -1 : 1));

  return (
    <div>
      <h1>Alunos</h1>
      <p className="subtitle">Cadastro dos seus clientes</p>

      {pacotesVencendo.length > 0 && (
        <div className="card">
          <div className="name" style={{ marginBottom: 8 }}>Pacotes vencendo este mês</div>
          {pacotesVencendo.map((p) => {
            const aluno = alunos.find((a) => a.id === p.alunoId);
            return (
              <div className="list-item" key={p.id}>
                <div onClick={() => aluno && navigate(`/alunos/${aluno.id}`)} style={{ cursor: aluno ? 'pointer' : 'default', flex: 1 }}>
                  <div className="name">{aluno?.nome || 'Aluno removido'}</div>
                  <div className="meta">{p.nomePacote} · {formatarMoeda(p.valorTotal)} · vence {formatarData(p.dataVencimento)}</div>
                </div>
                <span className={`badge ${p.status}`}>{p.status}</span>
              </div>
            );
          })}
        </div>
      )}

      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="🔎 Buscar aluno por nome ou telefone..."
        style={{ marginBottom: 12 }}
      />

      <div className="row" style={{ gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          ['todos', 'Todos'],
          ['presencial', 'Presencial'],
          ['online', 'Online'],
          ['semipresencial', 'Semipresencial'],
          ['treino_dieta', 'Treino + Dieta'],
        ].map(([valor, rotulo]) => (
          <button
            key={valor}
            type="button"
            className={filtroTipo === valor ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
            onClick={() => setFiltroTipo(valor)}
          >
            {rotulo}
          </button>
        ))}
      </div>

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
        <p className="empty">
          {alunos.length === 0
            ? 'Nenhum aluno cadastrado ainda. Toque em "Novo aluno" para começar.'
            : 'Nenhum aluno encontrado com esse filtro/busca.'}
        </p>
      )}

      <div className="card">
        {listaFiltrada.map((aluno) => (
          <div className="list-item" key={aluno.id}>
            <div onClick={() => navigate(`/alunos/${aluno.id}`)} style={{ cursor: 'pointer', flex: 1 }}>
              <div className="name">{aluno.nome} {!aluno.ativo && <span className="badge sem-cobranca">inativo</span>}</div>
              <div className="meta">
                {TIPOS_ALUNO[aluno.tipo]}{aluno.dietaAvulsa && ' + dieta avulsa'} · {formatarMoeda(aluno.valorMensal)} ({PERIODICIDADES[aluno.periodicidade] || 'Mensal'})
                {aluno.dataVencimento && ` · vence ${formatarData(aluno.dataVencimento)}`}
                {aluno.idade != null && ` · ${aluno.idade} anos`}
                {aluno.altura ? ` · ${aluno.altura}cm` : ''}
              </div>
            </div>
            <button className="btn-secondary btn-small" onClick={() => abrirEdicao(aluno)}>
              Editar
            </button>
            <button className="btn-secondary btn-small" onClick={() => copiarAcessoPortal(aluno)}>
              Acesso do aluno
            </button>
            <button className="btn-secondary btn-small" onClick={() => alternarAtivo(aluno)}>
              {aluno.ativo ? 'Pausar' : 'Reativar'}
            </button>
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

              <label>E-mail</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="aluno@email.com" />

              <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <label>Data de nascimento</label>
                  <input type="date" value={form.dataNascimento} onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Altura (cm)</label>
                  <input type="number" min="0" value={form.altura} onChange={(e) => setForm({ ...form, altura: e.target.value })} placeholder="175" />
                </div>
              </div>

              <label>Sexo (para cálculo de composição corporal)</label>
              <select value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>

              <div className="row" style={{ gap: 10, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label>Tipo de atendimento</label>
                  <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                    {Object.entries(TIPOS_ALUNO).map(([valor, label]) => (
                      <option key={valor} value={valor}>{label}</option>
                    ))}
                  </select>
                </div>
                <label className="checkbox-row" style={{ flexShrink: 0, marginBottom: 10 }}>
                  <input
                    type="checkbox"
                    checked={form.dietaAvulsa}
                    onChange={(e) => setForm({ ...form, dietaAvulsa: e.target.checked })}
                  />
                  Comprou a dieta à parte
                </label>
              </div>

              <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <label>Valor (R$)</label>
                  <input type="number" min="0" step="0.01" value={form.valorMensal} onChange={(e) => setForm({ ...form, valorMensal: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Desconto / Black Friday</label>
                  <input value={form.desconto} onChange={(e) => setForm({ ...form, desconto: e.target.value })} placeholder="Ex: 10% Black Friday" />
                </div>
              </div>

              <label>Periodicidade do plano</label>
              <select value={form.periodicidade} onChange={(e) => setForm({ ...form, periodicidade: e.target.value })}>
                {Object.entries(PERIODICIDADES).map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>

              <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <label>Início do acompanhamento</label>
                  <input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Vencimento (calculado)</label>
                  <input value={formatarData(calcularVencimentoPlano(form.dataInicio, form.periodicidade))} disabled />
                </div>
              </div>

              <label>Como conheceu você</label>
              <select value={form.comoConheceu} onChange={(e) => setForm({ ...form, comoConheceu: e.target.value })}>
                {Object.entries(CANAIS_CAPTACAO).map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>

              <label>Observações</label>
              <textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Lesões, objetivos, restrições..." />

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
    </div>
  );
}
