// src/components/Notificaciones.jsx
// Botón campanita simple — escribe en Firestore, sin backend.

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { pedirPermiso, permisoActual, notificarPareja, escucharNotificaciones } from '../utils/notificaciones'

export default function Notificaciones() {
  const { user, userDoc, parejaDoc, grupoId } = useAuth()
  const [estado, setEstado]   = useState('idle') // idle | enviando | ok | error
  const [mensaje, setMensaje] = useState('')

  // Escuchar notificaciones entrantes de la pareja
  useEffect(() => {
    if (!grupoId || !user) return
    const unsub = escucharNotificaciones({
      grupoId,
      miUid: user.uid,
      onRecibida: () => {
        // Opcional: podrías hacer vibrar o parpadear algo en la UI acá
      }
    })
    return unsub
  }, [grupoId, user])

  // Limpiar el mensaje después de 2.5 segundos
  useEffect(() => {
    if (!mensaje) return
    const t = setTimeout(() => {
      setMensaje('')
      setEstado('idle')
    }, 2500)
    return () => clearTimeout(t)
  }, [mensaje])

  const handleClick = async () => {
    if (!parejaDoc) {
      setMensaje('No tenés pareja vinculada')
      setEstado('error')
      return
    }

    // Pedir permiso si no lo tiene aún
    if (permisoActual() !== 'granted') {
      const permiso = await pedirPermiso()
      if (permiso !== 'granted') {
        setMensaje('Permiso de notificaciones denegado')
        setEstado('error')
        return
      }
    }

    setEstado('enviando')
    const nombre = userDoc?.nombre?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Tu pareja'
    const resp = await notificarPareja({ grupoId, deNombre: nombre })

    if (resp.error) {
      setMensaje(resp.error)
      setEstado('error')
    } else {
      setMensaje('¡Notificación enviada!')
      setEstado('ok')
    }
  }

  if (!parejaDoc) return null // Solo mostrar si hay pareja vinculada

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleClick}
        disabled={estado === 'enviando'}
        title="Avisarle a tu pareja que actualizaste la lista"
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: 'none',
          background: estado === 'ok'
            ? '#4caf50'
            : estado === 'error'
            ? '#e53935'
            : '#5b8dd9',
          color: 'white',
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: estado === 'enviando' ? 'wait' : 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          transition: 'background 0.2s, transform 0.1s',
          flexShrink: 0,
        }}
      >
        {estado === 'idle' && <span className="noti-ping" />}
        {estado === 'enviando' ? '...' : estado === 'ok' ? '✓' : '🔔'}
      </button>

      {mensaje && (
        <div style={{
          position: 'absolute',
          top: 44,
          right: 0,
          background: estado === 'error' ? '#ffebee' : '#e8f5e9',
          color: estado === 'error' ? '#c62828' : '#2e7d32',
          padding: '6px 12px',
          borderRadius: 8,
          fontSize: 12,
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          zIndex: 50,
        }}>
          {mensaje}
        </div>
      )}
    </div>
  )
}
