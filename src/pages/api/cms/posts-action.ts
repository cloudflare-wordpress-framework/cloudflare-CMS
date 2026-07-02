import type { APIRoute } from 'astro';
import { checkAdminAuth } from '../../../lib/auth/utils';

export const PUT: APIRoute = async ({ request, locals }) => {
  if (!await checkAdminAuth(request)) return new Response('Unauthorized', { status: 401 });
  try {
    const data = await request.json();
    // @ts-ignore
    const db = locals.runtime.env.DB;
    const { id, slug, title, excerpt, content, status, author_id } = data;
    const published_at = status === 'published' ? new Date().toISOString() : null;

    await db.prepare(`
      UPDATE posts
      SET slug = ?, title = ?, excerpt = ?, content = ?, status = ?, author_id = ?, updated_at = CURRENT_TIMESTAMP, published_at = COALESCE(published_at, ?)
      WHERE id = ?
    `).bind(slug, title, excerpt, content, status, author_id || 'admin', published_at, id).run();

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
    const db = locals.runtime.env.DB;
    await db.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
