// api/devis-update.js
// Met à jour le statut d'un devis (admin seulement)

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, statut, role } = req.body;

  if (!id || !statut || !role) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  // Seul l'admin peut changer les statuts
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  const statutsValides = [
    'En attente de paiement',
    'Contact demandé',
    "En attente d'acompte — Facture envoyée",
    'En production',
    'Livré'
  ];
  if (!statutsValides.includes(statut)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/devis?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ statut })
      }
    );

    if (!response.ok) {
      console.error('Supabase error:', await response.text());
      return res.status(500).json({ error: 'Erreur mise à jour' });
    }

    return res.status(200).json({ ok: true });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
