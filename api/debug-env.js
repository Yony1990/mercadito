// api/debug-env.js
//
// ⚠️ ENDPOINT TEMPORAL DE DIAGNÓSTICO — borrar después de resolver el problema.
// No expone valores reales, solo si cada variable existe y su longitud,
// para confirmar cuáles llegaron bien a Vercel y cuáles están vacías/mal.

export default function handler(req, res) {
  const vars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY',
  ]

  const resultado = {}

  for (const key of vars) {
    const val = process.env[key]
    resultado[key] = {
      existe: val !== undefined && val !== null && val !== '',
      longitud: val ? val.length : 0,
      empiezaCon: val ? val.slice(0, 15) : null,
      terminaCon: val ? val.slice(-15) : null,
      contieneSaltosReales: val ? val.includes('\n') : false,
      contieneBarraNLiteral: val ? val.includes('\\n') : false,
    }
  }

  return res.status(200).json(resultado)
}
