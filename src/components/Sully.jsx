import { useState, useRef, useEffect, useCallback } from 'react'
import sullyImg from '../assets/sully.png'
import { Mic, MicOff } from 'lucide-react'

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

export default function Sully({ open, setOpen, mensajeInicial, setMensajeInicial, historial, lista, onRepetirUltima, onAgregarItem, darkMode, userName }) {
  const [chatAbierto, setChatAbierto] = useState(false)
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [cargando, setCargando] = useState(false)
  const [hasChatted, setHasChatted] = useState(false)
  const [escuchando, setEscuchando] = useState(false)
  const reconocimientoRef = useRef(null)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)
  const autoCloseRef = useRef(null)

  const escuchar = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Tu browser no soporta el micrófono')
      return
    }
    if (escuchando) {
      reconocimientoRef.current?.stop()
      return
    }
    const rec = new SpeechRecognition()
    // rec.lang = 'es-UY'
    // rec.interimResults = false
    // rec.maxAlternatives = 1
    rec.lang = 'es-UY'
    rec.interimResults = true
    rec.maxAlternatives = 1
    rec.continuous = true
    rec.onstart = () => setEscuchando(true)
    rec.onresult = (e) => {
      let texto = ''
      for (let i = 0; i < e.results.length; i++) {
        texto += e.results[i][0].transcript
      }
      setInput(texto)
    }
    rec.onerror = () => setEscuchando(false)
    rec.onend = () => setEscuchando(false)
    reconocimientoRef.current = rec
    rec.start()
  }

  const d = darkMode

  const c = {
    chatBg:       d ? '#1e1e1e' : 'var(--paper, #fdf9f0)',
    chatBorder:   d ? '2px solid #333' : '2px solid #2aacac',
    headerBg:     d ? '#252525' : 'var(--paper2, #f7f2e4)',
    headerBorder: d ? '1px solid #333' : '1px solid #c8d8f0',
    titleColor:   d ? '#6aaa8a' : '#1a8080',
    subtitleColor:d ? '#555' : '#7a6f8c',
    msgsBg:       d ? '#1e1e1e' : 'transparent',
    sullyMsgBg:   d ? '#252525' : 'var(--paper2, #f7f2e4)',
    sullyMsgColor:d ? '#c0c0c0' : '#2c2035',
    userMsgBg:    d ? '#333' : '#2aacac',
    userMsgColor: d ? '#e0e0e0' : 'white',
    loadingBg:    d ? '#252525' : 'var(--paper2, #f7f2e4)',
    loadingColor: d ? '#555' : '#7a6f8c',
    inputBorder:  d ? '1.5px solid #333' : '1.5px solid #c8d8f0',
    inputBg:      d ? '#252525' : 'var(--paper, #fdf9f0)',
    inputColor:   d ? '#c0c0c0' : 'var(--ink, #2c2035)',
    inputFooter:  d ? '#1e1e1e' : 'transparent',
    footerBorder: d ? '1px solid #333' : '1px solid #c8d8f0',
    sendBg:       d ? '#6aaa8a' : '#2aacac',
    chipBorder:   d ? '1.5px solid #444' : '1.5px solid #2aacac',
    chipColor:    d ? '#888' : '#1a8080',
    closeBtnColor:d ? '#666' : '#7a6f8c',
    bubbleBg:     d ? '#1e1e1e' : 'white',
    bubbleBorder: d ? '2px solid #333' : '2px solid #2aacac',
    bubbleText:   d ? '#c0c0c0' : '#2c2035',
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setChatAbierto(true)
      setMsgs([{
        role: 'sully',
        text: `¡Hola${userName ? ', ' + userName : ''}! 👋 Soy Sully, tu agente de compras. ¿En qué te puedo ayudar hoy? 😄`
      }])
    }, 1500)
    return () => clearTimeout(timer)
  }, [userName])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  useEffect(() => {
    if (!chatAbierto) return
    if (autoCloseRef.current) clearTimeout(autoCloseRef.current)
    autoCloseRef.current = setTimeout(() => {
      setChatAbierto(false)
    }, hasChatted ? 300000 : 20000)
    return () => clearTimeout(autoCloseRef.current)
  }, [chatAbierto, hasChatted])

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

El nombre del usuario es: ${userName || 'desconocido'}. Usá su nombre de vez en cuando en la conversación para hacerla más personal y cercana, pero sin exagerar.

Tu personalidad:
- Hablás en español latinoamericano natural, amigable y cercano
- Sos genuinamente amigable — saludás cuando te saludan, te reís con chistes, tenés humor
- Respondés corto (2-4 oraciones máx) salvo que el tema lo pida
- Cuando no hay datos suficientes, lo decís con onda sin inventar
- Recomendás alimentos saludables si ves que el usuario no los está comprando
- Sos el amigo que sabe de compras pero también puede charlar de cualquier cosa liviana

