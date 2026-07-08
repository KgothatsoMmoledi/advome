export async function onRequestPost({ request, env }) {
  const { type, userText, legalField = 'South African law', debug } = await request.json();

  let systemPrompt = '';
  if (type === 'analyze') {
    systemPrompt = `List possible South African laws (with section numbers if known) that could relate to the following workplace situation. Describe each law neutrally in one sentence. Do not apply the law, do not give advice. Output a numbered list.`;
  } else if (type === 'polish') {
    systemPrompt = `Improve the grammar, spelling, and clarity of the following text. Do not add or change the meaning. Output only the corrected text.`;
  } else if (type === 'chat') {
    systemPrompt = `You are a South African legal information assistant. Answer with general legal information, plain language explanations, and definitions. Do not give legal advice. Keep answers concise.`;
  } else {
    return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });
  }

  const userMessage = `User input:\n${userText}`;
  const model = 'gemini-3.5-flash';   // Correct free model

  async function callGemini(retry = true) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 sec timeout

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }, { text: userMessage }] }]
        }),
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    const data = await geminiResponse.json();

    // Retry on rate limit (429) – wait 5 seconds and try once more
    if (data.error && data.error.code === 429 && retry) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      return callGemini(false);
    }

    return data;
  }

  try {
    const data = await callGemini(true);

    if (debug) {
      return new Response(JSON.stringify({ debugData: data }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message }), { status: data.error.code || 500 });
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return new Response(JSON.stringify({ result: generatedText }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    const message = error.name === 'AbortError' ? 'The AI took too long to respond. Please try again.' : error.message;
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
