// src/worker.ts
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }
    if (url.pathname === "/api/telegram" && request.method === "POST") {
      try {
        const body = await request.json();
        const token = (body.botToken || "8280306445:AAEJ7RSWSltrkaAy0G5qvOAsbgzhcuPbG7E").trim();
        const chat = (body.chatId || "7875527137").trim();
        const text = body.text || "\uD14C\uC2A4\uD2B8 \uBA54\uC138\uC9C0";
        try {
          const formData = new URLSearchParams();
          formData.append("chat_id", chat);
          formData.append("text", text);
          const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData.toString()
          });
          const data = await tgRes.json();
          if (data && data.ok) {
            return new Response(JSON.stringify(data), {
              status: 200,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
          }
        } catch (e) {
          console.warn("Form-UrlEncoded POST failed:", e);
        }
        try {
          const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chat, text })
          });
          const data = await tgRes.json();
          if (data && data.ok) {
            return new Response(JSON.stringify(data), {
              status: 200,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
          }
        } catch (e) {
          console.warn("JSON POST failed:", e);
        }
        try {
          const encodedText = encodeURIComponent(text);
          const targetUrl = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat}&text=${encodedText}`;
          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
          const pRes = await fetch(proxyUrl);
          const pData = await pRes.json();
          return new Response(JSON.stringify(pData), {
            status: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        } catch (e) {
        }
        return new Response(JSON.stringify({ ok: false, description: "Telegram API Server Timeout" }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, description: err.message || "Worker Error" }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return new Response("Not Found", { status: 404 });
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
