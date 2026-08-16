import { useEffect, useState } from 'react';
import { api, TIPOS_ALUNO, formatarMoeda } from '../api.js';

const FORM_VAZIO = {
  nome: '',
  telefone: '',
  tipo: 'presencial_domicilio',
  valorMensal: '',
  diaVencimento: '5',
  dataInicio: new Date().toISOString().slice(0, 10),
  observacoes: '',
};

export default function Alunos() {
  const [alunos, setAlunos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(false);

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
          <div className="list-item" key={aluno.id}>
            <div onClick={() => abrirEdicao(aluno)} style={{ cursor: 'pointer', flex: 1 }}>
              <div className="name">{aluno.nome} {!aluno.ativo && <span className="badge sem-cobranca">inativo</span>}</div>
              <div className="meta">{TIPOS_ALUNO[aluno.tipo]} · {formatarMoeda(aluno.valorMensal)}/mês</div>
            </div>
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
