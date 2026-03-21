import { useState } from 'react'
import sullyImg from '../assets/sully.png'
import './Onboarding.css'

export default function Onboarding({ onComplete }) {
  const [paso, setPaso] = useState(0)
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')

  const siguiente = () => {
    if (paso === 1 && !nombre.trim()) {
      setError('Poné tu nombre para continuar')
      return
    }
    if (paso < 2) {
      setPaso(p => p + 1)
      setError('')
    } else {
      onComplete(nombre.trim())
    }
  }

  return (
    <div className="onboarding-bg">
      <div className="onboarding-sheet">

        {/* PASO 1 — Presentación */}
        {paso === 0 && (
          <div className="onboarding-content">
            <div className="onboarding-logo">
              <span className="onboarding-logo-icon">🛒</span>
              <span className="onboarding-logo-text">Mercadito</span>
            </div>
            <div className="onboarding-sully-wrap">
              <img src={sullyImg} alt="Sully" className="onboarding-sully" />
            </div>
            <h1 className="onboarding-title">Tu lista de compras inteligente</h1>
            <p className="onboarding-desc">
              Organizá tus compras por categorías, guardá tu historial y nunca más olvidés nada en el mercado.
            </p>
            <div className="onboarding-feature">
              <span className="onboarding-feature-icon">🤖</span>
              <div>
                <strong>Sully, tu agente IA personal</strong>
                <p>Hablá o escribile a Sully — podés pedirle que agregue productos a tu lista, consultarle qué compraste, pedir recomendaciones y mucho más.</p>
              </div>
            </div>
            <div className="onboarding-feature">
              <span className="onboarding-feature-icon">📊</span>
              <div>
                <strong>Estadísticas de tus compras</strong>
                <p>Seguí qué productos comprás más cada semana y mes.</p>
              </div>
            </div>
            <div className="onboarding-feature">
              <span className="onboarding-feature-icon">🔄</span>
              <div>
                <strong>Repetí compras anteriores</strong>
                <p>Con un toque repetís tu última compra sin tener que armar la lista desde cero.</p>
              </div>
            </div>
            <button className="onboarding-btn" onClick={siguiente}>
              Empezar →
            </button>
          </div>
        )}

        {/* PASO 2 — Nombre */}
        {paso === 1 && (
          <div className="onboarding-content onboarding-centered">
            <img src={sullyImg} alt="Sully" className="onboarding-sully-sm" />
            <h1 className="onboarding-title">¿Cómo te llamás?</h1>
            <p className="onboarding-desc">
              Sully quiere conocerte para poder ayudarte mejor con tus compras.
            </p>
            <input
              className="onboarding-input"
              placeholder="Tu nombre..."
              value={nombre}
              onChange={e => { setNombre(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && siguiente()}
              autoFocus
            />
            {error && <p className="onboarding-error">{error}</p>}
            <button className="onboarding-btn" onClick={siguiente}>
              Continuar →
            </button>
          </div>
        )}

        {/* PASO 3 — Bienvenida */}
        {paso === 2 && (
          <div className="onboarding-content onboarding-centered">
            <img src={sullyImg} alt="Sully" className="onboarding-sully-lg" />
            <h1 className="onboarding-title">¡Bienvenido, {nombre}! 🎉</h1>
            <p className="onboarding-desc">
              Todo listo. Sully ya te está esperando para ayudarte con tus compras.
            </p>
            <p className="onboarding-desc" style={{ marginTop: '8px' }}>
              Disfrutá la experiencia y no dudes en hablarle a Sully cuando lo necesités.
            </p>
            <div className="onboarding-sully-message">
              <p>¡Hola {nombre}! Soy Sully 👋 Estoy acá para ayudarte con todo lo que necesités en el mercado. ¡Vamos juntos! 🛒</p>
            </div>
            <button className="onboarding-btn onboarding-btn-green" onClick={siguiente}>
              ¡Ir al Mercadito! 🚀
            </button>
          </div>
        )}

        {/* Indicador de pasos */}
        <div className="onboarding-dots">
          {[0, 1, 2].map(i => (
            <div key={i} className={`onboarding-dot ${paso === i ? 'active' : ''}`} />
          ))}
        </div>

      </div>
    </div>
  )
}
