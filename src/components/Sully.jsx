import { useState, useRef, useEffect, useCallback } from 'react'
import sullyImg from '../assets/sully.png'

const SUGERENCIAS = [
  '¿Qué compré más este mes?',
  '¿Qué me recomendás agregar?',
  'Contame un chiste',
  '¿Qué productos me sobran?',
]

const MENSAJES = {
  viernes: {
    texto: '¡Eyyy, es viernes! 🎉 ¿Ya hiciste la lista para el fin de semana? ¡No te quedes sin nada en la heladera!',
    acciones: ['repetir_ultima', 'cerrar']
  },
  compra_guardada: {
    texto: '¡Guardada! 🙌 Ya tenés esa compra en el historial. ¡Sos un crack!',
    acciones: ['cerrar']
  },
  lista_repetida: {
    texto: '¡Listo, copié la compra anterior! 🔄 Revisala y ajustá lo que necesités, che.',
    acciones: ['cerrar']
  }
}

export default function Sully({ open, setOpen, mensajeInicial, setMensajeInicial, historial, lista, onRepetirUltima }) {
  const [chatAbierto, setChatAbierto] = useState(false)
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  useEffect(() => {
    if (chatAbierto) setTimeout(() => inputRef.current?.focus(), 100)
  }, [chatAbierto])

  const cerrarBurbuja = () => {
    setOpen(false)
    setMensajeInicial(null)
  }

  const buildContext = useCallback(() => {
    const ahora = new Date()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    const inicioSemana = new Date(ahora)
    inicioSemana.setDate(ahora.getDate() - ahora.getDay())

    const comprasMes = historial.filter(c => new Date(c.fecha) >= inicioMes)
    const comprasSemana = historial.filter(c => new Date(c.fecha) >= inicioSemana)

    const contarItems = (compras) => {
      const conteo = {}
      compras.forEach(c => c.items.forEach(i => {
        if (!conteo[i.nombre]) conteo[i.nombre] = 0
        conteo[i.nombre] += i.cantidad || 1
      }))
      return Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 8)
    }

    const sobrantes = lista.filter(i => i.sobrante).map(i => i.nombre)

    return `Sos Sully, el amigo personal de compras del mercadito. Sos un monstruito turquesa peludo, simpático, divertido y muy cálido.

Tu personalidad:
- Hablás en español rioplatense natural (vos, che, dale, buenísimo, etc.)
- Sos genuinamente amigable — saludás cuando te saludan, te reís con chistes, tenés humor
- Respondés corto (2-4 oraciones máx) salvo que el tema lo pida
- Cuando no hay datos suficientes, lo decís con onda sin inventar
- Recomendás alimentos saludables si ves que el usuario no los está comprando
- Sos el amigo que sabe de compras pero también puede charlar de cualquier cosa liviana

Datos actuales del usuario:
- Lista de hoy (${lista.length} productos): ${lista.map(i => `${i.nombre}(x${i.cantidad || 1})`).join(', ') || 'vacía'}
- Sobrantes marcados: ${sobrantes.join(', ') || 'ninguno'}
- Compras este mes: ${comprasMes.length} | Esta semana: ${comprasSemana.length} | Total historial: ${historial.length}
- Top este mes: ${contarItems(comprasMes).map(([n, c]) => `${n}(×${c})`).join(', ') || 'sin datos aún'}
- Top esta semana: ${contarItems(comprasSemana).map(([n, c]) => `${n}(×${c})`).join(', ') || 'sin datos aún'}
- Hoy es: ${ahora.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })}`
  }, [historial, lista])

  const enviar = async (textoOverride) => {
    const texto = (textoOverride || input).trim()
    if (!texto || cargando) return
    setInput('')
    setMsgs(prev => [...prev, { role: 'user', text: texto }])
    setCargando(true)
    try {
      const context = buildContext()
      const historialChat = msgs.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
      }))
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: context,
          messages: [...historialChat, { role: 'user', content: texto }]
        })
      })
      const data = await response.json()
      const respuesta = data.content?.[0]?.text || '¡Uy! Me trabé 😅 ¿Podés intentar de nuevo?'
      setMsgs(prev => [...prev, { role: 'sully', text: respuesta }])
    } catch {
      setMsgs(prev => [...prev, { role: 'sully', text: '¡Ay, me colgué! 😅 Intentá de nuevo, che.' }])
    } finally {
      setCargando(false)
    }
  }

  const msgActual = mensajeInicial ? MENSAJES[mensajeInicial] : null

  return (
    <div style={{ position: 'fixed', bottom: '16px', right: '16px', zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>

      {/* CHAT */}
      {chatAbierto && (
        <div style={{
          background: 'var(--paper, #fdf9f0)', borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)', width: '300px', maxHeight: '420px',
          display: 'flex', flexDirection: 'column', border: '2px solid #2aacac',
          overflow: 'hidden', animation: 'sullyIn 0.25s ease-out',
        }}>
          <style>{`@keyframes sullyIn { from { opacity:0; transform:scale(0.88) translateY(8px) } to { opacity:1; transform:scale(1) } }`}</style>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderBottom: '1px solid #c8d8f0', background: 'var(--paper2, #f7f2e4)' }}>
            <img src={sullyImg} alt="Sully" style={{ width: 40, height: 40, objectFit: 'contain' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-hand, cursive)', fontSize: '15px', fontWeight: 700, color: '#1a8080' }}>Sully</div>
              <div style={{ fontFamily: 'var(--font-body, sans-serif)', fontSize: '11px', color: '#7a6f8c' }}>tu amigo de compras</div>
            </div>
            <button onClick={() => setChatAbierto(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#7a6f8c', lineHeight: 1 }}>✕</button>
          </div>

          {/* Mensajes */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {msgs.length === 0 && (
              <div style={{ background: 'var(--paper2, #f7f2e4)', borderRadius: '12px 12px 12px 4px', padding: '10px 12px', alignSelf: 'flex-start', maxWidth: '92%' }}>
                <p style={{ fontFamily: 'var(--font-hand, cursive)', fontSize: '14px', margin: '0 0 8px', color: '#2c2035', lineHeight: 1.4 }}>
                  ¡Hola! 👋 Soy Sully. Preguntame sobre tus compras, pedime recomendaciones, o simplemente charlemos, che.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {SUGERENCIAS.map(s => (
                    <button key={s} onClick={() => enviar(s)} style={{ fontFamily: 'var(--font-hand, cursive)', fontSize: '12px', padding: '4px 10px', borderRadius: '12px', border: '1.5px solid #2aacac', background: 'none', cursor: 'pointer', color: '#1a8080', textAlign: 'left' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {msgs.map((m, i) => (
              <div key={i} style={{
                fontFamily: 'var(--font-hand, cursive)', fontSize: '14px',
                padding: '8px 12px', lineHeight: 1.45, maxWidth: '92%',
                borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                background: m.role === 'user' ? '#2aacac' : 'var(--paper2, #f7f2e4)',
                color: m.role === 'user' ? 'white' : '#2c2035',
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                {m.text}
              </div>
            ))}

            {cargando && (
              <div style={{ fontFamily: 'var(--font-hand, cursive)', fontSize: '14px', padding: '8px 12px', borderRadius: '12px 12px 12px 4px', background: 'var(--paper2, #f7f2e4)', color: '#7a6f8c', alignSelf: 'flex-start' }}>
                pensando... 🐾
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ display: 'flex', padding: '8px 10px', gap: '6px', borderTop: '1px solid #c8d8f0' }}>
            <input
              ref={inputRef}
              style={{ flex: 1, fontFamily: 'var(--font-hand, cursive)', fontSize: '14px', border: '1.5px solid #c8d8f0', borderRadius: '16px', padding: '6px 12px', outline: 'none', background: 'var(--paper, #fdf9f0)', color: 'var(--ink, #2c2035)' }}
              placeholder="Preguntale a Sully..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enviar()}
              disabled={cargando}
            />
            <button onClick={() => enviar()} disabled={cargando} style={{ width: '34px', height: '34px', borderRadius: '50%', background: cargando ? '#aaa' : '#2aacac', border: 'none', cursor: cargando ? 'default' : 'pointer', color: 'white', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ➤
            </button>
          </div>
        </div>
      )}

      {/* BURBUJA NOTIFICACIÓN */}
      {open && msgActual && !chatAbierto && (
        <div style={{ background: 'white', borderRadius: '18px 18px 4px 18px', padding: '12px 16px', maxWidth: '260px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '2px solid #2aacac', position: 'relative', animation: 'sullyIn 0.3s ease-out' }}>
          <button onClick={cerrarBurbuja} style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: '#e8a0a0', border: 'none', color: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <p style={{ fontFamily: 'var(--font-hand, cursive)', fontSize: '15px', color: '#2c2035', marginBottom: '8px', lineHeight: 1.4 }}>{msgActual.texto}</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {msgActual.acciones.includes('repetir_ultima') && (
              <button className="btn-mini verde" onClick={() => { onRepetirUltima(); cerrarBurbuja() }}>🔄 Repetir última</button>
            )}
            <button className="btn-mini" onClick={cerrarBurbuja}>Gracias Sully</button>
            <button className="btn-mini" onClick={() => { cerrarBurbuja(); setChatAbierto(true) }}>Hablar con él</button>
          </div>
        </div>
      )}

      {/* BOTÓN SULLY */}
      <img
        src={sullyImg}
        alt="Sully"
        onClick={() => { if (open && msgActual) cerrarBurbuja(); else setChatAbierto(p => !p) }}
        title="Hablar con Sully"
        // style={{
        //   width: 80,
        //   height: 80,
        //   objectFit: 'contain',
        //   cursor: 'pointer',
        //   transition: 'transform 0.2s ease',
        //   filter: open && msgActual && !chatAbierto ? 'drop-shadow(0 0 8px #2aacac)' : 'none',
        // }}
        style={{
          width: 80,
          height: 80,
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      />

    </div>
  )
}
