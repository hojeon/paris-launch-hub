interface EventContext {
  request: Request;
}

export async function onRequestPost(context: EventContext): Promise<Response> {
  try {
    const body = await context.request.json() as { botToken?: string; chatId?: string; text?: string };
    const { botToken, chatId, text } = body;

    const token = (botToken || '8280306445:AAEJ7RSWSltrkaAy0G5qvOAsbgzhcuPbG7E').trim();
    const chat = (chatId || '7875527137').trim();

    if (!token || !chat || !text) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat,
        text: text,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, description: err.message || 'Server-side Relay Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
