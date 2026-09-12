import { nanoid } from 'nanoid';

// Catálogo padrão de musculação — os exercícios mais comuns de academia,
// por grupo muscular. Idempotente por nome: um redeploy não duplica quem
// já está lá, só acrescenta quem falta (permite a treinadora excluir ou
// renomear um item sem ele voltar sozinho no próximo boot).
const EXERCICIOS_PADRAO = [
  // peitoral
  ['Supino reto com barra', 'peitoral'],
  ['Supino reto com halteres', 'peitoral'],
  ['Supino inclinado com barra', 'peitoral'],
  ['Supino inclinado com halteres', 'peitoral'],
  ['Supino declinado', 'peitoral'],
  ['Crucifixo reto com halteres', 'peitoral'],
  ['Crucifixo inclinado com halteres', 'peitoral'],
  ['Crossover (polia alta)', 'peitoral'],
  ['Peck deck (voador)', 'peitoral'],

  // dorsais
  ['Puxada frente (pulley)', 'dorsais'],
  ['Puxada aberta', 'dorsais'],
  ['Remada curvada com barra', 'dorsais'],
  ['Remada cavalinho (T-bar)', 'dorsais'],
  ['Remada baixa (cabo sentado)', 'dorsais'],
  ['Remada unilateral com halter (serrote)', 'dorsais'],
  ['Barra fixa (pull-up)', 'dorsais'],
  ['Pull-over com halter', 'dorsais'],
  ['Puxada triângulo', 'dorsais'],

  // trapézio
  ['Encolhimento de ombros com barra', 'trapezio'],
  ['Encolhimento de ombros com halteres', 'trapezio'],
  ['Remada alta (upright row)', 'trapezio'],
  ['Face pull', 'trapezio'],
  ['Levantamento terra', 'trapezio'],

  // lombar
  ['Extensão lombar (banco romano)', 'lombar'],
  ['Hiperextensão com peso', 'lombar'],
  ['Good morning', 'lombar'],
  ['Superman no solo', 'lombar'],

  // deltoide anterior
  ['Desenvolvimento militar com barra', 'deltoide_anterior'],
  ['Desenvolvimento com halteres', 'deltoide_anterior'],
  ['Elevação frontal com halteres', 'deltoide_anterior'],
  ['Elevação frontal com barra', 'deltoide_anterior'],
  ['Desenvolvimento Arnold', 'deltoide_anterior'],

  // deltoide medial
  ['Elevação lateral com halteres', 'deltoide_medial'],
  ['Elevação lateral na polia', 'deltoide_medial'],
  ['Desenvolvimento na máquina', 'deltoide_medial'],
  ['Elevação lateral unilateral em pé', 'deltoide_medial'],

  // deltoide posterior
  ['Crucifixo invertido (peck deck)', 'deltoide_posterior'],
  ['Elevação posterior com halteres (inclinado)', 'deltoide_posterior'],
  ['Crucifixo invertido na polia', 'deltoide_posterior'],
  ['Remada aberta', 'deltoide_posterior'],

  // bíceps
  ['Rosca direta com barra', 'biceps'],
  ['Rosca alternada com halteres', 'biceps'],
  ['Rosca Scott', 'biceps'],
  ['Rosca martelo', 'biceps'],
  ['Rosca concentrada', 'biceps'],
  ['Rosca 21', 'biceps'],
  ['Rosca no cabo', 'biceps'],

  // tríceps
  ['Tríceps pulley (corda)', 'triceps'],
  ['Tríceps pulley (barra reta)', 'triceps'],
  ['Tríceps testa com barra', 'triceps'],
  ['Tríceps francês com halter', 'triceps'],
  ['Mergulho no banco (dip)', 'triceps'],
  ['Tríceps coice (kickback)', 'triceps'],
  ['Supino fechado', 'triceps'],

  // antebraço
  ['Rosca de punho', 'antebraco'],
  ['Rosca de punho inversa', 'antebraco'],
  ['Rosca inversa com barra', 'antebraco'],
  ['Farmer’s walk', 'antebraco'],

  // quadríceps
  ['Agachamento livre com barra', 'quadriceps'],
  ['Leg press 45°', 'quadriceps'],
  ['Cadeira extensora', 'quadriceps'],
  ['Agachamento hack', 'quadriceps'],
  ['Afundo (passada)', 'quadriceps'],
  ['Agachamento búlgaro', 'quadriceps'],
  ['Agachamento no smith', 'quadriceps'],

  // isquiotibiais
  ['Mesa flexora', 'isquiotibiais'],
  ['Stiff com barra', 'isquiotibiais'],
  ['Cadeira flexora', 'isquiotibiais'],
  ['Levantamento terra romeno', 'isquiotibiais'],
  ['Flexora em pé unilateral', 'isquiotibiais'],

  // glúteo
  ['Elevação pélvica (hip thrust)', 'gluteo'],
  ['Agachamento sumô', 'gluteo'],
  ['Cadeira abdutora', 'gluteo'],
  ['Coice na polia (quatro apoios)', 'gluteo'],
  ['Passada com halteres', 'gluteo'],
  ['Glute drive (máquina)', 'gluteo'],

  // adutor
  ['Cadeira adutora', 'adutor'],
  ['Adução de quadril na polia', 'adutor'],

  // panturrilha
  ['Panturrilha em pé (gêmeos)', 'panturrilha'],
  ['Panturrilha sentado', 'panturrilha'],
  ['Panturrilha no leg press', 'panturrilha'],
  ['Panturrilha unilateral com halter', 'panturrilha'],

  // abdômen
  ['Abdominal supra (crunch)', 'abdomen'],
  ['Abdominal infra (elevação de pernas)', 'abdomen'],
  ['Prancha isométrica', 'abdomen'],
  ['Abdominal na polia (crunch cabo)', 'abdomen'],
  ['Abdominal oblíquo (bicicleta)', 'abdomen'],
  ['Abdominal na máquina', 'abdomen'],
  ['Rotação de tronco no cabo (woodchopper)', 'abdomen'],

  // cardio
  ['Esteira', 'cardio'],
  ['Bicicleta ergométrica', 'cardio'],
  ['Elíptico', 'cardio'],
  ['Escada (stairmaster)', 'cardio'],
  ['Remo ergômetro', 'cardio'],
  ['Pular corda', 'cardio'],
];

export async function seedCatalogoExercicios(db) {
  db.data.exercicios ||= [];

  const nomesExistentes = new Set(db.data.exercicios.map((e) => e.nome.toLowerCase()));
  let adicionou = false;

  for (const [nome, grupoMuscular] of EXERCICIOS_PADRAO) {
    if (nomesExistentes.has(nome.toLowerCase())) continue;
    db.data.exercicios.push({
      id: nanoid(10),
      nome,
      grupoMuscular,
      videoUrl: '',
      descricao: '',
      equipamento: '',
      ondeFica: '',
      midia: [],
      createdAt: new Date().toISOString(),
    });
    adicionou = true;
  }

  if (adicionou) await db.write();
}
