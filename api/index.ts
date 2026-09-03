/**
 * Vercel Edge Function adapter.
 * Thin wrapper around the shared core in ../lib/api-router.ts.
 * Same logic as the Cloudflare Pages Function — runs on the Edge runtime.
 *
 * Works on the Vercel Hobby (free) plan. AI features work out of the box via
 * env vars (GEMINI_API_KEY etc.). User-auth requires a DB binding (see README);
 * without it, auth endpoints gracefully return 503.
 */

import { handleRequest, Env } from "../lib/api-router";

// Force the Edge runtime so the same Web-API code (Request/Response/crypto) works.
export const config = {
  runtime: "edge",
};

export default async function handler(request: Request): Promise<Response> {
  // Handle CORS pre-flight at the edge.
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, x-gemini-key, x-openrouter-key, x-ai-provider-keys",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const url = new URL(request.url);
  // vercel.json rewrites every /api/<path> -> /api?_p=<path> so that nested
  // routes (e.g. /api/auth/count) also reach this single function on Vercel
  // (framework:null zero-config only matched single-segment /api/* paths).
  const qp = url.searchParams.get("_p");
  const clean = (qp != null ? qp : url.pathname.replace(/^\/api\/?/, ""))
    .replace(/^\/+|\/+$/g, "");
  const pathArray = clean ? clean.split("/") : [];

  // process.env is available on the Vercel Edge runtime for project env vars.
  const env: Env = (typeof process !== "undefined" ? (process as any).env : {}) || {};

  return handleRequest(request, env, pathArray);
}
