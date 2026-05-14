// api/devis-delete.js
// Supprime un devis (admin seulement)

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, role } = req.body;

  if (!id || !role) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  if (role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/devis?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=minimal'
        }
      }
    );

    if (!response.ok) {
      console.error('Supabase error:', await response.text());
      return res.status(500).json({ error: 'Erreur suppression' });
    }

    return res.status(200).json({ ok: true });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
