// api/send-push.js
// Vercel Serverless Function.
// Recibe { paraUid, title, body, url }, busca la suscripción push de ese
// usuario en Firestore (Admin SDK) y le manda la notificación con web-push.

import webpush from 'web-push'
import admin from 'firebase-admin'

// ── Inicializar Firebase Admin (una sola vez) ────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Acepta el formato con \n escapados (texto) o con saltos de línea reales,
      // según cómo haya quedado guardada la variable en Vercel.
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.includes('\\n')
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : process.env.FIREBASE_PRIVATE_KEY,
    }),
  })
}

const db = admin.firestore()

// ── Configurar VAPID para web-push ───────────────────────────────────────────
webpush.setVapidDetails(
  'mailto:yonyviolist1990@gmail.com', // cambiar por un mail de contacto real
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { paraUid, title, body, url } = req.body || {}

  if (!paraUid) {
    return res.status(400).json({ error: 'Falta paraUid' })
  }

  try {
    const userSnap = await db.collection('usuarios').doc(paraUid).get()

    if (!userSnap.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const subscription = userSnap.data().pushSubscription

    if (!subscription) {
      return res.status(404).json({ error: 'La pareja no tiene notificaciones activadas' })
    }

    const payload = JSON.stringify({
      title: title || '🛒 Mercadito',
      body: body || 'Hay una actualización en tu lista',
      url: url || '/',
    })

    await webpush.sendNotification(subscription, payload)

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Error enviando push:', err)

    // Si la suscripción venció o es inválida, limpiarla para no reintentar en vano
    if (err.statusCode === 410 || err.statusCode === 404) {
      await db.collection('usuarios').doc(paraUid).update({
        pushSubscription: admin.firestore.FieldValue.delete(),
      })
      return res.status(410).json({ error: 'La suscripción de la pareja venció, debe reactivar notificaciones' })
    }

    return res.status(500).json({ error: 'Error al enviar la notificación' })
  }
}
