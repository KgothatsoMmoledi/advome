export async function onRequestPost({ request, env }) {
  const { type, userText, debug } = await request.json();

  const systemPrompt = type === 'analyze'
    ? `List possible South African labour laws (with section numbers if known) that could relate to the following workplace situation. Describe each law neutrally in one sentence. Do not apply the law, do not give advice. Output a numbered list.`
    : `Improve the grammar, spelling, and clarity of the following text. Do not add or change the meaning. Output only the corrected text.`;

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

    // If debug mode, return the full response
    if (debug) {
      return new Response(JSON.stringify({ debugData: data }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Extract text normally
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return new Response(JSON.stringify({ result: generatedText }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
