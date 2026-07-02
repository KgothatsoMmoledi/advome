export async function onRequestPost({ request, env }) {
  const { type, userText } = await request.json();

  let systemPrompt = '';
  if (type === 'analyze') {
    systemPrompt = `You are a South African labour law information tool.
A user describes what happened at work. Provide a list of possible laws (from the Labour Relations Act, Basic Conditions of Employment Act, Employment Equity Act, etc.) that *could* relate to the situation. For each, give a short neutral explanation of what the law says.
Do NOT apply the law to the user's facts. Do NOT give advice. Do NOT say "this law applies to you".
Output as a numbered list with the law name and brief description.`;
  } else if (type === 'polish') {
    systemPrompt = `You are a legal writing assistant. The user will provide a personal explanation. Improve grammar, spelling, and sentence structure for clarity. Do NOT add legal arguments, advice, or new content. Preserve the user's meaning exactly. Output only the polished text.`;
  } else {
    return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });
  }

  const userMessage = `User input:\n${userText}`;

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }, { text: userMessage }] }]
        })
      }
    );

    const data = await geminiResponse.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return new Response(JSON.stringify({ result: generatedText }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
