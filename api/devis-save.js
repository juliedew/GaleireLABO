// api/devis-save.js
// Sauvegarde un devis dans Supabase

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    id, type, nom, email, tel,
    price, acompte, solde, statut,
    vendor_id, vendor_name, vendor_type,
    commission, details
  } = req.body;

  // Validation
  if (!id || !type || price === undefined) {
    return res.status(400).json({ error: 'Champs manquants' });
  }
  if (typeof price !== 'number' || price <= 0 || price > 100000) {
    return res.status(400).json({ error: 'Montant invalide' });
  }

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/devis`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          id, type, nom, email, tel,
          price, acompte, solde,
          statut: statut || 'En attente de paiement',
          vendor_id: vendor_id || null,
          vendor_name: vendor_name || null,
          vendor_type: vendor_type || null,
          commission: commission || 0,
          details: details || {}
        })
      }
    );

    if (!response.ok) {
      console.error('Supabase error:', await response.text());
      return res.status(500).json({ error: 'Erreur sauvegarde' });
    }

    return res.status(200).json({ ok: true });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