Datos actuales del usuario:
- Lista de hoy (${lista.length} productos): ${lista.map(i => `${i.nombre}(x${i.cantidad || 1})`).join(', ') || 'vacía'}
- Sobrantes marcados: ${sobrantes.join(', ') || 'ninguno'}
- Compras este mes: ${comprasMes.length} | Esta semana: ${comprasSemana.length} | Total historial: ${historial.length}
- Top este mes: ${contarItems(comprasMes).map(([n, cv]) => `${n}(×${cv})`).join(', ') || 'sin datos aún'}
- Top esta semana: ${contarItems(comprasSemana).map(([n, cv]) => `${n}(×${cv})`).join(', ') || 'sin datos aún'}
- Hoy es: ${ahora.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })}`
  }, [historial, lista, userName])

  const enviar = async (textoOverride) => {
    const texto = (textoOverride || input).trim()
    if (!texto || cargando) return
    setInput('')
    setMsgs(prev => [...prev, { role: 'user', text: texto }])
    setCargando(true)
    setHasChatted(true)
    if (escuchando) {
      reconocimientoRef.current?.stop()
      setEscuchando(false)
    }
    try {
      const context = buildContext()
      const historialChat = msgs.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
      }))
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: context,
          messages: [...historialChat, { role: 'user', content: texto }]
        })
      })
      const data = await response.json()
      const respuesta = data.content?.[0]?.text || '¡Uy! Me trabé 😅 ¿Podés intentar de nuevo?'
      setMsgs(prev => [...prev, { role: 'sully', text: respuesta }])

      if (data.acciones?.length > 0) {
        data.acciones.forEach(accion => {
          if (accion.tipo === 'agregar_item') {
            onAgregarItem({
              id: 'sully_' + Date.now() + Math.random(),
              nombre: accion.nombre,
              categoriaId: 'otros',
              checked: false,
              cantidad: accion.cantidad || 1,
              sobrante: false,
              custom: true
            })
          }
        })
      }
    } catch {
      setMsgs(prev => [...prev, { role: 'sully', text: '¡Ay, me colgué! 😅 Intentá de nuevo.' }])
    } finally {
      setCargando(false)
    }
  }

  const msgActual = mensajeInicial ? MENSAJES[mensajeInicial] : null

  return (
    <div className="sully-widget" style={{ position: 'fixed', bottom: '20px', right: '16px', zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>

      {chatAbierto && (
        <div style={{
          background: c.chatBg, borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)', width: '300px', maxHeight: '420px',
          display: 'flex', flexDirection: 'column', border: c.chatBorder,
          overflow: 'hidden', animation: 'sullyIn 0.25s ease-out',
        }}>
          <style>{`@keyframes sullyIn { from { opacity:0; transform:scale(0.88) translateY(8px) } to { opacity:1; transform:scale(1) } }`}</style>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderBottom: c.headerBorder, background: c.headerBg }}>
            <img src={sullyImg} alt="Sully" style={{ width: 40, height: 40, objectFit: 'contain' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-hand, cursive)', fontSize: '15px', fontWeight: 700, color: c.titleColor }}>Sully</div>
              <div style={{ fontFamily: 'var(--font-body, sans-serif)', fontSize: '11px', color: c.subtitleColor }}>tu agente de compras</div>
            </div>
            <button onClick={() => setChatAbierto(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: c.closeBtnColor, lineHeight: 1 }}>✕</button>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            backgroundImage: darkMode ? 'none' : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cg transform='translate(10,15) rotate(-15 12 14)' opacity='0.18'%3E%3Cellipse cx='12' cy='16' rx='9' ry='10' fill='%23e05252'/%3E%3Cpath d='M12 6 Q15 1 19 3' stroke='%234a8c3f' stroke-width='1.8' fill='none' stroke-linecap='round'/%3E%3C/g%3E%3Cg transform='translate(70,5) rotate(10 12 14)' opacity='0.15'%3E%3Cpath d='M2 4h4l4 12h12l3-9H8' stroke='%235b8dd9' stroke-width='2.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='10' cy='19' r='2.5' fill='%235b8dd9'/%3E%3Ccircle cx='19' cy='19' r='2.5' fill='%235b8dd9'/%3E%3C/g%3E%3Cg transform='translate(140,20) rotate(20 12 16)' opacity='0.18'%3E%3Cellipse cx='12' cy='18' rx='5' ry='10' fill='%23e8734a'/%3E%3C/g%3E%3Cg transform='translate(30,75) rotate(-30 14 12)' opacity='0.18'%3E%3Cpath d='M4 18 Q8 4 20 4 Q22 4 22 8 Q22 12 12 16 Q6 18 4 18Z' fill='%23f5c842'/%3E%3C/g%3E%3Cg transform='translate(70,130) rotate(-8 12 14)' opacity='0.18'%3E%3Ccircle cx='12' cy='15' r='10' fill='%23e05252'/%3E%3C/g%3E%3Cg transform='translate(148,80) rotate(-20 12 12)' opacity='0.18'%3E%3Cellipse cx='12' cy='13' rx='10' ry='8' fill='%23f5d842'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}>
            {msgs.length === 0 && (
              <div style={{ background: c.sullyMsgBg, borderRadius: '12px 12px 12px 4px', padding: '10px 12px', alignSelf: 'flex-start', maxWidth: '92%' }}>
                <p style={{ fontFamily: 'var(--font-hand, cursive)', fontSize: '14px', margin: '0 0 8px', color: c.sullyMsgColor, lineHeight: 1.4 }}>
                  ¡Hola{userName ? ', ' + userName : ''}! 👋 Soy Sully. Preguntame sobre tus compras, pedime recomendaciones, o simplemente charlemos.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {SUGERENCIAS.map(s => (
                    <button key={s} onClick={() => enviar(s)} style={{ fontFamily: 'var(--font-hand, cursive)', fontSize: '12px', padding: '4px 10px', borderRadius: '12px', border: c.chipBorder, background: 'none', cursor: 'pointer', color: c.chipColor, textAlign: 'left' }}>
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
                background: m.role === 'user' ? c.userMsgBg : c.sullyMsgBg,
                color: m.role === 'user' ? c.userMsgColor : c.sullyMsgColor,
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                {m.text}
              </div>
            ))}

            {cargando && (
              <div style={{ fontFamily: 'var(--font-hand, cursive)', fontSize: '14px', padding: '8px 12px', borderRadius: '12px 12px 12px 4px', background: c.loadingBg, color: c.loadingColor, alignSelf: 'flex-start' }}>
                pensando... 🐾
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ display: 'flex', padding: '8px 10px', gap: '6px', borderTop: c.footerBorder, background: c.inputFooter }}>
            <input
              ref={inputRef}
              style={{ flex: 1, fontFamily: 'var(--font-hand, cursive)', fontSize: '16px', border: c.inputBorder, borderRadius: '16px', padding: '6px 12px', outline: 'none', background: c.inputBg, color: c.inputColor }}
              placeholder="Preguntale a Sully..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enviar()}
              disabled={cargando}
            />
            <button
              onClick={escuchar}
              title="Hablar"
              style={{ width: '34px', height: '34px', borderRadius: '50%', background: escuchando ? '#e05252' : (darkMode ? '#333' : '#eee'), border: 'none', cursor: 'pointer', color: escuchando ? 'white' : (darkMode ? '#aaa' : '#555'), display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
            >
              {escuchando ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button
              onClick={() => enviar()}
              disabled={cargando}
              style={{ width: '34px', height: '34px', borderRadius: '50%', background: cargando ? '#aaa' : c.sendBg, border: 'none', cursor: cargando ? 'default' : 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {open && msgActual && !chatAbierto && (
        <div style={{ background: c.bubbleBg, borderRadius: '18px 18px 4px 18px', padding: '12px 16px', maxWidth: '260px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', border: c.bubbleBorder, position: 'relative', animation: 'sullyIn 0.3s ease-out' }}>
          <button onClick={cerrarBurbuja} style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: '#888', border: 'none', color: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <p style={{ fontFamily: 'var(--font-hand, cursive)', fontSize: '15px', color: c.bubbleText, marginBottom: '8px', lineHeight: 1.4 }}>{msgActual.texto}</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {msgActual.acciones.includes('repetir_ultima') && (
              <button className="btn-mini verde" onClick={() => { onRepetirUltima(); cerrarBurbuja() }}>🔄 Repetir última</button>
            )}
            <button className="btn-mini" onClick={cerrarBurbuja}>Gracias Sully</button>
            <button className="btn-mini" onClick={() => { cerrarBurbuja(); setChatAbierto(true) }}>Hablar con él</button>
          </div>
        </div>
      )}

      <img
        src={sullyImg}
        alt="Sully"
        onClick={() => { if (open && msgActual) cerrarBurbuja(); else setChatAbierto(p => !p) }}
        title="Hablar con Sully"
        style={{ width: 80, height: 80, objectFit: 'contain', cursor: 'pointer', transition: 'transform 0.2s ease' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      />
    </div>
  )
}
