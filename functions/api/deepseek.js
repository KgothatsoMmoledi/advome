export async function onRequestPost({ request, env }) {
  const { type, userText, legalField = 'labour law' } = await request.json();

  let systemPrompt = '';
  if (type === 'analyze') {
    systemPrompt = `You are a South African labour law assistant. Based on the user's story, identify:
1. Possible procedural unfairness issues (process problems). 
2. Possible substantive unfairness issues (reasons were wrong, punishment too harsh, etc.).
For each, give a short plain‑language explanation that a non‑lawyer can understand. 
Format your response exactly like this:
PROCEDURAL ISSUES:
- [Issue 1]: [explanation]
- [Issue 2]: [explanation]
SUBSTANTIVE ISSUES:
- [Issue 1]: [explanation]
- [Issue 2]: [explanation]
Do not give legal advice. Do not apply the law. Only list possible issues.`;
  } else if (type === 'polish') {
    systemPrompt = 'Improve the grammar, spelling, and clarity of the following text. Do not change the meaning. Output only the corrected text.';
  } else if (type === 'chat') {
    systemPrompt = 'You are a South African legal information assistant. Answer with general legal information, plain language explanations, and definitions. Do not give legal advice. Keep answers concise.';
  } else {
    return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });
  }

  const userMessage = `User input:\n${userText}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || '';
    return new Response(JSON.stringify({ result: generatedText }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    const message = error.name === 'AbortError' ? 'DeepSeek took too long' : error.message;
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
