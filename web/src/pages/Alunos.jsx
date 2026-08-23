import { useEffect, useState } from 'react';
import { api, TIPOS_ALUNO, CANAIS_CAPTACAO, NIVEIS_ATIVIDADE, formatarMoeda } from '../api.js';
import { Link } from 'react-router-dom';

const ANAMNESE_VAZIA = {
  queixasDor: '',
  objetivo: '',
  condicoesSaude: '',
  restricoesMedicas: '',
  medicamentos: '',
  cirurgias: '',
  historicoFamiliar: '',
  nivelAtividade: 'sedentario',
  fumante: false,
  ingereAlcool: false,
  qualidadeSono: 'boa',
  observacoes: '',
};

const FORM_VAZIO = {
  nome: '',
  telefone: '',
  email: '',
  tipo: 'presencial_domicilio',
  valorMensal: '',
  diaVencimento: '5',
  dataInicio: new Date().toISOString().slice(0, 10),
  observacoes: '',
  comoConheceu: 'nao_informado',
  dataNascimento: '',
  altura: '',
  sexo: 'masculino',
  anamnese: ANAMNESE_VAZIA,
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
      email: aluno.email || '',
      tipo: aluno.tipo,
      valorMensal: String(aluno.valorMensal),
      diaVencimento: String(aluno.diaVencimento),
      dataInicio: aluno.dataInicio,
      observacoes: aluno.observacoes,
      comoConheceu: aluno.comoConheceu || 'nao_informado',
      dataNascimento: aluno.dataNascimento || '',
      altura: aluno.altura ? String(aluno.altura) : '',
      sexo: aluno.sexo || 'masculino',
      anamnese: { ...ANAMNESE_VAZIA, ...aluno.anamnese },
    });
    setErro('');
    setModalAberto(true);
  }

  function setAnamnese(campo, valor) {
    setForm((f) => ({ ...f, anamnese: { ...f.anamnese, [campo]: valor } }));
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

  async function copiarLinkPortal(aluno) {
    const link = `${window.location.origin}/portal/${aluno.id}`;
    try {
      await navigator.clipboard.writeText(link);
      alert(`Link copiado!\n${link}`);
    } catch {
      prompt('Copie o link de acesso do aluno:', link);
    }
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
              <div className="meta">
                {TIPOS_ALUNO[aluno.tipo]} · {formatarMoeda(aluno.valorMensal)}/mês
                {aluno.idade != null && ` · ${aluno.idade} anos`}
                {aluno.altura ? ` · ${aluno.altura}cm` : ''}
              </div>
            </div>
            <Link to={`/avaliacoes/${aluno.id}`} className="btn-secondary btn-small" style={{ textDecoration: 'none' }}>
              Avaliar
            </Link>
            <button className="btn-secondary btn-small" onClick={() => copiarLinkPortal(aluno)}>
              Link do aluno
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

              <h2>Anamnese de saúde</h2>

              <label>Objetivo do aluno</label>
              <input value={form.anamnese.objetivo} onChange={(e) => setAnamnese('objetivo', e.target.value)} placeholder="Emagrecimento, hipertrofia, saúde, performance..." />

              <label>Dores / queixas atuais</label>
              <textarea rows={2} value={form.anamnese.queixasDor} onChange={(e) => setAnamnese('queixasDor', e.target.value)} placeholder="Ex: dor lombar ao agachar, dor no ombro direito..." />

              <label>Condições de saúde (doenças, cardiopatias, diabetes...)</label>
              <textarea rows={2} value={form.anamnese.condicoesSaude} onChange={(e) => setAnamnese('condicoesSaude', e.target.value)} />

              <label>Restrições médicas</label>
              <input value={form.anamnese.restricoesMedicas} onChange={(e) => setAnamnese('restricoesMedicas', e.target.value)} />

              <label>Medicamentos em uso</label>
              <input value={form.anamnese.medicamentos} onChange={(e) => setAnamnese('medicamentos', e.target.value)} />

              <label>Cirurgias / lesões anteriores</label>
              <input value={form.anamnese.cirurgias} onChange={(e) => setAnamnese('cirurgias', e.target.value)} />

              <label>Histórico familiar relevante</label>
              <input value={form.anamnese.historicoFamiliar} onChange={(e) => setAnamnese('historicoFamiliar', e.target.value)} />

              <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <label>Nível de atividade atual</label>
                  <select value={form.anamnese.nivelAtividade} onChange={(e) => setAnamnese('nivelAtividade', e.target.value)}>
                    {Object.entries(NIVEIS_ATIVIDADE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label>Qualidade do sono</label>
                  <select value={form.anamnese.qualidadeSono} onChange={(e) => setAnamnese('qualidadeSono', e.target.value)}>
                    <option value="ruim">Ruim</option>
                    <option value="regular">Regular</option>
                    <option value="boa">Boa</option>
                  </select>
                </div>
              </div>

              <div className="row" style={{ gap: 16, marginTop: 10 }}>
                <label className="checkbox-row" style={{ margin: 0 }}>
                  <input type="checkbox" checked={form.anamnese.fumante} onChange={(e) => setAnamnese('fumante', e.target.checked)} />
                  Fumante
                </label>
                <label className="checkbox-row" style={{ margin: 0 }}>
                  <input type="checkbox" checked={form.anamnese.ingereAlcool} onChange={(e) => setAnamnese('ingereAlcool', e.target.checked)} />
                  Ingere álcool
                </label>
              </div>

              <label>Observações gerais da anamnese</label>
              <textarea rows={2} value={form.anamnese.observacoes} onChange={(e) => setAnamnese('observacoes', e.target.value)} />

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
