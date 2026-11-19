/*
 * API da Folha de Ponto — E.M.E.F. João Ribeiro Soares
 * Código público: NENHUM dado pessoal ou segredo deve ser incluído aqui.
 *
 * Cloudflare Worker:
 *   KV binding: DADOS -> pontoemefjrs-dados
 *   Secret: API_TOKEN (mínimo 16 caracteres; senha exclusiva e difícil de adivinhar)
 *
 * Sem API_TOKEN configurado, nenhuma leitura ou gravação é permitida.
 * A API só aceita requisições de navegador da origem oficial do GitHub Pages.
 * ATENÇÃO: CORS não é autenticação; cada operação depende do token.
 */

const SITE_ORIGIN = "https://walarconborges.github.io";
const DATA_KEY = "folha-de-ponto:estado:v1";
const MAX_BODY_BYTES = 1024 * 1024;
const encoder = new TextEncoder();

function corsHeaders(origin) {
  if (origin !== SITE_ORIGIN) return {};
  return {
    "Access-Control-Allow-Origin": SITE_ORIGIN,
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin",
  };
}

function json(body, status = 200, origin = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...corsHeaders(origin),
    },
  });
}

async function isAuthorized(request, secret) {
  if (typeof secret !== "string" || secret.length < 16) return false;
  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("Bearer ")) return false;
  const supplied = header.slice(7);
  if (!supplied || supplied.length > 512) return false;

  // Compara os resumos SHA-256 sem terminar no primeiro caractere diferente.
  const [left, right] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(supplied)),
    crypto.subtle.digest("SHA-256", encoder.encode(secret)),
  ]);
  const a = new Uint8Array(left);
  const b = new Uint8Array(right);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function validState(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Array.isArray(value.servidores) &&
    value.servidores.length <= 500 &&
    value.servidores.every(
      (s) =>
        s &&
        typeof s === "object" &&
        typeof s.id === "string" &&
        typeof s.nome === "string" &&
        typeof s.matricula === "string" &&
        typeof s.cargo === "string" &&
        (s.turno === "Manhã" || s.turno === "Tarde") &&
        Array.isArray(s.situacoes)
    ) &&
    value.calendarios !== null &&
    typeof value.calendarios === "object" &&
    !Array.isArray(value.calendarios) &&
    Number.isInteger(value.mes) &&
    value.mes >= 1 &&
    value.mes <= 12 &&
    Number.isInteger(value.ano) &&
    value.ano >= 2000 &&
    value.ano <= 2100 &&
    Array.isArray(value.logs) &&
    value.logs.length <= 20000
  );
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    if (origin && origin !== SITE_ORIGIN) {
      return json({ ok: false, erro: "Origem não autorizada." }, 403);
    }

    if (request.method === "OPTIONS") {
      if (origin !== SITE_ORIGIN) return json({ ok: false }, 403);
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, servico: "pontoemefjrs-api" }, 200, origin);
    }

    if (url.pathname !== "/api/dados") {
      return json({ ok: false, erro: "Rota não encontrada." }, 404, origin);
    }

    if (request.method !== "GET" && request.method !== "PUT") {
      return json({ ok: false, erro: "Método não permitido." }, 405, origin);
    }

    if (!env.DADOS || typeof env.API_TOKEN !== "string" || env.API_TOKEN.length < 16) {
      return json({ ok: false, erro: "API ainda não configurada." }, 503, origin);
    }

    if (!(await isAuthorized(request, env.API_TOKEN))) {
      return json({ ok: false, erro: "Acesso não autorizado." }, 401, origin);
    }

    try {
      if (request.method === "GET") {
        const record = await env.DADOS.get(DATA_KEY, "json");
        return json(
          { ok: true, dados: record?.dados ?? null, salvoEm: record?.salvoEm ?? null },
          200,
          origin
        );
      }

      if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) {
        return json({ ok: false, erro: "Envie JSON." }, 415, origin);
      }

      const declaredLength = Number(request.headers.get("Content-Length") || 0);
      if (declaredLength > MAX_BODY_BYTES) {
        return json({ ok: false, erro: "Arquivo de dados muito grande." }, 413, origin);
      }

      const reader = request.body?.getReader();
      if (!reader) return json({ ok: false, erro: "Conteúdo obrigatório." }, 400, origin);
      const chunks = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_BODY_BYTES) {
          await reader.cancel();
          return json({ ok: false, erro: "Arquivo de dados muito grande." }, 413, origin);
        }
        chunks.push(value);
      }

      const bytes = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }

      let payload;
      try {
        payload = JSON.parse(new TextDecoder().decode(bytes));
      } catch {
        return json({ ok: false, erro: "JSON inválido." }, 400, origin);
      }
      if (!validState(payload?.dados)) {
        return json({ ok: false, erro: "Estrutura de dados inválida." }, 422, origin);
      }

      const salvoEm = new Date().toISOString();
      await env.DADOS.put(
        DATA_KEY,
        JSON.stringify({ dados: payload.dados, salvoEm })
      );
      return json({ ok: true, salvoEm }, 200, origin);
    } catch (error) {
      // Não registrar dados pessoais ou conteúdos das requisições em logs.
      console.error("Falha na operação da API:", error?.name || "erro");
      return json({ ok: false, erro: "Falha interna da API." }, 500, origin);
    }
  },
};
