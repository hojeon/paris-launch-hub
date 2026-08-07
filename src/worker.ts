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
        const targetGetUrl = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat}&text=${encodedText}`;

        // Strategy 1: Server-side CORS Proxy (corsproxy.io)
        try {
          const proxyUrl1 = `https://corsproxy.io/?${encodeURIComponent(targetGetUrl)}`;
          const res1 = await fetch(proxyUrl1);
          if (res1.ok) {
            const data1 = await res1.json();
            if (data1 && data1.ok) {
              return new Response(JSON.stringify(data1), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              });
            }
          }
        } catch (e) {
          console.warn('Strategy 1 failed:', e);
        }

        // Strategy 2: Server-side Relay (allorigins.win)
        try {
          const proxyUrl2 = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetGetUrl)}`;
          const res2 = await fetch(proxyUrl2);
          if (res2.ok) {
            const data2 = await res2.json();
            if (data2 && data2.ok) {
              return new Response(JSON.stringify(data2), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              });
            }
          }
        } catch (e) {
          console.warn('Strategy 2 failed:', e);
        }

        // Strategy 3: Server Direct POST to Telegram
        try {
          const res3 = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chat, text: text }),
          });
          if (res3.ok) {
            const data3 = await res3.json();
            if (data3 && data3.ok) {
              return new Response(JSON.stringify(data3), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              });
            }
          }
        } catch (e) {
          console.warn('Strategy 3 failed:', e);
        }

        return new Response(JSON.stringify({ ok: false, description: 'Telegram API Matrix All Relays Failed' }), {
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
