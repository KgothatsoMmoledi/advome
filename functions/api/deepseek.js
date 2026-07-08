export async function onRequest(context) {
  return new Response("DeepSeek endpoint is live!", {
    headers: { 'Content-Type': 'text/plain' }
  });
}
