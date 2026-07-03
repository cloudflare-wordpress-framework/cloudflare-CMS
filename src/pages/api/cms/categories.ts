import { env } from "cloudflare:workers";
import type { APIRoute } from 'astro';
import { checkAdminAuth } from '../../../lib/auth/utils';

export const GET: APIRoute = async ({ request, locals }) => {
  if (!await checkAdminAuth(request)) return new Response('Unauthorized', { status: 401 });
  try {
    // @ts-ignore
    const db = env.DB;
    const { results } = await db.prepare('SELECT * FROM categories').all();
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
    const { id, name, slug } = data;
    const newId = id || crypto.randomUUID();

    await db.prepare('INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)').bind(newId, name, slug).run();

    return new Response(JSON.stringify({ success: true, id: newId }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  if (!await checkAdminAuth(request)) return new Response('Unauthorized', { status: 401 });
  try {
    const data = await request.json();
    // @ts-ignore
    const db = env.DB;
    const { id, name, slug } = data;

    await db.prepare('UPDATE categories SET name = ?, slug = ? WHERE id = ?').bind(name, slug, id).run();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  if (!await checkAdminAuth(request)) return new Response('Unauthorized', { status: 401 });
  try {
    const { id } = await request.json();
    // @ts-ignore
    const db = env.DB;

    await db.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
