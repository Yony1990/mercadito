import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import sullyImg from '../assets/sully.png'
import './Login.css'

export default function Login() {
  const { user, userDoc, grupoId, loginConGoogle, logout, invitarPareja, aceptarInvitacion } = useAuth()
  const [vista, setVista] = useState('login') // login | espera | invitar | pendiente
  const [emailPareja, setEmailPareja] = useState('')
  const [invPendiente, setInvPendiente] = useState(null)
  const [msg, setMsg] = useState('')
  const [cargando, setCargando] = useState(false)

  // Si ya tiene grupo, no debería estar acá
  useEffect(() => {
    if (grupoId) return

    if (user) {
      setVista('espera')
      // Escuchar invitaciones pendientes para este usuario
      const q = query(
        collection(db, 'invitaciones'),
        where('para', '==', user.email),
        where('estado', '==', 'pendiente')
      )
      const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          setInvPendiente(snap.docs[0].data())
          setVista('invitacion_recibida')
        }
      })
      return unsub
    }
  }, [user, grupoId])

  const handleLogin = async () => {
    setCargando(true)
    try {
      await loginConGoogle()
    } catch (e) {
      setMsg('Error al iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  const handleInvitar = async () => {
    if (!emailPareja.trim()) return
    setCargando(true)
    const res = await invitarPareja(emailPareja.trim())
    setCargando(false)
    if (res.error) {
      setMsg(res.error)
    } else {
      setMsg('¡Invitación enviada! Esperá que tu pareja inicie sesión y acepte.')
      setVista('pendiente')
    }
  }

  const handleAceptar = async () => {
    setCargando(true)
    await aceptarInvitacion(invPendiente)
    setCargando(false)
  }

  return (
    <div className="login-bg">
      <div className="login-sheet">

        {/* LOGIN INICIAL */}
        {!user && (
          <div className="login-content">
            <img src={sullyImg} alt="Sully" className="login-sully" />
            <h1 className="login-title">Bienvenido a Mercadito</h1>
            <p className="login-desc">Tu app de compras compartida con tu pareja</p>
            <button className="login-btn-google" onClick={handleLogin} disabled={cargando}>
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.1 29 5 24 5 13 5 4 14 4 25s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-4z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c2.8 0 5.3 1 7.2 2.7l5.7-5.7C33.5 7.1 29 5 24 5c-7.7 0-14.3 4.4-17.7 9.7z"/>
                <path fill="#4CAF50" d="M24 45c5 0 9.5-1.9 12.9-5l-6-4.9C29.3 36.5 26.8 37 24 37c-5.2 0-9.6-3.3-11.3-8L6.1 33.7C9.5 40.4 16.2 45 24 45z"/>
                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6 4.9C40.5 35.4 44 30.7 44 25c0-1.3-.1-2.7-.4-4z"/>
              </svg>
              {cargando ? 'Iniciando...' : 'Continuar con Google'}
            </button>
          </div>
        )}

        {/* USUARIO LOGUEADO SIN PAREJA */}
        {user && vista === 'espera' && (
          <div className="login-content">
            <img src={user.photoURL} alt={user.displayName} className="login-avatar" />
            <h2 className="login-title">Hola, {user.displayName?.split(' ')[0]}!</h2>
            <p className="login-desc">Para usar Mercadito necesitás conectarte con tu pareja</p>
            <div className="login-opciones">
              <button className="login-btn-primary" onClick={() => setVista('invitar')}>
                Invitar a mi pareja
              </button>
              <p className="login-o">o esperá a que te inviten</p>
            </div>
            <button className="login-btn-text" onClick={logout}>Cerrar sesión</button>
          </div>
        )}

        {/* INVITAR PAREJA */}
        {user && vista === 'invitar' && (
          <div className="login-content">
            <img src={sullyImg} alt="Sully" className="login-sully-sm" />
            <h2 className="login-title">Invitá a tu pareja</h2>
            <p className="login-desc">Ingresá el email de Google de tu pareja</p>
            <input
              className="login-input"
              type="email"
              placeholder="email@gmail.com"
              value={emailPareja}
              onChange={e => { setEmailPareja(e.target.value); setMsg('') }}
              onKeyDown={e => e.key === 'Enter' && handleInvitar()}
            />
            {msg && <p className="login-msg">{msg}</p>}
            <button className="login-btn-primary" onClick={handleInvitar} disabled={cargando || !emailPareja.trim()}>
              {cargando ? 'Enviando...' : 'Enviar invitación'}
            </button>
            <button className="login-btn-text" onClick={() => setVista('espera')}>← Volver</button>
          </div>
        )}

        {/* ESPERANDO ACEPTACIÓN */}
        {user && vista === 'pendiente' && (
          <div className="login-content login-centered">
            <div className="login-spinner" />
            <h2 className="login-title">Esperando a tu pareja...</h2>
            <p className="login-desc">Le enviamos una invitación a <strong>{emailPareja}</strong>. Cuando inicie sesión y la acepte, ¡ya pueden empezar!</p>
            <button className="login-btn-text" onClick={() => setVista('invitar')}>Cambiar email</button>
            <button className="login-btn-text" onClick={logout}>Cerrar sesión</button>
          </div>
        )}

        {/* INVITACIÓN RECIBIDA */}
        {user && vista === 'invitacion_recibida' && invPendiente && (
          <div className="login-content login-centered">
            <img src={sullyImg} alt="Sully" className="login-sully" />
            <h2 className="login-title">¡Te invitaron!</h2>
            <p className="login-desc">
              <strong>{invPendiente.deNombre}</strong> ({invPendiente.deEmail}) te invita a compartir su Mercadito
            </p>
            <button className="login-btn-primary" onClick={handleAceptar} disabled={cargando}>
              {cargando ? 'Conectando...' : '¡Aceptar y entrar!'}
            </button>
            <button className="login-btn-text" onClick={logout}>Rechazar</button>
          </div>
        )}

      </div>
    </div>
  )
}
