// api/checkout.js
// Crée une session Stripe — montant calculé côté serveur uniquement

// Table des prix de base (source de vérité côté serveur)
const PRIX = {
  spot_base: 395,
  comm_base: 299,
  offre_photo: 420,
  musique_surmesure: 150,
  voix_humaine: 180,
  duree: { '15': 0, '30': 150, '45': 250, '60': 350 },
  personnages: { '0': 0, '1': 50, '2': 100, '3': 150 },
  langues: { fr: 0, en: 0, fr_en: 150, autre: 150 },
  delai: { standard: 0, urgent: 200, express: 400 },
  style_visuel: { reel: 0, anime: 100, '3d': 200, mixte: 150, minimaliste: 0, vintage: 0 },
  qualite: { essentiel: 0, premium: 299, prestige: 499 },
  logo: { hd: 0, basse: 80, non: 150 },
};

function calcSpotServeur(details) {
  let p = PRIX.spot_base;
  if (details.voixoff === 'humaine') p += PRIX.voix_humaine;
  if (details.musique === 'surmesure') p += PRIX.musique_surmesure;
  p += PRIX.duree[details.duree] || 0;
  p += PRIX.personnages[details.personnages] || 0;
  p += PRIX.langues[details.langues] || 0;
  p += PRIX.delai[details.delai] || 0;
  p += PRIX.style_visuel[details.style_visuel] || 0;
  p += PRIX.qualite[details.qualite] || 0;
  p += PRIX.logo[details.logo_qualite] || 0;
  if (details.format === 'multi') p = p * 2;
  return Math.min(Math.round(p), 1999);
}

function calcCommServeur(details) {
  let p = PRIX.comm_base;
  if (details.c_presence === 'nouveau') p += 50;
  const reseauxPrix = { instagram: 0, facebook: 30, tiktok: 50, linkedin: 40, youtube: 80 };
  if (Array.isArray(details.c_reseaux)) details.c_reseaux.forEach(r => { p += reseauxPrix[r] || 0; });
  const freqPrix = { '4': 0, '8': 80, '12': 160, '16': 240 };
  p += freqPrix[details.c_freq_post] || 0;
  const storiesPrix = { '0': 0, '4': 60, '8': 110, '12': 160 };
  p += storiesPrix[details.c_stories] || 0;
  const typesPrix = { promo: 30, evenement: 40, temoignage: 20 };
  if (Array.isArray(details.c_types)) details.c_types.forEach(t => { p += typesPrix[t] || 0; });
  if (Array.isArray(details.c_elements) && details.c_elements.includes('rien')) p += 100;
  const disc = details.c_formule === 'trim' ? 0.90 : details.c_formule === 'annuel' ? 0.80 : 1;
  return Math.min(Math.round(p * disc), 999);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, details, email } = req.body;

  if (!type || !details) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  // Calcul du montant côté serveur — jamais depuis le client
  let totalEuros;
  let description;

  if (type === 'spot') {
    totalEuros = calcSpotServeur(details);
    description = 'Spot publicitaire IA — acompte 50%';
  } else if (type === 'comm') {
    const logoFee = { basse: 50, non: 80, hd: 0 }[details.c_logo_qualite] || 0;
    totalEuros = calcCommServeur(details) + logoFee;
    description = 'Communication mensuelle — acompte 50%';
  } else if (type === 'offre_photo') {
    totalEuros = PRIX.offre_photo;
    description = 'Spot animation photos 20s — acompte 50%';
  } else {
    return res.status(400).json({ error: 'Type inconnu' });
  }

  const acompteEuros = Math.round(totalEuros * 0.5);
  const amountCents = acompteEuros * 100;

  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': 'eur',
        'line_items[0][price_data][unit_amount]': amountCents,
        'line_items[0][price_data][product_data][name]': description,
        'line_items[0][quantity]': '1',
        'mode': 'payment',
        'customer_email': email || '',
        'success_url': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://votre-site.vercel.app'}/?payment=success`,
        'cancel_url': `${process.env.NEXT_PUBLIC_SITE_URL || 'https://votre-site.vercel.app'}/?payment=cancel`,
      })
    });

    if (!stripeRes.ok) {
      const err = await stripeRes.text();
      console.error('Stripe error:', err);
      return res.status(500).json({ error: 'Erreur Stripe' });
    }

    const session = await stripeRes.json();
    return res.status(200).json({ url: session.url });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
