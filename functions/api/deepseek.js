export async function onRequestPost({ request, env }) {
  const { type, userText, legalField = 'South African law' } = await request.json();

  let systemPrompt = '';
  if (type === 'analyze') {
    systemPrompt = `List possible South African laws (with section numbers if known) that could relate to the following workplace situation. Describe each law neutrally in one sentence. Do not apply the law, do not give advice. Output a numbered list.`;
  } else if (type === 'polish') {
    systemPrompt = `Improve the grammar, spelling, and clarity of the following text. Do not add or change the meaning. Output only the corrected text.`;
  } else if (type === 'chat') {
    systemPrompt = `You are a South African legal information assistant. Answer with general legal information, plain language explanations, and definitions. Do not give legal advice.`;
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
