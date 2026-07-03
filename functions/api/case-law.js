export async function onRequestPost({ request, env }) {
  const { type, userText } = await request.json();

  let systemPrompt = '';
  if (type === 'analyze') {
    systemPrompt = `You are a South African labour law information tool.
The user will describe a workplace situation (dismissal, resignation, etc.).
Your job is to list **possible** laws (from the Labour Relations Act, Basic Conditions of Employment Act, Employment Equity Act, etc.) that *could* relate to the situation.
For each law, give:
- The name and section number (if known)
- A short, neutral summary of what the law says
Do NOT:
- Say which law applies
- Give advice
- Evaluate the situation
Output ONLY a numbered list (one law per line). If no law seems relevant, say "No specific law identified."`;
  } else if (type === 'polish') {
    systemPrompt = `You are a legal writing assistant.
The user will provide a personal explanation of why they think a certain law applies.
Your only job is to improve the grammar, spelling, sentence structure, and clarity.
Do NOT:
- Add legal arguments, advice, or new content
- Change the meaning
- Add citations or references
Output only the polished version of the user's text.`;
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
    // Gemini sometimes wraps output in code blocks; extract clean text
    let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Remove markdown fences if present
    generatedText = generatedText.replace(/```[^]*?```/g, '').trim();

    return new Response(JSON.stringify({ result: generatedText }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
