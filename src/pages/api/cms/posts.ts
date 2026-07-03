import { env } from "cloudflare:workers";
import type { APIRoute } from 'astro';
import { checkAdminAuth } from '../../../lib/auth/utils';

export const GET: APIRoute = async ({ request, locals }) => {
  if (!await checkAdminAuth(request)) return new Response('Unauthorized', { status: 401 });
  try {
    // @ts-ignore
    const db = env.DB;
    const { results } = await db.prepare('SELECT * FROM posts ORDER BY updated_at DESC').all();
    return new Response(JSON.stringify(results), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!await checkAdminAuth(request)) return new Response('Unauthorized', { status: 401 });
  try {
    const data = await request.json();
    // @ts-ignore
    const db = env.DB;
    const id = crypto.randomUUID();
    const { slug, title, excerpt, content, status, author_id } = data;
    const published_at = status === 'published' ? new Date().toISOString() : null;

    await db.prepare(`
      INSERT INTO posts (id, slug, title, excerpt, content, status, author_id, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, slug, title, excerpt, content, status, author_id || 'admin', published_at).run();

    return new Response(JSON.stringify({ success: true, id }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
