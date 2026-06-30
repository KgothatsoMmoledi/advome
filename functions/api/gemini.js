export async function onRequest(context) {
  const { request, env } = context;

  // Handle GET request – useful for testing
  if (request.method === 'GET') {
    return new Response('Gemini endpoint is live!', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  // Handle POST request – the actual document generation
  if (request.method === 'POST') {
    try {
      const { template, userInput } = await request.json();

      const systemPrompt = `You are a South African Labour Court paralegal assistant.
Use the official template provided exactly, only filling in placeholders.
Do not add or remove any clauses not present in the template.
The final document must use A4, 12pt Times New Roman, 1.5 line spacing, 2cm margins.
Output only the final document, no extra commentary.`;

      const userMessage = `Template:\n${template}\n\nUser details:\n${JSON.stringify(userInput, null, 2)}\n\nFill the template completely.`;

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

      return new Response(JSON.stringify({ document: generatedText }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Any other method
  return new Response('Method not allowed', { status: 405 });
}
