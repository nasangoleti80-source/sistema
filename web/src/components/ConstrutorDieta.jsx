import { TIPOS_REFEICAO } from '../api.js';
import EditorItens from './EditorItens.jsx';

// Monta os blocos de refeição de uma dieta ou de um modelo de dieta.
// Cada refeição ativa pode ser montada com itens manuais (com opções de
// troca próprias) OU vinculada a um banco de opções — uma lista de
// refeições completas alternativas (ex: "Opção 02", "Opção 03"...) que o
// aluno escolhe inteira, não alimento por alimento. Vários tipos de
// refeição podem compartilhar o mesmo banco (ex: café da manhã, lanche da
// tarde e jantar com o mesmo cardápio de ~450kcal).
export default function ConstrutorDieta({
  tiposAtivos, onToggleTipo,
  refeicoesPorTipo, onSetItens,
  bancoPorTipo, onSetBanco,
  bancos, catalogo,
}) {
  return (
    <>
      <label>Refeições deste plano</label>
      <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'flex-start', gap: 6 }}>
        {Object.entries(TIPOS_REFEICAO).map(([tipo, label]) => (
          <button type="button" key={tipo}
            className={tiposAtivos.includes(tipo) ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
            onClick={() => onToggleTipo(tipo)}>
            {label}
          </button>
        ))}
      </div>

      {tiposAtivos.map((tipo) => {
        const bancoAtual = bancos.find((b) => b.id === bancoPorTipo[tipo]);
        return (
          <div key={tipo} className="card" style={{ background: 'var(--bg)', marginTop: 12 }}>
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div className="name">{TIPOS_REFEICAO[tipo]}</div>
              <select
                style={{ width: 'auto', flex: '0 0 auto' }}
                value={bancoPorTipo[tipo] || ''}
                onChange={(e) => onSetBanco(tipo, e.target.value || null)}
              >
                <option value="">Montar na hora</option>
                {bancos.map((b) => (
                  <option key={b.id} value={b.id}>📚 {b.nome}</option>
                ))}
              </select>
            </div>

            {bancoAtual ? (
              <p className="meta" style={{ marginTop: 8 }}>
                Vinculado ao banco <strong>{bancoAtual.nome}</strong> — {bancoAtual.opcoes?.length || 0} opção(ões)
                de refeição completa. O aluno escolhe qual usar no portal dele.
              </p>
            ) : (
              <EditorItens
                itens={refeicoesPorTipo[tipo] || []}
                catalogo={catalogo}
                onChange={(itens) => onSetItens(tipo, itens)}
                rotuloItem="Item nesta refeição"
              />
            )}
          </div>
        );
      })}
    </>
  );
}
