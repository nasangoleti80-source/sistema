// Integração com a API da Claude para montagem automática de treinos.
// Exige a variável de ambiente ANTHROPIC_API_KEY configurada no servidor.

const MODEL = 'claude-sonnet-5';

export class IaIndisponivelError extends Error {}

export async function chamarClaude(systemPrompt, userPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new IaIndisponivelError(
      'IA não configurada: defina a variável de ambiente ANTHROPIC_API_KEY no servidor.'
    );
  }

  const resposta = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!resposta.ok) {
    const texto = await resposta.text().catch(() => '');
    throw new Error(`Erro ao chamar a IA (${resposta.status}): ${texto.slice(0, 300)}`);
  }

  const json = await resposta.json();
  const texto = json.content?.map((b) => b.text || '').join('') || '';
  const match = texto.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('A IA não retornou um JSON válido.');
  return JSON.parse(match[0]);
}
