import { useState, useEffect } from 'react'
import ListaActiva from './components/ListaActiva'
import Catalogo from './components/Catalogo'
import Historial from './components/Historial'
import Estadisticas from './components/Estadisticas'
import Sully from './components/Sully'
import './App.css'

export default function App() {
  const [tab, setTab] = useState('lista')
  const [lista, setLista] = useState(() => {
    const saved = localStorage.getItem('mercadito_lista')
    return saved ? JSON.parse(saved) : []
  })
  const [historial, setHistorial] = useState(() => {
    const saved = localStorage.getItem('mercadito_historial')
    return saved ? JSON.parse(saved) : []
  })
  const [sullyOpen, setSullyOpen] = useState(false)
  const [sullyMensaje, setSullyMensaje] = useState(null)

  useEffect(() => {
    localStorage.setItem('mercadito_lista', JSON.stringify(lista))
  }, [lista])

  useEffect(() => {
    localStorage.setItem('mercadito_historial', JSON.stringify(historial))
  }, [historial])

  // Notificación viernes
  useEffect(() => {
    const hoy = new Date()
    const esViernes = hoy.getDay() === 5
    const yaVio = localStorage.getItem('mercadito_viernes_' + hoy.toDateString())
    if (esViernes && !yaVio) {
      setTimeout(() => {
        setSullyMensaje('viernes')
        setSullyOpen(true)
        localStorage.setItem('mercadito_viernes_' + hoy.toDateString(), '1')
      }, 2000)
    }
  }, [])

  const agregarItem = (item) => {
    setLista(prev => {
      const existe = prev.find(i => i.id === item.id)
      if (existe) return prev
      return [...prev, { ...item, checked: false, cantidad: 1, sobrante: false }]
    })
    setTab('lista')
  }

  const finalizarCompra = () => {
    const compraActual = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      items: lista.map(i => ({ ...i }))
    }
    setHistorial(prev => [compraActual, ...prev.slice(0, 19)])
    setLista([])
    setSullyMensaje('compra_guardada')
    setSullyOpen(true)
  }

  const repetirCompra = (compra) => {
    const nuevaLista = compra.items.map(i => ({ ...i, checked: false, sobrante: false }))
    setLista(nuevaLista)
    setTab('lista')
    setSullyMensaje('lista_repetida')
    setSullyOpen(true)
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-logo">
          <span className="logo-icon">🛒</span>
          <span className="logo-text">Mercadito</span>
        </div>
        <nav className="app-nav">
          <button className={`nav-btn ${tab === 'lista' ? 'active' : ''}`} onClick={() => setTab('lista')}>
            Mi Lista
          </button>
          <button className={`nav-btn ${tab === 'catalogo' ? 'active' : ''}`} onClick={() => setTab('catalogo')}>
            Catálogo
          </button>
          <button className={`nav-btn ${tab === 'historial' ? 'active' : ''}`} onClick={() => setTab('historial')}>
            Historial
          </button>
          <button className={`nav-btn ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
            Stats
          </button>
        </nav>
      </header>

      <main className="app-main">
        <div className="notebook-lines">
          {tab === 'lista' && (
            <ListaActiva
              lista={lista}
              setLista={setLista}
              onFinalizar={finalizarCompra}
              historial={historial}
              onRepetir={repetirCompra}
            />
          )}
          {tab === 'catalogo' && (
            <Catalogo onAgregar={agregarItem} listaActual={lista} />
          )}
          {tab === 'historial' && (
            <Historial historial={historial} onRepetir={repetirCompra} />
          )}
          {tab === 'stats' && (
            <Estadisticas historial={historial} lista={lista} />
          )}
        </div>
      </main>

      <Sully
        open={sullyOpen}
        setOpen={setSullyOpen}
        mensajeInicial={sullyMensaje}
        setMensajeInicial={setSullyMensaje}
        historial={historial}
        lista={lista}
        onRepetirUltima={() => {
          if (historial.length > 0) repetirCompra(historial[0])
        }}
      />
    </div>
  )
}
