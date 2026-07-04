import type { APIRoute } from 'astro';
export const POST: APIRoute = async () => {
  return new Response(JSON.stringify({ message: "Login endpoint" }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
