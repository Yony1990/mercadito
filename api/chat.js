export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  try {
    const systemConAcciones = `${req.body.system}

IMPORTANTE — formato de respuesta:
Siempre respondé con un JSON válido con esta estructura exacta (sin markdown, sin backticks, solo JSON puro):
{
  "texto": "tu respuesta aquí",
  "acciones": []
}

Si el usuario pide agregar productos a la lista, incluí las acciones con la cantidad exacta que pidió:
{
  "texto": "¡Listo! Agregué 3 leches y 5 aguacates a tu lista 🛒",
  "acciones": [
    { "tipo": "agregar_item", "nombre": "Leche", "cantidad": 3 },
    { "tipo": "agregar_item", "nombre": "Aguacate", "cantidad": 5 }
  ]
}

Si el usuario no especifica cantidad, usá 1 por defecto.
Si NO hay acciones, mandá un array vacío.
Nunca rompas el formato JSON.`

    const messages = [
      { role: 'system', content: systemConAcciones },
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
        response_format: { type: 'json_object' },
      }),
    })

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content || '{}'

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = { texto: raw, acciones: [] }
    }

    return res.status(200).json({
      content: [{ text: parsed.texto || '¡Uy! No entendí bien 😅' }],
      acciones: parsed.acciones || []
    })
  } catch (error) {
    return res.status(500).json({ error: 'Error al contactar la API' })
  }
}
