// api/correct.js — Vercel Edge Function
// Proxy sécurisé pour l'API Anthropic
// La clé API reste côté serveur, jamais exposée au client

export default async function handler(req, res) {
  // Seulement POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const API_KEY = process.env.ANTHROPIC_API_KEY;
    
    if (!API_KEY) {
      console.error('Missing ANTHROPIC_API_KEY');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Récupère les messages du frontend
    const { messages, model, max_tokens, system } = req.body;

    if (!messages) {
      return res.status(400).json({ error: 'Missing messages' });
    }

    // Appelle Anthropic avec la clé sécurisée
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY, // ← Sécurisé côté serveur
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: max_tokens || 4000,
        system: system || 'Vous êtes un correcteur pédagogique expert.',
        messages: messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic error:', data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
