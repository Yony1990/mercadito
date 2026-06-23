// src/components/Notificaciones.jsx
//
// Botón circular con campanita 🔔, arriba a la derecha.
// - Si el usuario no activó notificaciones todavía, al tocarlo primero
//   pide permiso y se suscribe (silenciosamente la primera vez).
// - Si ya están activadas, tocar el botón le manda un push a la pareja
//   avisando que hay una modificación en la lista.

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { pushSoportado, permisoActual, activarNotificaciones, notificarPareja } from '../utils/push'

export default function Notificaciones() {
  const { user, userDoc, parejaDoc } = useAuth()
  const [estado, setEstado] = useState('idle') // idle | activando | enviando | ok | error
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    if (!mensaje) return
    const t = setTimeout(() => setMensaje(''), 2500)
    return () => clearTimeout(t)
  }, [mensaje])

  const handleClick = async () => {
    if (!pushSoportado()) {
      setMensaje('Tu navegador no soporta notificaciones')
      setEstado('error')
      return
    }

    if (!parejaDoc) {
      setMensaje('Todavía no tenés pareja vinculada')
      setEstado('error')
      return
    }

    // Si no tenemos permiso activado en este navegador, lo pedimos primero
    if (permisoActual() !== 'granted') {
      setEstado('activando')
      const resp = await activarNotificaciones(user.uid)
      if (resp.error) {
        setMensaje(resp.error)
        setEstado('error')
        return
      }
    }

    // Ya con permiso, mandamos el push a la pareja
    setEstado('enviando')
    const resp = await notificarPareja({
      paraUid: parejaDoc.uid,
      deNombre: userDoc?.nombre || user?.displayName,
    })

    if (resp.error) {
      setMensaje(resp.error)
      setEstado('error')
    } else {
      setMensaje('¡Notificación enviada!')
      setEstado('ok')
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleClick}
        disabled={estado === 'activando' || estado === 'enviando'}
        title="Avisarle a tu pareja que actualizaste la lista"
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: 'none',
          background: estado === 'enviando' || estado === 'activando' ? '#cfd8dc' : '#5b8dd9',
          color: 'white',
          fontSize: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          transition: 'background 0.2s, transform 0.1s',
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        🔔
      </button>

      {mensaje && (
        <div
          style={{
            position: 'absolute',
            top: 48,
            right: 0,
            background: estado === 'error' ? '#ffebee' : '#e8f5e9',
            color: estado === 'error' ? '#c62828' : '#2e7d32',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 12,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            zIndex: 50,
          }}
        >
          {mensaje}
        </div>
      )}
    </div>
  )
}
