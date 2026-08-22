import { useEffect, useState } from 'react';
import { api, mesAtual, formatarMesLabel as formatarMes, somarMes } from '../api.js';

function formatarData(dataStr) {
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}`;
}

const FORM_VAZIO = {
  alunoId: '',
  data: new Date().toISOString().slice(0, 10),
  tipo: 'presencial',
  realizada: true,
  observacao: '',
};

export default function Presenca() {
  const [mes, setMes] = useState(mesAtual());
  const [alunos, setAlunos] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    try {
      const [listaAlunos, listaAulas] = await Promise.all([
        api.listarAlunos('true'),
        api.listarAulas({ mes }),
      ]);
      setAlunos(listaAlunos);
      setAulas(listaAulas);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes]);

  function abrirNovo(alunoId) {
    setForm({ ...FORM_VAZIO, alunoId: alunoId || alunos[0]?.id || '' });
    setErro('');
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      await api.registrarAula(form);
      setModalAberto(false);
      await carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  async function alternarRealizada(aula) {
    await api.atualizarAula(aula.id, { realizada: !aula.realizada });
    await carregar();
  }

  async function excluir(aula) {
    if (!confirm('Remover este registro de aula?')) return;
    await api.removerAula(aula.id);
    await carregar();
  }

  function nomeAluno(id) {
    return alunos.find((a) => a.id === id)?.nome || '(aluno removido)';
  }

  return (
    <div>
      <h1>
        Quem <em>treinou</em>
      </h1>
      <p className="subtitle">Registre a aula assim que ela acontece. No fim do mês a conta já está fechada.</p>

      <div className="month-nav">
        <button onClick={() => setMes(somarMes(mes, -1))}>‹</button>
        <span className="month-label">{formatarMes(mes)}</span>
        <button onClick={() => setMes(somarMes(mes, 1))}>›</button>
      </div>

      {erro && <div className="error-msg">{erro}</div>}
      {carregando && <p className="empty">Carregando...</p>}

      {!carregando && alunos.length === 0 && (
        <p className="empty">Cadastre um aluno na aba Alunos para começar a registrar aula.</p>
      )}

      {!carregando && alunos.length > 0 && (
        <div className="card">
          {alunos.map((aluno) => {
            const doAluno = aulas.filter((a) => a.alunoId === aluno.id);
            const realizadas = doAluno.filter((a) => a.realizada).length;
            return (
              <div className="list-item" key={aluno.id}>
                <div>
                  <div className="name">{aluno.nome}</div>
                  <div className="meta">
                    <span className="num">{realizadas}</span> aula(s) neste mês
                  </div>
                </div>
                <button className="btn-primary btn-small" onClick={() => abrirNovo(aluno.id)}>+ Aula</button>
              </div>
            );
          })}
        </div>
      )}

      {!carregando && aulas.length > 0 && (
        <>
          <h2>Histórico do mês</h2>
          <div className="card">
            {aulas.map((aula) => (
              <div className="list-item" key={aula.id}>
                <div onClick={() => alternarRealizada(aula)} style={{ cursor: 'pointer', flex: 1 }}>
                  <div className="name">
                    <span className="num">{formatarData(aula.data)}</span> · {nomeAluno(aula.alunoId)}
                  </div>
                  <div className="meta">
                    {aula.tipo === 'presencial' ? 'Aula presencial' : 'Ajuste de consultoria'}
                    {' · '}
                    <span className={aula.realizada ? 'badge pago' : 'badge atrasado'}>
                      {aula.realizada ? 'Realizada' : 'Faltou'}
                    </span>
                  </div>
                </div>
                <button className="btn-secondary btn-small" onClick={() => excluir(aula)}>Remover</button>
              </div>
            ))}
          </div>
        </>
      )}

      {modalAberto && (
        <div className="modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1>Registrar aula</h1>
            {erro && <div className="error-msg">{erro}</div>}
            <form onSubmit={salvar}>
              <label>Aluno</label>
              <select value={form.alunoId} onChange={(e) => setForm({ ...form, alunoId: e.target.value })}>
                {alunos.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>

              <label>Data</label>
              <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />

              <label>Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="presencial">Aula presencial</option>
                <option value="consultoria_ajuste">Ajuste de consultoria (vídeo/whats)</option>
              </select>

              <label className="checkbox-row" style={{ marginTop: 14 }}>
                <input type="checkbox" checked={form.realizada} onChange={(e) => setForm({ ...form, realizada: e.target.checked })} />
                Aula foi realizada (desmarque se o aluno faltou)
              </label>

              <label>Observação</label>
              <textarea rows={2} value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} placeholder="Correções feitas, evolução, etc." />

              <div className="form-actions">
                <button type="submit" className="btn-primary">Salvar</button>
                <button type="button" className="btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
