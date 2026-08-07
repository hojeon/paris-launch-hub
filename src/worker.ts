export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle OPTIONS preflight
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

    // Telegram Relay Endpoint
    if (url.pathname === '/api/telegram' && request.method === 'POST') {
      try {
        const body = (await request.json()) as { botToken?: string; chatId?: string; text?: string };
        const token = (body.botToken || '8280306445:AAEJ7RSWSltrkaAy0G5qvOAsbgzhcuPbG7E').trim();
        const chat = (body.chatId || '7875527137').trim();
        const text = body.text || '테스트 메세지';

        const encodedText = encodeURIComponent(text);
        const targetUrl = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat}&text=${encodedText}`;

        // Attempt 1: Server Direct POST to Telegram
        try {
          const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chat, text: text }),
          });
          const data = await tgRes.json();
          if (data && data.ok) {
            return new Response(JSON.stringify(data), {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
          }
        } catch (e) {
          console.warn('Server Direct POST failed:', e);
        }

        // Attempt 2: Server-side GET via Relay
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
          const pRes = await fetch(proxyUrl);
          const pData = await pRes.json();
          return new Response(JSON.stringify(pData), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          });
        } catch (e) {
          console.warn('Server GET Relay failed:', e);
        }

        return new Response(JSON.stringify({ ok: false, description: 'Telegram API Server Timeout (Cloudflare Edge)' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ ok: false, description: err.message || 'Worker Error' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
