import { nanoid } from 'nanoid';

// Catálogo padrão de musculação — os exercícios mais comuns de academia,
// por grupo muscular. Idempotente por nome: um redeploy não duplica quem
// já está lá, só acrescenta quem falta (permite a treinadora excluir ou
// renomear um item sem ele voltar sozinho no próximo boot).
const EXERCICIOS_PADRAO = [
  // peitoral
  ['Supino reto com barra', 'peitoral', 'https://www.youtube.com/watch?v=ZN7SuDQpNMk'],
  ['Supino reto com halteres', 'peitoral', 'https://www.youtube.com/watch?v=6V9Ru5It8uk'],
  ['Supino inclinado com barra', 'peitoral', 'https://www.youtube.com/watch?v=F9MQy4_cbZc'],
  ['Supino inclinado com halteres', 'peitoral', 'https://www.youtube.com/watch?v=G-i3jMIbDmo'],
  ['Supino declinado', 'peitoral', 'https://www.youtube.com/watch?v=9XqGE8PNrws'],
  ['Crucifixo reto com halteres', 'peitoral', 'https://www.youtube.com/watch?v=ZjIKUMtW37c'],
  ['Crucifixo inclinado com halteres', 'peitoral', 'https://www.youtube.com/watch?v=MEouME-ymto'],
  ['Crossover (polia alta)', 'peitoral', 'https://www.youtube.com/watch?v=E3aha5zhlc0'],
  ['Peck deck (voador)', 'peitoral', 'https://www.youtube.com/watch?v=FwtqdGlRgig'],

  // dorsais
  ['Puxada frente (pulley)', 'dorsais', 'https://www.youtube.com/watch?v=25XTUWnt_R4'],
  ['Puxada aberta', 'dorsais', 'https://www.youtube.com/watch?v=hTaY3y09eLc'],
  ['Remada curvada com barra', 'dorsais', 'https://www.youtube.com/watch?v=VJHBEy2duVc'],
  ['Remada cavalinho (T-bar)', 'dorsais', 'https://www.youtube.com/watch?v=b-n8m51UIxc'],
  ['Remada baixa (cabo sentado)', 'dorsais', 'https://www.youtube.com/watch?v=5zvxMuf378g'],
  ['Remada unilateral com halter (serrote)', 'dorsais', 'https://www.youtube.com/watch?v=K25eTWoEOWU'],
  ['Barra fixa (pull-up)', 'dorsais', 'https://www.youtube.com/watch?v=oH-NrOccUOg'],
  ['Pull-over com halter', 'dorsais', 'https://www.youtube.com/watch?v=BvL6stDBZfA'],
  ['Puxada triângulo', 'dorsais', 'https://www.youtube.com/watch?v=uAnrJBnxrZ0'],

  // trapézio
  ['Encolhimento de ombros com barra', 'trapezio', 'https://www.youtube.com/watch?v=BrwUPSLC_hE'],
  ['Encolhimento de ombros com halteres', 'trapezio', 'https://www.youtube.com/watch?v=YeILDnoeYEk'],
  ['Remada alta (upright row)', 'trapezio', 'https://www.youtube.com/watch?v=wHCcBLXr1D4'],
  ['Face pull', 'trapezio', 'https://www.youtube.com/watch?v=QVO3jdjaNFg'],
  ['Levantamento terra', 'trapezio', 'https://www.youtube.com/watch?v=QiqUXcz2iyA'],

  // lombar
  ['Extensão lombar (banco romano)', 'lombar', 'https://www.youtube.com/watch?v=kLcjscPyLqI'],
  ['Hiperextensão com peso', 'lombar', 'https://www.youtube.com/watch?v=ds9aX5XGBa0'],
  ['Good morning', 'lombar', 'https://www.youtube.com/watch?v=q4GZN3scJxE'],
  ['Superman no solo', 'lombar', 'https://www.youtube.com/watch?v=rQzF5dMTvaA'],

  // deltoide anterior
  ['Desenvolvimento militar com barra', 'deltoide_anterior', 'https://www.youtube.com/watch?v=ZD3-TjUdiUo'],
  ['Desenvolvimento com halteres', 'deltoide_anterior', 'https://www.youtube.com/watch?v=eufDL9MmF8A'],
  ['Elevação frontal com halteres', 'deltoide_anterior', 'https://www.youtube.com/watch?v=jhxLYSm_P-k'],
  ['Elevação frontal com barra', 'deltoide_anterior', 'https://www.youtube.com/watch?v=o_TwtUgnAmo'],
  ['Desenvolvimento Arnold', 'deltoide_anterior', 'https://www.youtube.com/watch?v=fXY80fcHv4k'],

  // deltoide medial
  ['Elevação lateral com halteres', 'deltoide_medial', 'https://www.youtube.com/watch?v=jannLx4RxKo'],
  ['Elevação lateral na polia', 'deltoide_medial', 'https://www.youtube.com/watch?v=3vbYw9xklBc'],
  ['Desenvolvimento na máquina', 'deltoide_medial', 'https://www.youtube.com/watch?v=Q7K6DI9R-A8'],
  ['Elevação lateral unilateral em pé', 'deltoide_medial', 'https://www.youtube.com/watch?v=oHVhdk7Qi2c'],

  // deltoide posterior
  ['Crucifixo invertido (peck deck)', 'deltoide_posterior', 'https://www.youtube.com/watch?v=DiBL11daWPc'],
  ['Elevação posterior com halteres (inclinado)', 'deltoide_posterior', 'https://www.youtube.com/watch?v=0lY4rVTgES4'],
  ['Crucifixo invertido na polia', 'deltoide_posterior', 'https://www.youtube.com/watch?v=vVDeOaw1T5g'],
  ['Remada aberta', 'deltoide_posterior', 'https://www.youtube.com/watch?v=SLrHk23Es5c'],

  // bíceps
  ['Rosca direta com barra', 'biceps', 'https://www.youtube.com/watch?v=Et1wgGMGW8w'],
  ['Rosca alternada com halteres', 'biceps', 'https://www.youtube.com/watch?v=nAqWZprW4yY'],
  ['Rosca Scott', 'biceps', 'https://www.youtube.com/watch?v=zpTK6eihdSA'],
  ['Rosca martelo', 'biceps', 'https://www.youtube.com/watch?v=0qkQy8V2FC0'],
  ['Rosca concentrada', 'biceps', 'https://www.youtube.com/watch?v=nIUjhJMEmFk'],
  ['Rosca 21', 'biceps', 'https://www.youtube.com/watch?v=zpWEQK4LnuE'],
  ['Rosca no cabo', 'biceps', 'https://www.youtube.com/watch?v=2eeOSoAJdD4'],

  // tríceps
  ['Tríceps pulley (corda)', 'triceps', 'https://www.youtube.com/watch?v=M-DTY40JG9M'],
  ['Tríceps pulley (barra reta)', 'triceps', 'https://www.youtube.com/watch?v=VFa6hd3WdD4'],
  ['Tríceps testa com barra', 'triceps', 'https://www.youtube.com/watch?v=hozeUvcJx0U'],
  ['Tríceps francês com halter', 'triceps', 'https://www.youtube.com/watch?v=0wqNxgIhgaM'],
  ['Mergulho no banco (dip)', 'triceps', 'https://www.youtube.com/watch?v=jH9RXQjbXqs'],
  ['Tríceps coice (kickback)', 'triceps', 'https://www.youtube.com/watch?v=dnyUwaA7Pok'],
  ['Supino fechado', 'triceps', 'https://www.youtube.com/watch?v=yjf114NoPKQ'],

  // antebraço
  ['Rosca de punho', 'antebraco', 'https://www.youtube.com/watch?v=1ZmXT_fpLOI'],
  ['Rosca de punho inversa', 'antebraco', 'https://www.youtube.com/watch?v=MLB7c-yryI8'],
  ['Rosca inversa com barra', 'antebraco', 'https://www.youtube.com/watch?v=CI7zP2ESn4g'],
  ['Farmer’s walk', 'antebraco', 'https://www.youtube.com/watch?v=xb1GMZacM8w'],

  // quadríceps
  ['Agachamento livre com barra', 'quadriceps', 'https://www.youtube.com/watch?v=rM6SDUdl9fs'],
  ['Leg press 45°', 'quadriceps', 'https://www.youtube.com/watch?v=waAxlYvtCcI'],
  ['Cadeira extensora', 'quadriceps', 'https://www.youtube.com/watch?v=Svq2T3L9oKo'],
  ['Agachamento hack', 'quadriceps', 'https://www.youtube.com/watch?v=gEYYCvNI6hI'],
  ['Afundo (passada)', 'quadriceps', 'https://www.youtube.com/watch?v=mPtTzNYAHi0'],
  ['Agachamento búlgaro', 'quadriceps', 'https://www.youtube.com/watch?v=a3-bQbTdA_0'],
  ['Agachamento no smith', 'quadriceps', 'https://www.youtube.com/watch?v=uCT5wfQIQpk'],

  // isquiotibiais
  ['Mesa flexora', 'isquiotibiais', 'https://www.youtube.com/watch?v=8Nat6GRiEoc'],
  ['Stiff com barra', 'isquiotibiais', 'https://www.youtube.com/watch?v=BHfY5-jGNDA'],
  ['Cadeira flexora', 'isquiotibiais', 'https://www.youtube.com/watch?v=e0_xHkXw350'],
  ['Levantamento terra romeno', 'isquiotibiais', 'https://www.youtube.com/watch?v=jSomWOwLiGE'],
  ['Flexora em pé unilateral', 'isquiotibiais', 'https://www.youtube.com/watch?v=T--10UN1jKs'],

  // glúteo
  ['Elevação pélvica (hip thrust)', 'gluteo', 'https://www.youtube.com/watch?v=5KYtuo5Y-sg'],
  ['Agachamento sumô', 'gluteo', 'https://www.youtube.com/watch?v=gsSNayxK3YI'],
  ['Cadeira abdutora', 'gluteo', 'https://www.youtube.com/watch?v=50qHGus1TZk'],
  ['Coice na polia (quatro apoios)', 'gluteo', 'https://www.youtube.com/watch?v=KoGf9T179Vg'],
  ['Passada com halteres', 'gluteo', 'https://www.youtube.com/watch?v=9bxRdpUFW4c'],
  ['Glute drive (máquina)', 'gluteo', 'https://www.youtube.com/watch?v=WobMJQ4v5k4'],

  // adutor
  ['Cadeira adutora', 'adutor', 'https://www.youtube.com/watch?v=goQVyEGMYMM'],
  ['Adução de quadril na polia', 'adutor', 'https://www.youtube.com/watch?v=EY1lzReRghg'],

  // panturrilha
  ['Panturrilha em pé (gêmeos)', 'panturrilha', 'https://www.youtube.com/watch?v=tPiLhI7TkLE'],
  ['Panturrilha sentado', 'panturrilha', 'https://www.youtube.com/watch?v=qP9GavDpYmw'],
  ['Panturrilha no leg press', 'panturrilha', 'https://www.youtube.com/watch?v=Ua7jx6wKyMw'],
  ['Panturrilha unilateral com halter', 'panturrilha', 'https://www.youtube.com/watch?v=XOg28DUU_uw'],

  // abdômen
  ['Abdominal supra (crunch)', 'abdomen', 'https://www.youtube.com/watch?v=hZVIstfFsIc'],
  ['Abdominal infra (elevação de pernas)', 'abdomen', 'https://www.youtube.com/watch?v=dmCnmh2kr_g'],
  ['Prancha isométrica', 'abdomen', 'https://www.youtube.com/watch?v=3qTz7853Yiw'],
  ['Abdominal na polia (crunch cabo)', 'abdomen', 'https://www.youtube.com/watch?v=wrCw315SW4c'],
  ['Abdominal oblíquo (bicicleta)', 'abdomen', 'https://www.youtube.com/watch?v=_3pev_mVtIc'],
  ['Abdominal na máquina', 'abdomen', 'https://www.youtube.com/watch?v=pR7WtwTOOTw'],
  ['Rotação de tronco no cabo (woodchopper)', 'abdomen', 'https://www.youtube.com/watch?v=GpbPpByyYME'],

  // cardio
  ['Esteira', 'cardio', 'https://www.youtube.com/watch?v=nQdMzvhaSrI'],
  ['Bicicleta ergométrica', 'cardio', 'https://www.youtube.com/watch?v=dMJ5LO5NwY8'],
  ['Elíptico', 'cardio', 'https://www.youtube.com/watch?v=Rltlu55sBLE'],
  ['Escada (stairmaster)', 'cardio', 'https://www.youtube.com/watch?v=nal_FtVy8yk'],
  ['Remo ergômetro', 'cardio', 'https://www.youtube.com/watch?v=oDtV66s1wQM'],
  ['Pular corda', 'cardio', 'https://www.youtube.com/watch?v=bB2BMeZTygg'],
];

export async function seedCatalogoExercicios(db) {
  db.data.exercicios ||= [];

  const porNome = new Map(db.data.exercicios.map((e) => [e.nome.toLowerCase(), e]));
  let mudou = false;

  for (const [nome, grupoMuscular, videoUrl] of EXERCICIOS_PADRAO) {
    const existente = porNome.get(nome.toLowerCase());
    if (!existente) {
      db.data.exercicios.push({
        id: nanoid(10),
        nome,
        grupoMuscular,
        videoUrl,
        descricao: '',
        equipamento: '',
        ondeFica: '',
        midia: [],
        createdAt: new Date().toISOString(),
      });
      mudou = true;
      continue;
    }
    // Preenche o vídeo de quem já existe mas ainda não tem um — não sobrescreve
    // um link que a treinadora já tenha colocado ou trocado na mão.
    if (!existente.videoUrl && videoUrl) {
      existente.videoUrl = videoUrl;
      mudou = true;
    }
  }

  if (mudou) await db.write();
}
