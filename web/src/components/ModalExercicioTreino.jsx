import { useEffect, useId, useState } from 'react';
import { api, GRUPOS_MUSCULARES, METODOS_TREINO } from '../api.js';

function formVazio() {
  return {
    nome: '', grupoMuscular: 'peitoral', series: 3, repeticoes: '8-12',
    descansoSeg: 60, rir: '', metodo: 'convencional', cargaAlvoKg: '', observacao: '',
  };
}

// Adiciona ou edita um exercício dentro de uma sessão. O nome busca no
// catálogo (foto/vídeo) e, ao bater, já preenche o grupo muscular.
export default function ModalExercicioTreino({ exercicio, onSalvar, onClose }) {
  const uid = useId();
  const listaId = `exercicios-catalogo-${uid}`;
  const [catalogo, setCatalogo] = useState([]);
  const [form, setForm] = useState(exercicio ? { ...formVazio(), ...exercicio } : formVazio());

  useEffect(() => { api.listarExercicios().then(setCatalogo); }, []);

  function digitarNome(texto) {
    const doCatalogo = catalogo.find((e) => e.nome.toLowerCase() === texto.trim().toLowerCase());
    setForm((f) => ({
      ...f,
      nome: texto,
      grupoMuscular: doCatalogo ? doCatalogo.grupoMuscular : f.grupoMuscular,
    }));
  }

  function salvar(e) {
    e.preventDefault();
    if (!form.nome.trim()) return;
    onSalvar({
      ...form,
      series: Number(form.series) || 1,
      descansoSeg: Number(form.descansoSeg) || 60,
      rir: form.rir === '' ? null : Number(form.rir),
      cargaAlvoKg: form.cargaAlvoKg === '' ? null : Number(form.cargaAlvoKg),
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h1>{exercicio ? 'Editar exercício' : 'Novo exercício'}</h1>
        <form onSubmit={salvar}>
          <label>Exercício</label>
          <input
            required list={listaId} value={form.nome}
            onChange={(e) => digitarNome(e.target.value)}
            placeholder="Buscar no catálogo ou digitar..."
          />
          <datalist id={listaId}>
            {catalogo.map((ex) => <option key={ex.id} value={ex.nome} />)}
          </datalist>

          <label>Grupo muscular</label>
          <select value={form.grupoMuscular} onChange={(e) => setForm({ ...form, grupoMuscular: e.target.value })}>
            {Object.entries(GRUPOS_MUSCULARES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>

          <div className="row" style={{ gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label>Séries</label>
              <input type="number" min="1" value={form.series} onChange={(e) => setForm({ ...form, series: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Reps</label>
              <input value={form.repeticoes} onChange={(e) => setForm({ ...form, repeticoes: e.target.value })} placeholder="8-12" />
            </div>
            <div style={{ flex: 1 }}>
              <label>Descanso (s)</label>
              <input type="number" min="0" value={form.descansoSeg} onChange={(e) => setForm({ ...form, descansoSeg: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <label>RIR</label>
              <input type="number" min="0" max="5" value={form.rir} onChange={(e) => setForm({ ...form, rir: e.target.value })} placeholder="0-5" />
            </div>
          </div>

          <label>Método de treinamento</label>
          <select value={form.metodo} onChange={(e) => setForm({ ...form, metodo: e.target.value })}>
            {Object.entries(METODOS_TREINO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>

          <label>Carga alvo (kg) — opcional</label>
          <input type="number" min="0" step="0.5" value={form.cargaAlvoKg} onChange={(e) => setForm({ ...form, cargaAlvoKg: e.target.value })} />

          <label>Observação</label>
          <input value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} />

          <div className="form-actions">
            <button type="submit" className="btn-primary">Salvar</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
