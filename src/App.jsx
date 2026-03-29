import { useState, useEffect } from 'react'
import { ShoppingCart, BookOpen, History, BarChart2, ShoppingBag, LogOut } from 'lucide-react'
import ListaActiva from './components/ListaActiva'
import Catalogo from './components/Catalogo'
import Historial from './components/Historial'
import Estadisticas from './components/Estadisticas'
import Sully from './components/Sully'
import Onboarding from './components/Onboarding'
import Login from './components/Login'
import { useAuth } from './context/AuthContext'
import { useGrupoData } from './hooks/useGrupoData'
import ParejaManager from './components/ParejaManager'
import './App.css'

const NAV_ITEMS = [
  { id: 'lista',     icon: <ShoppingCart size={18} />, label: 'Mi Lista' },
  { id: 'catalogo',  icon: <BookOpen size={18} />,     label: 'Catálogo' },
  { id: 'historial', icon: <History size={18} />,      label: 'Historial' },
  { id: 'stats',     icon: <BarChart2 size={18} />,    label: 'Stats' },
]

export default function App() {
  const { user, userDoc, parejaDoc, grupoId, loading, logout } = useAuth()
  const { lista, historial, actualizarLista, actualizarHistorial, syncing } = useGrupoData(grupoId)

  const [mostrarParejaManager, setMostrarParejaManager] = useState(false)

  const [tab, setTab] = useState('lista')
  const [sullyOpen, setSullyOpen] = useState(false)
  const [sullyMensaje, setSullyMensaje] = useState(null)
  const [userName, setUserName] = useState('')

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('mercadito_theme')
    if (saved) return saved === 'dark'
    return false
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('mercadito_theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    if (userDoc?.nombre) {
      const primerNombre = userDoc.nombre.split(' ')[0]
      setUserName(primerNombre)
      localStorage.setItem('mercadito_nombre', primerNombre)
    }
  }, [userDoc])

  useEffect(() => {
    const hoy = new Date()
    const esViernes = hoy.getDay() === 5
    const yaVio = localStorage.getItem('mercadito_viernes_' + hoy.toDateString())
    if (esViernes && !yaVio && grupoId) {
      setTimeout(() => {
        setSullyMensaje('viernes')
        setSullyOpen(true)
        localStorage.setItem('mercadito_viernes_' + hoy.toDateString(), '1')
      }, 2000)
    }
  }, [grupoId])

  const setLista = (fn) => {
    const nueva = typeof fn === 'function' ? fn(lista) : fn
    actualizarLista(nueva)
  }

  const setHistorial = (fn) => {
    const nuevo = typeof fn === 'function' ? fn(historial) : fn
    actualizarHistorial(nuevo)
  }

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

  // Loading
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#d4c9b8' }}>
        <div style={{ fontFamily: 'cursive', fontSize: '24px', color: '#5b8dd9' }}>Cargando...</div>
      </div>
    )
  }

  // Sin login o sin pareja
  if (!user || !grupoId) {
    return <Login />
  }

  // Onboarding nombre (solo si no tiene)
  const nombreGuardado = localStorage.getItem('mercadito_nombre')
  if (!nombreGuardado) {
    return <Onboarding onComplete={(n) => {
      localStorage.setItem('mercadito_nombre', n)
      setUserName(n)
    }} />
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo">
            <ShoppingBag size={26} color="var(--accent)" strokeWidth={2} />
            <span className="logo-text">Mercadito</span>
          </div>
          <div className="toggle">
            <input className="toggle-input" type="checkbox" checked={darkMode} onChange={() => setDarkMode(p => !p)} />
            <div className="toggle-bg"></div>
            <div className="toggle-switch">
              <div className="toggle-switch-figure"></div>
              <div className="toggle-switch-figureAlt"></div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.id} className={`nav-btn ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Info pareja */}
        {/* {parejaDoc && (
          <div className="sidebar-pareja">
            <img src={parejaDoc.foto} alt={parejaDoc.nombre} className="pareja-avatar" />
            <div>
              <div className="pareja-nombre">{parejaDoc.nombre?.split(' ')[0]}</div>
              <div className="pareja-label">tu pareja</div>
            </div>
            {syncing && <div className="sync-dot" title="Sincronizando..." />}
          </div>
        )} */}
        {parejaDoc ? (
          <div className="sidebar-pareja" onClick={() => setMostrarParejaManager(true)} style={{ cursor: 'pointer' }}>
            <img src={parejaDoc.foto} alt={parejaDoc.nombre} className="pareja-avatar" />
            <div>
              <div className="pareja-nombre">{parejaDoc.nombre?.split(' ')[0]}</div>
              <div className="pareja-label">tu pareja ✏️</div>
            </div>
            {syncing && <div className="sync-dot" />}
          </div>
        ) : (
          <button className="btn-secondary" style={{ marginTop: 'auto', fontSize: '14px' }} onClick={() => setMostrarParejaManager(true)}>
            + Invitar pareja
          </button>
        )}

        {mostrarParejaManager && <ParejaManager onClose={() => setMostrarParejaManager(false)} />}

        <button className="btn-logout" onClick={logout}>
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </aside>

      <main className="app-main">
        <div className="notebook-lines">
          {tab === 'lista' && <ListaActiva lista={lista} setLista={setLista} onFinalizar={finalizarCompra} historial={historial} onRepetir={repetirCompra} />}
          {tab === 'catalogo' && <Catalogo onAgregar={agregarItem} listaActual={lista} />}
          {tab === 'historial' && <Historial historial={historial} onRepetir={repetirCompra} />}
          {tab === 'stats' && <Estadisticas historial={historial} lista={lista} />}
        </div>
      </main>

      <nav className="mobile-nav">
        {NAV_ITEMS.map(item => (
          <button key={item.id} className={`mobile-nav-btn ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}>
            <span className="mobile-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        <div className="toggle">
          <input className="toggle-input" type="checkbox" checked={darkMode} onChange={() => setDarkMode(p => !p)} />
          <div className="toggle-bg"></div>
          <div className="toggle-switch">
            <div className="toggle-switch-figure"></div>
            <div className="toggle-switch-figureAlt"></div>
          </div>
        </div>
      </nav>

      <Sully
        open={sullyOpen} setOpen={setSullyOpen}
        mensajeInicial={sullyMensaje} setMensajeInicial={setSullyMensaje}
        historial={historial} lista={lista}
        onRepetirUltima={() => { if (historial.length > 0) repetirCompra(historial[0]) }}
        onAgregarItem={(item) => setLista(prev => {
          const existe = prev.find(i => i.nombre.toLowerCase() === item.nombre.toLowerCase())
          if (existe) return prev
          return [...prev, item]
        })}
        darkMode={darkMode}
        userName={userName}
      />
    </div>
  )
}
