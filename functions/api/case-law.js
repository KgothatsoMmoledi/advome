export async function onRequestPost({ request, env }) {
  const { type, userText } = await request.json();

  const GEMINI_MODEL = 'gemini-3.8-flash-latest';   // ✅ Correct model
  const DEEPSEEK_MODEL = 'deepseek-chat';

  let systemPrompt = '';
  if (type === 'analyze') {
    systemPrompt = `You are a South African labour law information tool. A user describes what happened at work. Provide a list of possible laws that *could* relate to the situation. For each, give a short neutral explanation. Do NOT apply law to facts. Do NOT give advice. Output as a numbered list.`;
  } else if (type === 'polish') {
    systemPrompt = `You are a legal writing assistant. Improve grammar, spelling, and sentence structure for clarity. Do NOT add legal arguments, advice, or new content. Preserve meaning exactly. Output only the polished text.`;
  } else {
    return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });
  }

  const userMessage = `User input:\n${userText}`;

  // Try Gemini first
  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }, { text: userMessage }] }]
        })
      }
    );

    if (geminiResponse.ok) {
      const data = await geminiResponse.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return new Response(JSON.stringify({ result: generatedText }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  } catch (e) {
    console.log('Gemini failed, trying DeepSeek...');
  }

  // Fallback to DeepSeek
  try {
    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.2
      })
    });

    const data = await deepseekResponse.json();
    const generatedText = data.choices?.[0]?.message?.content || '';
    return new Response(JSON.stringify({ result: generatedText }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'All AI providers failed. Please try again later.' }), { status: 500 });
  }
}
