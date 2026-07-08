export async function onRequestPost({ request, env }) {
  const { type, userText, legalField = 'South African law', debug } = await request.json();

  let systemPrompt = '';
  if (type === 'analyze') {
    systemPrompt = `You are a South African legal information tool. The user is working on a matter in the field of: ${legalField}.
They will describe a situation. List possible laws (with section numbers if known) that could relate to the situation. For each law, provide a relevance score from 1 (less commonly associated) to 3 (most commonly associated with similar workplace situations), based on publicly available legal patterns – not a legal judgment. Format each line as:
Law: [name and section] | Score: [1-3]
Do not apply the law, do not give advice. Output a numbered list.`;
  } else if (type === 'polish') {
    systemPrompt = `You are a legal writing assistant. Improve the grammar, spelling, and clarity of the following text. Do not add or change the meaning. Output only the corrected text.`;
  } else if (type === 'chat') {
    systemPrompt = `You are a South African legal information assistant. Answer the user's question with general legal information, plain language explanations, and definitions. Do not give legal advice, apply law to facts, or recommend actions. Encourage consulting a legal practitioner. Keep answers concise and helpful.`;
  } else {
    return new Response(JSON.stringify({ error: 'Invalid type. Must be analyze, polish, or chat.' }), { status: 400 });
  }

  const userMessage = `User input:\n${userText}`;
  const model = 'gemini-3.5-flash';   // Current free-tier stable model

  try {
    // Timeout: abort if Gemini takes more than 9 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

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

    // Parse the response
    const data = await geminiResponse.json();

    if (debug) {
      return new Response(JSON.stringify({ debugData: data }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Check for API-level errors
    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message || 'Gemini API error' }), {
        status: data.error.code || 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return new Response(JSON.stringify({ result: generatedText }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    const message = error.name === 'AbortError'
      ? 'The AI took too long to respond. Please try again.'
      : error.message;
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
