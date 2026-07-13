// src/utils/notificaciones.js
// Sistema simple de notificaciones usando solo Firestore.
// No requiere backend, no requiere service worker, no requiere claves privadas.
// La pareja recibe la notificación nativa del navegador si tiene la app abierta.

import { doc, updateDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export function pedirPermiso() {
  if (!('Notification' in window)) return Promise.resolve('unsupported')
  if (Notification.permission === 'granted') return Promise.resolve('granted')
  return Notification.requestPermission()
}

export function permisoActual() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

// Escribe en Firestore que hay una notificación nueva para la pareja.
// La pareja la detecta con onSnapshot y dispara la notificación local.
export async function notificarPareja({ grupoId, deNombre }) {
  if (!grupoId) return { error: 'No hay grupo conectado' }
  try {
    await updateDoc(doc(db, 'grupos', grupoId), {
      ultimaNotificacion: {
        de: deNombre || 'Tu pareja',
        timestamp: Date.now(),
      }
    })
    return { ok: true }
  } catch (e) {
    console.error('Error notificando:', e)
    return { error: 'No se pudo enviar la notificación' }
  }
}

// Escucha cambios en ultimaNotificacion y dispara la notif del navegador.
// Llamar al iniciar la app. Retorna la función para cancelar la suscripción.
export function escucharNotificaciones({ grupoId, miUid, onRecibida }) {
  if (!grupoId) return () => {}

  let ultimoTimestamp = Date.now() // ignorar notifs viejas al entrar

  const ref = doc(db, 'grupos', grupoId)
  const unsub = onSnapshot(ref, (snap) => {
    if (!snap.exists()) return
    const data = snap.data()
    const notif = data.ultimaNotificacion
    if (!notif) return

    // Solo mostrar si es nueva (posterior a cuando entramos) y no la mandamos nosotros
    if (notif.timestamp > ultimoTimestamp) {
      ultimoTimestamp = notif.timestamp

      if (Notification.permission === 'granted') {
        new Notification('🛒 Mercadito', {
          body: `${notif.de} actualizó la lista de compras`,
          icon: '/icon.png',
          tag: 'mercadito-update',
        })
      }

      onRecibida?.()
    }
  })

  return unsub
}
