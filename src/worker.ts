export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    // Telegram Relay API Route (/api/telegram)
    if (url.pathname === '/api/telegram' && request.method === 'POST') {
      try {
        const body = (await request.json()) as { botToken?: string; chatId?: string; text?: string };
        const token = (body.botToken || '8280306445:AAEJ7RSWSltrkaAy0G5qvOAsbgzhcuPbG7E').trim();
        const chat = (body.chatId || '7875527137').trim();
        const text = body.text || '테스트';

        const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chat,
            text: text,
          }),
        });

        const data = await tgRes.json();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ ok: false, description: err.message || 'Worker relay error' }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // Static Assets Fallback
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
