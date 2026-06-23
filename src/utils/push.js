// src/utils/push.js
// Maneja: registro del Service Worker, pedido de permiso, suscripción push,
// y guardado de la suscripción en Firestore para que la pareja la pueda usar.

import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

// Clave pública VAPID (esta SÍ va en el cliente, es pública por diseño)
const VAPID_PUBLIC_KEY = 'BLKJUs6j2NklSsAfxfnE_T8ZStem7qOSXPD9W2n9Xz8raYSPXsImrvZC2OpshpMPH9zmcGoZmL1JcWSnceU9vVs'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function pushSoportado() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function permisoActual() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission // 'granted' | 'denied' | 'default'
}

// Registra el SW, pide permiso, se suscribe y guarda la suscripción en el usuario.
export async function activarNotificaciones(uid) {
  if (!pushSoportado()) {
    return { error: 'Tu navegador no soporta notificaciones push.' }
  }

  try {
    const permiso = await Notification.requestPermission()
    if (permiso !== 'granted') {
      return { error: 'Permiso de notificaciones denegado.' }
    }

    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }

    // Guardamos la suscripción cruda (JSON) en el doc del usuario
    await updateDoc(doc(db, 'usuarios', uid), {
      pushSubscription: subscription.toJSON(),
    })

    return { ok: true }
  } catch (e) {
    console.error('Error activando notificaciones:', e)
    return { error: 'No se pudo activar la notificación.' }
  }
}

// Llama a la función serverless de Vercel para mandarle el push a la pareja.
export async function notificarPareja({ paraUid, deNombre }) {
  try {
    const res = await fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paraUid,
        title: '🛒 Mercadito',
        body: `${deNombre || 'Tu pareja'} actualizó la lista de compras`,
        url: '/',
      }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error || 'Error al notificar' }
    return { ok: true }
  } catch (e) {
    console.error('Error notificando a la pareja:', e)
    return { error: 'No se pudo enviar la notificación.' }
  }
}
