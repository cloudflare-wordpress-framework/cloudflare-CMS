import { env } from "cloudflare:workers";
import type { APIRoute } from 'astro';
import { checkAdminAuth } from '../../../lib/server/auth';

export const GET: APIRoute = async ({ request, locals }) => {
  if (!await checkAdminAuth(request)) return new Response('Unauthorized', { status: 401 });
  try {
    // @ts-ignore
    const db = env.DB;
    const { results } = await db.prepare('SELECT * FROM theme_settings').all();
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
    const { setting_key, setting_value } = data;
    const id = crypto.randomUUID();

    await db.prepare(`
      INSERT INTO theme_settings (id, setting_key, setting_value)
      VALUES (?, ?, ?)
      ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = CURRENT_TIMESTAMP
    `).bind(id, setting_key, setting_value).run();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
