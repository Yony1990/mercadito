export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  try {
    const messages = [
      { role: 'system', content: req.body.system },
      ...req.body.messages
    ]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 1000,
        messages,
      }),
    })

    const data = await response.json()
    const texto = data.choices?.[0]?.message?.content || '¡Uy! Me trabé 😅'
    return res.status(200).json({ content: [{ text: texto }] })
  } catch (error) {
    return res.status(500).json({ error: 'Error al contactar la API' })
  }
}