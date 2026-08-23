// Cálculos de avaliação física e gasto calórico

export function calcularIdade(dataNascimento, referencia = new Date()) {
  if (!dataNascimento) return null;
  const nasc = new Date(dataNascimento);
  const hoje = new Date(referencia);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

export function calcularIMC(pesoKg, alturaCm) {
  if (!pesoKg || !alturaCm) return null;
  const alturaM = alturaCm / 100;
  return Number((pesoKg / (alturaM * alturaM)).toFixed(2));
}

export function classificarIMC(imc) {
  if (imc == null) return '';
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25) return 'Peso normal';
  if (imc < 30) return 'Sobrepeso';
  if (imc < 35) return 'Obesidade grau I';
  if (imc < 40) return 'Obesidade grau II';
  return 'Obesidade grau III';
}

// Protocolo de Jackson & Pollock 7 dobras cutâneas (mm): tríceps, subescapular,
// axilar média, suprailíaca, abdominal, coxa, peitoral
export function calcularComposicaoCorporal({ dobras, idade, sexo, pesoKg }) {
  if (!dobras || !idade || !sexo || !pesoKg) return null;
  const campos = ['triceps', 'subescapular', 'axilarMedia', 'suprailiaca', 'abdominal', 'coxa', 'peitoral'];
  const valores = campos.map((c) => Number(dobras[c]) || 0);
  if (valores.some((v) => !v)) return null;
  const soma7 = valores.reduce((s, v) => s + v, 0);

  let densidade;
  if (sexo === 'masculino') {
    densidade =
      1.112 - 0.00043499 * soma7 + 0.00000055 * soma7 * soma7 - 0.00028826 * idade;
  } else {
    densidade =
      1.097 - 0.00046971 * soma7 + 0.00000056 * soma7 * soma7 - 0.00012828 * idade;
  }

  // Equação de Siri
  const percentualGordura = (4.95 / densidade - 4.5) * 100;
  const massaGorda = pesoKg * (percentualGordura / 100);
  const massaMagra = pesoKg - massaGorda;

  return {
    soma7Dobras: Number(soma7.toFixed(1)),
    densidadeCorporal: Number(densidade.toFixed(5)),
    percentualGordura: Number(percentualGordura.toFixed(1)),
    massaGordaKg: Number(massaGorda.toFixed(1)),
    massaMagraKg: Number(massaMagra.toFixed(1)),
  };
}

export function classificarPercentualGordura(percentual, sexo) {
  if (percentual == null) return '';
  const faixas =
    sexo === 'masculino'
      ? [
          [6, 'Essencial'],
          [14, 'Atlético'],
          [18, 'Fitness'],
          [25, 'Aceitável'],
          [Infinity, 'Obesidade'],
        ]
      : [
          [14, 'Essencial'],
          [21, 'Atlético'],
          [25, 'Fitness'],
          [32, 'Aceitável'],
          [Infinity, 'Obesidade'],
        ];
  for (const [limite, label] of faixas) {
    if (percentual < limite) return label;
  }
  return '';
}

// MET aproximado por intensidade percebida do treino
const MET_POR_INTENSIDADE = {
  leve: 3.5,
  moderada: 5.5,
  intensa: 7.5,
  muito_intensa: 10,
};

export function calcularCaloriasTreino({ pesoKg, duracaoMin, intensidade }) {
  if (!pesoKg || !duracaoMin) return null;
  const met = MET_POR_INTENSIDADE[intensidade] || MET_POR_INTENSIDADE.moderada;
  // kcal = MET * 3.5 * peso(kg) / 200 * minutos
  const kcal = (met * 3.5 * pesoKg / 200) * duracaoMin;
  return Math.round(kcal);
}

export function calcularVolumeTreino(series) {
  // series: [{ peso, repeticoes }]
  if (!Array.isArray(series)) return 0;
  return series.reduce((total, s) => total + (Number(s.peso) || 0) * (Number(s.repeticoes) || 0), 0);
}
