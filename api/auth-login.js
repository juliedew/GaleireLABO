// api/auth-login.js
// Vérifie le code d'accès et retourne le rôle de l'utilisateur

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;
  if (!code || typeof code !== 'string' || code.trim() === '') {
    return res.status(400).json({ error: 'Code manquant' });
  }

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/users?code=eq.${encodeURIComponent(code.trim())}&select=id,name,role`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        }
      }
    );

    if (!response.ok) {
      console.error('Supabase error:', await response.text());
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    const users = await response.json();

    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Code incorrect' });
    }

    const user = users[0];

    return res.status(200).json({
      id: user.id,
      name: user.name,
      role: user.role
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
