import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ParejaManager({ onClose }) {
  const { user, parejaDoc, grupoId, invitarPareja, desvincularPareja } = useAuth()
  const [emailPareja, setEmailPareja] = useState('')
  const [msg, setMsg] = useState('')
  const [msgTipo, setMsgTipo] = useState('ok')
  const [cargando, setCargando] = useState(false)
  const [confirmDesvinc, setConfirmDesvinc] = useState(false)

  const mostrarMsg = (texto, tipo = 'ok') => {
    setMsg(texto)
    setMsgTipo(tipo)
    setTimeout(() => setMsg(''), 4000)
  }

  const invitar = async () => {
    if (!emailPareja.trim()) return
    if (emailPareja.trim() === user.email) {
      mostrarMsg('No podés invitarte a vos mismo', 'error')
      return
    }
    setCargando(true)
    const res = await invitarPareja(emailPareja.trim())
    setCargando(false)
    if (res?.error) {
      mostrarMsg(res.error, 'error')
    } else {
      mostrarMsg('¡Invitación enviada! Que entre a la app y la acepte.')
      setEmailPareja('')
    }
  }

  const handleDesvincular = async () => {
    setCargando(true)
    await desvincularPareja()
    setCargando(false)
    localStorage.removeItem('mercadito_solo')
    window.location.reload()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--paper, #fdf9f0)',
        borderRadius: '16px',
        padding: '28px 24px',
        width: '100%',
        maxWidth: '380px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
        position: 'relative'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '18px', color: 'var(--ink3)'
        }}>✕</button>

        <h2 style={{ fontFamily: 'var(--font-hand)', fontSize: '22px', color: 'var(--accent)', margin: '0 0 20px' }}>
          👫 Mi pareja
        </h2>

        {parejaDoc ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', background: 'var(--paper2)', borderRadius: '12px', padding: '12px' }}>
              <img src={parejaDoc.foto} alt={parejaDoc.nombre} style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid var(--accent)' }} />
              <div>
                <div style={{ fontFamily: 'var(--font-hand)', fontSize: '17px', fontWeight: 700, color: 'var(--ink)' }}>{parejaDoc.nombre}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--ink3)' }}>{parejaDoc.email}</div>
              </div>
            </div>
            {!confirmDesvinc ? (
              <button className="btn-danger" style={{ width: '100%' }} onClick={() => setConfirmDesvinc(true)}>
                Desvincular pareja
              </button>
            ) : (
              <div>
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '15px', color: 'var(--ink2)', marginBottom: '12px' }}>
                  ¿Seguro? Los dos van a perder acceso al grupo compartido.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-danger" onClick={handleDesvincular} disabled={cargando} style={{ flex: 1 }}>
                    {cargando ? 'Desvinculando...' : 'Sí, desvincular'}
                  </button>
                  <button className="btn-secondary" onClick={() => setConfirmDesvinc(false)} style={{ flex: 1 }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '15px', color: 'var(--ink2)', marginBottom: '16px' }}>
              Invitá a tu pareja con su email de Google. Cuando entre a la app va a ver la invitación automáticamente.
            </p>
            <input
              className="input-buscar"
              type="email"
              placeholder="email@gmail.com"
              value={emailPareja}
              onChange={e => setEmailPareja(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && invitar()}
              style={{ marginBottom: '12px', display: 'block', width: '100%', fontSize: '16px' }}
            />
            <button className="btn-primary" onClick={invitar} disabled={cargando || !emailPareja.trim()} style={{ width: '100%' }}>
              {cargando ? 'Enviando...' : 'Enviar invitación'}
            </button>
          </div>
        )}

        {msg && (
          <p style={{
            fontFamily: 'var(--font-hand)', fontSize: '14px',
            color: msgTipo === 'ok' ? 'var(--accent3)' : '#e05252',
            background: msgTipo === 'ok' ? '#e8f5e9' : '#fce4e4',
            padding: '8px 12px', borderRadius: '8px', marginTop: '12px', margin: '12px 0 0'
          }}>
            {msg}
          </p>
        )}
      </div>
    </div>
  )
}
