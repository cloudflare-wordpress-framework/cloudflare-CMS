export async function verifyFirebaseToken(token: string) {
  const apiKey = import.meta.env.FIREBASE_API_KEY;

  try {
    const verifyResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token })
      }
    );

    if (!verifyResponse.ok) {
        return null;
    }

    const tokenInfo = await verifyResponse.json();
    if (!tokenInfo.users || tokenInfo.users.length === 0) {
         return null;
    }

    return tokenInfo.users[0]; // returns object with localId and email
  } catch (err) {
    console.error("Token verification failed:", err);
    return null;
  }
}

export function getUserRole(email: string): string {
  const adminEmails = (import.meta.env.ADMIN_EMAILS || '').split(',').map((e: string) => e.trim());
  const editorEmails = (import.meta.env.EDITOR_EMAILS || '').split(',').map((e: string) => e.trim());

  if (adminEmails.includes(email)) return 'admin';
  if (editorEmails.includes(email)) return 'editor';
  return 'user';
}

export async function checkAdminAuth(request: Request): Promise<boolean> {
  // Wait, I should ensure how the client will authenticate.
  // The client uses Firebase auth on the frontend and needs to send the token
  // as Authorization header.

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.split('Bearer ')[1];

  const user = await verifyFirebaseToken(token);
  if (!user) return false;

  const role = getUserRole(user.email);
  return role === 'admin';
}
