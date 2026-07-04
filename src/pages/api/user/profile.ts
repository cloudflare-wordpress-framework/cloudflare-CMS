import type { APIRoute } from 'astro';
import schemaRaw from '../../../../forms/user.schema.json';
import { env } from "cloudflare:workers";

function validateData(data: any, schema: any) {
    const required = schema.required || [];
    for (const field of required) {
        if (!data[field] && field !== 'id' && field !== 'firebase_uid' && field !== 'email' && field !== 'role') {
           return { valid: false, error: `Missing required field: ${field}` };
        }
    }
    return { valid: true };
}

export const POST: APIRoute = async ({ request, locals }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  const token = authHeader.split('Bearer ')[1];

  if (!env || !env.DB) {
      console.error("DB binding not found. Check wrangler.jsonc and env.");
      return new Response(JSON.stringify({ message: 'Database configuration error' }), { status: 500 });
  }

  // To properly verify Firebase JWTs in Cloudflare Workers without large node dependencies:
  // 1. Fetch public keys from Google
  // 2. Decode JWT header to find key ID (kid)
  // 3. Verify signature using standard Web Crypto API
  // However, for this demo/starter, and because the user specifically requested
  // "firebase auth" which implies securing backend endpoints, we will implement
  // a basic fetch to Google's tokeninfo endpoint. This is slower but works natively
  // without external libraries.

  let firebaseUser;
  try {
      // Use standard Astro environment variables logic for FIREBASE_API_KEY
      const apiKey = import.meta.env.FIREBASE_API_KEY;

      const verifyResponse = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: token })
        }
      );

      if (!verifyResponse.ok) {
          throw new Error('Invalid token');
      }

      const tokenInfo = await verifyResponse.json();
      if (!tokenInfo.users || tokenInfo.users.length === 0) {
           throw new Error('Invalid token');
      }
      firebaseUser = tokenInfo.users[0];
  } catch (err) {
      console.error("Token verification failed:", err);
      return new Response(JSON.stringify({ message: 'Unauthorized - Invalid Token' }), { status: 401 });
  }

  const uid = firebaseUser.localId;
  const email = firebaseUser.email;

  let data;
  try {
      data = await request.json();
  } catch (e) {
      return new Response(JSON.stringify({ message: 'Invalid JSON' }), { status: 400 });
  }

  const validation = validateData(data, schemaRaw);
  if (!validation.valid) {
      return new Response(JSON.stringify({ message: validation.error }), { status: 400 });
  }

  const db = env.DB;

  // Role-based Access Control
  const adminEmails = (import.meta.env.ADMIN_EMAILS || '').split(',').map((e: string) => e.trim());
  const editorEmails = (import.meta.env.EDITOR_EMAILS || '').split(',').map((e: string) => e.trim());

  let computedRole = 'user';
  if (adminEmails.includes(email)) {
      computedRole = 'admin';
  } else if (editorEmails.includes(email)) {
      computedRole = 'editor';
  }

  try {
      const existingUser = await db.prepare('SELECT id FROM users WHERE firebase_uid = ?')
                                   .bind(uid)
                                   .first();

      if (existingUser) {
          const updateQuery = `
              UPDATE users SET
              full_name = COALESCE(?, full_name),
              birthdate = COALESCE(?, birthdate),
              workplace = COALESCE(?, workplace),
              avatar = COALESCE(?, avatar),
              role = ?
              WHERE firebase_uid = ?
          `;
          await db.prepare(updateQuery)
                  .bind(data.full_name || null, data.birthdate || null, data.workplace || null, data.avatar || null, computedRole, uid)
                  .run();
      } else {
          const newId = crypto.randomUUID();
          const insertQuery = `
              INSERT INTO users (id, firebase_uid, email, role, full_name, birthdate, workplace, avatar)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;
          await db.prepare(insertQuery)
                  .bind(
                      newId,
                      uid,
                      email,
                      computedRole,
                      data.full_name || null,
                      data.birthdate || null,
                      data.workplace || null,
                      data.avatar || null
                  )
                  .run();
      }

      return new Response(JSON.stringify({ message: 'Profile updated successfully' }), { status: 200 });
  } catch (error: any) {
      console.error("Database error:", error);
      return new Response(JSON.stringify({ message: 'Internal Server Error', error: error.message }), { status: 500 });
  }
};

export const GET: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  const token = authHeader.split('Bearer ')[1];

  if (!env || !env.DB) {
      return new Response(JSON.stringify({ message: 'Database configuration error' }), { status: 500 });
  }

  let firebaseUser;
  try {
      const apiKey = import.meta.env.FIREBASE_API_KEY;
      const verifyResponse = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: token })
        }
      );

      if (!verifyResponse.ok) throw new Error('Invalid token');
      const tokenInfo = await verifyResponse.json();
      if (!tokenInfo.users || tokenInfo.users.length === 0) throw new Error('Invalid token');
      firebaseUser = tokenInfo.users[0];
  } catch (err) {
      return new Response(JSON.stringify({ message: 'Unauthorized - Invalid Token' }), { status: 401 });
  }

  const uid = firebaseUser.localId;
  const db = env.DB;

  try {
      const user = await db.prepare('SELECT * FROM users WHERE firebase_uid = ?').bind(uid).first();
      if (user) {
          return new Response(JSON.stringify(user), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
  } catch (error: any) {
      return new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500 });
  }
};
