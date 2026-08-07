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

    // High-speed RSS Proxy Route (/api/rss-proxy?url=...)
    if (url.pathname === '/api/rss-proxy') {
      const targetUrl = url.searchParams.get('url');
      if (!targetUrl) {
        return new Response('Missing url parameter', { status: 400 });
      }

      try {
        const fetchRes = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          },
        });

        const xmlText = await fetchRes.text();
        return new Response(xmlText, {
          status: 200,
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'max-age=300',
          },
        });
      } catch (err: any) {
        return new Response(`Proxy Error: ${err.message}`, { status: 500 });
      }
    }

    // Telegram Relay Endpoint (/api/telegram)
    if (url.pathname === '/api/telegram' && request.method === 'POST') {
      try {
        const body = (await request.json()) as { botToken?: string; chatId?: string; text?: string };
        const token = (body.botToken || '8280306445:AAEJ7RSWSltrkaAy0G5qvOAsbgzhcuPbG7E').trim();
        const chat = (body.chatId || '7875527137').trim();
        const text = body.text || '테스트 메세지';

        // 1. Direct Telegram Form-UrlEncoded POST
        try {
          const formData = new URLSearchParams();
          formData.append('chat_id', chat);
          formData.append('text', text);

          const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
          });

          const data = await tgRes.json();
          if (data && data.ok) {
            return new Response(JSON.stringify(data), {
              status: 200,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
          }
        } catch (e) {}

        // 2. Direct JSON POST
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
        } catch (e) {}

        return new Response(JSON.stringify({ ok: false, description: 'Telegram Server Timeout' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ ok: false, description: err.message }), {
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
