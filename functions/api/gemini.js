export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'GET') {
    return new Response('Gemini endpoint is live!', {
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  if (request.method === 'POST') {
    try {
      const { template, userInput, fixGrammar = true } = await request.json();

      const systemPrompt = `You are a legal document formatting tool for South African Labour Court matters.
You are NOT a legal advisor and you CANNOT provide legal advice.

YOUR EXACT ROLE:
- Fill in an official template with the user's own words and details.
- Preserve the user's intended meaning exactly.
- Correct spelling, grammar, and sentence structure to improve clarity and articulation.
- Ensure the final text reads professionally while keeping the user's original voice.
- Never add new content, legal arguments, reasoning, or strategies.

WHAT YOU MAY DO (strictly limited):
- Fix spelling mistakes.
- Correct obvious grammatical errors (verb tense, subject‑verb agreement, punctuation, etc.).
- Rephrase awkward sentences to make them clearer, provided the original meaning is unchanged.
- Improve readability and flow, but never add new legal content.

WHAT YOU MUST NEVER DO (master prohibited actions):
1. NEVER give legal advice (do not tell the user what they should do, recommend a course of action, use "you should", etc.)
2. NEVER apply law to facts (do not say a law applies, do not connect user's facts to legal outcomes)
3. NEVER make legal judgments (do not assess strength, validity, chances, or predict outcomes)
4. NEVER select laws for the user (do not say "this law applies to you")
5. NEVER draft legal arguments (do not generate reasoning, fill gaps, complete thoughts)
6. NEVER fill out official forms with AI content (only use user‑provided words)
7. NEVER tell the user what to say (do not suggest wording, arguments, or strategies)
8. NEVER make the user feel advised (avoid "we recommend", "based on your situation", etc.)
9. NEVER add text beyond filling placeholders and correcting language.
10. NEVER express any opinion, evaluation, or legal interpretation.

HOW YOU MUST OUTPUT:
- Only the filled template text, with corrected grammar and spelling.
- Placeholders replaced with the user's details.
- No extra commentary, no disclaimers (we add them on the page).
- Use clear, neutral language.
- If the user chose not to fix grammar (fixGrammar = false), then do not correct grammar; only fill the template exactly as is.`;

      let userMessage = `Template:\n${template}\n\nUser details:\n${JSON.stringify(userInput, null, 2)}\n\n`;
      if (fixGrammar) {
        userMessage += 'Please fill the template and correct any spelling/grammar errors while keeping the original meaning.';
      } else {
        userMessage += 'Fill the template exactly as is. Do not correct any language.';
      }

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

  return new Response('Method not allowed', { status: 405 });
}
