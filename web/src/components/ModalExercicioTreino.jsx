import { useEffect, useId, useState } from 'react';
import { api, GRUPOS_MUSCULARES, METODOS_TREINO, METODOS_TREINO_DESC, configPadraoMetodo } from '../api.js';

function formVazio() {
  return {
    nome: '', grupoMuscular: 'peitoral', series: 3, repeticoes: '8-12',
    descansoSeg: 60, rir: '', metodo: 'convencional', cargaAlvoKg: '', observacao: '',
    config: {},
  };
}

function num(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

// -------------------------------------------------------------- pré-visualizações

function previewDropSet(c) {
  const drops = num(c.numDrops, 0);
  const reducao = num(c.reducaoPercentual, 0);
  const passos = [100];
  for (let i = 0; i < drops; i++) passos.push(Math.max(0, passos[passos.length - 1] - reducao));
  return passos;
}

function previewCluster(c) {
  const clusters = num(c.clusters, 0);
  const reps = num(c.repsPorCluster, 0);
  return { reps: Array(clusters).fill(reps), total: clusters * reps };
}

function previewMyoReps(c) {
  const mini = num(c.maxMiniSeries, 0);
  return { ativacao: num(c.repsAtivacao, 0), miniSeries: Array(mini).fill(num(c.repsMiniSerie, 0)) };
}

// -------------------------------------------------------------- blocos por método

function CampoNumero({ label, valor, onChange, sufixo, min = 0 }) {
  return (
    <div style={{ flex: 1 }}>
      <label>{label}</label>
      <input type="number" min={min} value={valor} onChange={(e) => onChange(e.target.value)} />
      {sufixo && <p className="dica" style={{ marginTop: 2 }}>{sufixo}</p>}
    </div>
  );
}

function BlocoDropSet({ config, setConfig }) {
  const passos = previewDropSet(config);
  return (
    <>
      <div className="row" style={{ gap: 8 }}>
        <CampoNumero label="Séries" valor={config.series} onChange={(v) => setConfig({ ...config, series: v })} />
        <CampoNumero label="Reps" valor={config.repsAlvo} onChange={(v) => setConfig({ ...config, repsAlvo: v })} />
        <CampoNumero label="Nº Drops" valor={config.numDrops} onChange={(v) => setConfig({ ...config, numDrops: v })} />
      </div>
      <div className="row" style={{ gap: 8 }}>
        <CampoNumero label="Redução/Drop (%)" valor={config.reducaoPercentual} onChange={(v) => setConfig({ ...config, reducaoPercentual: v })} />
        <CampoNumero label="Descanso entre séries (s)" valor={config.descansoSeriesSeg} onChange={(v) => setConfig({ ...config, descansoSeriesSeg: v })} />
      </div>
      <label>Peso inicial (kg) — opcional</label>
      <input type="number" min="0" step="0.5" value={config.pesoInicialKg} onChange={(e) => setConfig({ ...config, pesoInicialKg: e.target.value })} />
      <p className="dica">Prévia: {passos.map((p) => `${p}%`).join(' → ')}</p>
    </>
  );
}

function BlocoCluster({ config, setConfig }) {
  const { reps, total } = previewCluster(config);
  return (
    <>
      <div className="row" style={{ gap: 8 }}>
        <CampoNumero label="Séries" valor={config.series} onChange={(v) => setConfig({ ...config, series: v })} />
        <CampoNumero label="Clusters" valor={config.clusters} onChange={(v) => setConfig({ ...config, clusters: v })} />
        <CampoNumero label="Reps/Cluster" valor={config.repsPorCluster} onChange={(v) => setConfig({ ...config, repsPorCluster: v })} />
      </div>
      <div className="row" style={{ gap: 8 }}>
        <CampoNumero label="Pausa intra-cluster (s)" valor={config.pausaIntraClusterSeg} onChange={(v) => setConfig({ ...config, pausaIntraClusterSeg: v })} />
        <CampoNumero label="Descanso entre séries (s)" valor={config.descansoSeriesSeg} onChange={(v) => setConfig({ ...config, descansoSeriesSeg: v })} />
      </div>
      <label>Peso (kg) — opcional</label>
      <input type="number" min="0" step="0.5" value={config.pesoKg} onChange={(e) => setConfig({ ...config, pesoKg: e.target.value })} />
      <p className="dica">
        Prévia: {reps.join(` , ${config.pausaIntraClusterSeg || 0}s , `)} = {total} reps por série
      </p>
    </>
  );
}

function BlocoRestPause({ config, setConfig }) {
  return (
    <>
      <div className="row" style={{ gap: 8 }}>
        <CampoNumero label="Reps alvo (total)" valor={config.repsAlvo} onChange={(v) => setConfig({ ...config, repsAlvo: v })} />
        <CampoNumero label="Pausa (s)" valor={config.pausaSeg} onChange={(v) => setConfig({ ...config, pausaSeg: v })} sufixo="10-20s ideal" />
      </div>
      <p className="dica">Faça até a falha, descanse, repita até completar o total. O aluno faz quantas conseguir a cada bloco.</p>
    </>
  );
}

function BlocoMyoReps({ config, setConfig }) {
  const { ativacao, miniSeries } = previewMyoReps(config);
  return (
    <>
      <div className="row" style={{ gap: 8 }}>
        <CampoNumero label="Reps Ativação" valor={config.repsAtivacao} onChange={(v) => setConfig({ ...config, repsAtivacao: v })} sufixo="Série inicial longa (12-20)" />
        <CampoNumero label="Pausa (s)" valor={config.pausaSeg} onChange={(v) => setConfig({ ...config, pausaSeg: v })} sufixo="3-5 respirações" />
      </div>
      <div className="row" style={{ gap: 8 }}>
        <CampoNumero label="Reps Mini-Séries" valor={config.repsMiniSerie} onChange={(v) => setConfig({ ...config, repsMiniSerie: v })} />
        <CampoNumero label="Máx. Mini-Séries" valor={config.maxMiniSeries} onChange={(v) => setConfig({ ...config, maxMiniSeries: v })} />
      </div>
      <p className="dica">
        Prévia: Ativação {ativacao} reps → {miniSeries.map((r) => `${r} reps`).join(' → ') || '—'}
      </p>
    </>
  );
}

function BlocoSuperSlow({ config, setConfig }) {
  const cadencia = num(config.faseConcentricaSeg) + num(config.faseExcentricaSeg);
  return (
    <>
      <div className="row" style={{ gap: 8 }}>
        <CampoNumero label="Séries" valor={config.series} onChange={(v) => setConfig({ ...config, series: v })} />
        <CampoNumero label="Reps" valor={config.repsAlvo} onChange={(v) => setConfig({ ...config, repsAlvo: v })} />
      </div>
      <div className="row" style={{ gap: 8 }}>
        <CampoNumero label="Fase concêntrica (s)" valor={config.faseConcentricaSeg} onChange={(v) => setConfig({ ...config, faseConcentricaSeg: v })} />
        <CampoNumero label="Fase excêntrica (s)" valor={config.faseExcentricaSeg} onChange={(v) => setConfig({ ...config, faseExcentricaSeg: v })} />
      </div>
      <label>Descanso entre séries (s)</label>
      <input type="number" min="0" value={config.descansoSeg} onChange={(e) => setConfig({ ...config, descansoSeg: e.target.value })} />
      <p className="dica">Cadência: {cadencia}s por repetição. Use 50-70% da carga habitual.</p>
    </>
  );
}

function BlocoNegativo({ config, setConfig }) {
  return (
    <>
      <div className="row" style={{ gap: 8 }}>
        <CampoNumero label="Séries" valor={config.series} onChange={(v) => setConfig({ ...config, series: v })} />
        <CampoNumero label="Reps" valor={config.repsAlvo} onChange={(v) => setConfig({ ...config, repsAlvo: v })} />
      </div>
      <div className="row" style={{ gap: 8 }}>
        <CampoNumero label="Tempo da fase negativa (s)" valor={config.tempoFaseNegativaSeg} onChange={(v) => setConfig({ ...config, tempoFaseNegativaSeg: v })} sufixo="Recomendado: 4-6s" />
        <CampoNumero label="Descanso entre séries (s)" valor={config.descansoSeg} onChange={(v) => setConfig({ ...config, descansoSeg: v })} />
      </div>
      <p className="dica">Subida sempre com ajuda (parceiro ou máquina). O aluno desce a carga de forma lenta e controlada.</p>
    </>
  );
}

function BlocoPiramide({ config, setConfig, decrescente }) {
  const linhas = config.seriesPiramide || [];

  function mudarQtdSeries(delta) {
    const nova = Math.max(2, Math.min(8, linhas.length + delta));
    if (nova === linhas.length) return;
    if (nova > linhas.length) {
      const ultima = linhas[linhas.length - 1] || { reps: 8, cargaKg: 40 };
      setConfig({ ...config, seriesPiramide: [...linhas, { ...ultima }] });
    } else {
      setConfig({ ...config, seriesPiramide: linhas.slice(0, nova) });
    }
  }

  function mudarLinha(i, campo, valor) {
    setConfig({
      ...config,
      seriesPiramide: linhas.map((l, j) => (j === i ? { ...l, [campo]: valor } : l)),
    });
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 8 }}>
        <label style={{ margin: 0 }}>Séries da pirâmide</label>
        <div className="row" style={{ width: 'auto', gap: 8 }}>
          <button type="button" className="btn-secondary btn-small" onClick={() => mudarQtdSeries(-1)}>−</button>
          <span className="num">{linhas.length}</span>
          <button type="button" className="btn-secondary btn-small" onClick={() => mudarQtdSeries(1)}>+</button>
        </div>
      </div>

      {linhas.map((l, i) => {
        const extremo = decrescente ? i === 0 : i === linhas.length - 1;
        const outroExtremo = decrescente ? i === linhas.length - 1 : i === 0;
        return (
          <div className="row" key={i} style={{ gap: 8, marginBottom: 6, alignItems: 'flex-end' }}>
            <span className="numero-exercicio" style={{ flexShrink: 0 }}>{i + 1}</span>
            <div style={{ flex: 1 }}>
              <label>Reps</label>
              <input type="number" min="1" value={l.reps} onChange={(e) => mudarLinha(i, 'reps', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Carga (kg)</label>
              <input type="number" min="0" step="0.5" value={l.cargaKg} onChange={(e) => mudarLinha(i, 'cargaKg', e.target.value)} />
            </div>
            {(extremo || outroExtremo) && (
              <span className={`badge ${extremo ? 'atrasado' : 'sem-cobranca'}`} style={{ flexShrink: 0, marginBottom: 10 }}>
                {extremo ? 'Pesada' : 'Leve'}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}

// O volume/duração da sessão (volumeDoDia, duracaoEstimadaDia) somam
// ex.series/ex.descansoSeg direto — então todo método precisa deixar esses
// dois campos com um valor equivalente, mesmo guardando o resto em `config`.
function derivarSeriesEDescanso(form) {
  const c = form.config || {};
  switch (form.metodo) {
    case 'drop_set':
    case 'cluster':
      return { series: num(c.series, form.series), descansoSeg: num(c.descansoSeriesSeg, form.descansoSeg) };
    case 'super_slow':
    case 'negativo':
      return { series: num(c.series, form.series), descansoSeg: num(c.descansoSeg, form.descansoSeg) };
    case 'rest_pause':
    case 'myo_reps':
      return { series: 1, descansoSeg: num(c.pausaSeg, form.descansoSeg) };
    case 'piramide_crescente':
    case 'piramide_decrescente':
      return { series: (c.seriesPiramide || []).length || form.series, descansoSeg: form.descansoSeg };
    default:
      return { series: form.series, descansoSeg: form.descansoSeg };
  }
}

// Adiciona ou edita um exercício dentro de uma sessão. O nome busca no
// catálogo (foto/vídeo) e, ao bater, já preenche o grupo muscular. Cada
// método de treinamento tem seu próprio bloco de configuração — ao trocar
// de método, os campos voltam para um padrão sensato daquele método.
export default function ModalExercicioTreino({ exercicio, onSalvar, onClose }) {
  const uid = useId();
  const listaId = `exercicios-catalogo-${uid}`;
  const [catalogo, setCatalogo] = useState([]);
  const [form, setForm] = useState(exercicio ? { ...formVazio(), ...exercicio, config: exercicio.config || {} } : formVazio());

  useEffect(() => { api.listarExercicios().then(setCatalogo); }, []);

  function digitarNome(texto) {
    const doCatalogo = catalogo.find((e) => e.nome.toLowerCase() === texto.trim().toLowerCase());
    setForm((f) => ({
      ...f,
      nome: texto,
      grupoMuscular: doCatalogo ? doCatalogo.grupoMuscular : f.grupoMuscular,
    }));
  }

  function mudarMetodo(metodo) {
    setForm((f) => ({ ...f, metodo, config: configPadraoMetodo(metodo) }));
  }

  function setConfig(config) {
    setForm((f) => ({ ...f, config }));
  }

  function salvar(e) {
    e.preventDefault();
    if (!form.nome.trim()) return;
    const derivado = derivarSeriesEDescanso(form);
    onSalvar({
      ...form,
      series: Number(derivado.series) || 1,
      descansoSeg: Number(derivado.descansoSeg) || 60,
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

          <label>Método</label>
          <select value={form.metodo} onChange={(e) => mudarMetodo(e.target.value)}>
            {Object.entries(METODOS_TREINO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <p className="dica">{METODOS_TREINO_DESC[form.metodo]}</p>

          {form.metodo === 'convencional' && (
            <div className="row" style={{ gap: 8 }}>
              <CampoNumero label="Séries" valor={form.series} onChange={(v) => setForm({ ...form, series: v })} min={1} />
              <div style={{ flex: 1 }}>
                <label>Reps</label>
                <input value={form.repeticoes} onChange={(e) => setForm({ ...form, repeticoes: e.target.value })} placeholder="8-12" />
              </div>
              <CampoNumero label="Descanso (s)" valor={form.descansoSeg} onChange={(v) => setForm({ ...form, descansoSeg: v })} />
              <CampoNumero label="RIR" valor={form.rir} onChange={(v) => setForm({ ...form, rir: v })} />
            </div>
          )}

          {form.metodo === 'drop_set' && <BlocoDropSet config={form.config} setConfig={setConfig} />}
          {form.metodo === 'cluster' && <BlocoCluster config={form.config} setConfig={setConfig} />}
          {form.metodo === 'rest_pause' && <BlocoRestPause config={form.config} setConfig={setConfig} />}
          {form.metodo === 'myo_reps' && <BlocoMyoReps config={form.config} setConfig={setConfig} />}
          {form.metodo === 'super_slow' && <BlocoSuperSlow config={form.config} setConfig={setConfig} />}
          {form.metodo === 'negativo' && <BlocoNegativo config={form.config} setConfig={setConfig} />}
          {form.metodo === 'piramide_crescente' && <BlocoPiramide config={form.config} setConfig={setConfig} decrescente={false} />}
          {form.metodo === 'piramide_decrescente' && <BlocoPiramide config={form.config} setConfig={setConfig} decrescente />}

          {form.metodo !== 'piramide_crescente' && form.metodo !== 'piramide_decrescente' && (
            <>
              <label>Carga alvo (kg) — opcional</label>
              <input type="number" min="0" step="0.5" value={form.cargaAlvoKg} onChange={(e) => setForm({ ...form, cargaAlvoKg: e.target.value })} placeholder="Exibida como referência durante a execução do aluno" />
            </>
          )}

          <label>Observação do personal</label>
          <textarea rows={2} value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} placeholder="Ex: caso a lombar tiver dolorida, pode fazer a mudança para..." />

          <div className="form-actions">
            <button type="submit" className="btn-primary">Salvar</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
