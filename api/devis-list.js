// api/devis-list.js
// Retourne la liste des devis (admin = tous, vendeur = les siens)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { vendor_id, role } = req.query;

  if (!role) {
    return res.status(400).json({ error: 'Rôle manquant' });
  }

  try {
    let url = `${process.env.SUPABASE_URL}/rest/v1/devis?select=*&order=created_at.desc`;

    // Un vendeur ne voit que ses propres devis
    if (role !== 'admin' && vendor_id) {
      url += `&vendor_id=eq.${encodeURIComponent(vendor_id)}`;
    }

    const response = await fetch(url, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      }
    });

    if (!response.ok) {
      console.error('Supabase error:', await response.text());
      return res.status(500).json({ error: 'Erreur lecture' });
    }

    const devis = await response.json();
    return res.status(200).json(devis);

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
