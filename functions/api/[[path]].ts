/**
 * Cloudflare Pages Function adapter.
 * Thin wrapper around the shared core in ../../lib/api-router.ts.
 * (Keeps the platform-specific code minimal and lets the same logic run on Vercel.)
 */

import { handleRequest, Env } from "../../lib/api-router";

/** Minimal Pages Function context type (avoids a hard dependency on workers-types). */
type PagesFunction<EnvType = any> = (context: {
  request: Request;
  env: EnvType;
  params: Record<string, string | string[]>;
  waitUntil(promise: Promise<unknown>): void;
  next(...args: unknown[]): Promise<Response>;
}) => Response | Promise<Response>;

function toPathArray(params: Record<string, string | string[]>): string[] {
  const p = params?.path;
  if (Array.isArray(p)) return p;
  if (typeof p === "string") return p.split("/");
  return [];
}

export const onRequestGet: PagesFunction<Env> = (ctx) =>
  handleRequest(ctx.request, ctx.env as Env, toPathArray(ctx.params));

export const onRequestPost: PagesFunction<Env> = (ctx) =>
  handleRequest(ctx.request, ctx.env as Env, toPathArray(ctx.params));

export const onRequestPatch: PagesFunction<Env> = (ctx) =>
  handleRequest(ctx.request, ctx.env as Env, toPathArray(ctx.params));

export const onRequestDelete: PagesFunction<Env> = (ctx) =>
  handleRequest(ctx.request, ctx.env as Env, toPathArray(ctx.params));

export const onRequestOptions: PagesFunction<Env> = () =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-gemini-key, x-openrouter-key, x-ai-provider-keys",
      "Access-Control-Max-Age": "86400",
    },
  });
