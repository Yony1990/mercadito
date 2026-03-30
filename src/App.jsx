import { useState, useEffect } from 'react'
import { ShoppingCart, BookOpen, History, BarChart2, ShoppingBag, LogOut, Users } from 'lucide-react'
import ListaActiva from './components/ListaActiva'
import Catalogo from './components/Catalogo'
import Historial from './components/Historial'
import Estadisticas from './components/Estadisticas'
import Sully from './components/Sully'
import Onboarding from './components/Onboarding'
import Login from './components/Login'
import ParejaManager from './components/ParejaManager'
import { useAuth } from './context/AuthContext'
import { useGrupoData } from './hooks/useGrupoData'
import './App.css'

const NAV_ITEMS = [
  { id: 'lista',     icon: <ShoppingCart size={18} />, label: 'Mi Lista' },
  { id: 'catalogo',  icon: <BookOpen size={18} />,     label: 'Catálogo' },
  { id: 'historial', icon: <History size={18} />,      label: 'Historial' },
  { id: 'stats',     icon: <BarChart2 size={18} />,    label: 'Stats' },
]

export default function App() {
  const { user, userDoc, parejaDoc, grupoId, loading, logout, invPendiente, aceptarInvitacion } = useAuth()
  const { lista: listaFirestore, historial: historialFirestore, actualizarLista, actualizarHistorial, syncing } = useGrupoData(grupoId)

  const [mostrarParejaManager, setMostrarParejaManager] = useState(false)
  const [mostrarInvBanner, setMostrarInvBanner] = useState(false)
  const [tab, setTab] = useState('lista')
  const [sullyOpen, setSullyOpen] = useState(false)
  const [sullyMensaje, setSullyMensaje] = useState(null)
  const [userName, setUserName] = useState('')
  const [aceptandoInv, setAceptandoInv] = useState(false)

  const [listaLocal, setListaLocal] = useState(() => {
    const s = localStorage.getItem('mercadito_lista')
    return s ? JSON.parse(s) : []
  })
  const [historialLocal, setHistorialLocal] = useState(() => {
    const s = localStorage.getItem('mercadito_historial')
    return s ? JSON.parse(s) : []
  })

  useEffect(() => {
    if (!grupoId) localStorage.setItem('mercadito_lista', JSON.stringify(listaLocal))
  }, [listaLocal, grupoId])

  useEffect(() => {
    if (!grupoId) localStorage.setItem('mercadito_historial', JSON.stringify(historialLocal))
  }, [historialLocal, grupoId])

  const lista = grupoId ? listaFirestore : listaLocal
  const historial = grupoId ? historialFirestore : historialLocal

  const setLista = (fn) => {
    if (grupoId) {
      const nueva = typeof fn === 'function' ? fn(lista) : fn
      actualizarLista(nueva)
    } else {
      setListaLocal(fn)
    }
  }

  const setHistorial = (fn) => {
    if (grupoId) {
      const nuevo = typeof fn === 'function' ? fn(historial) : fn
      actualizarHistorial(nuevo)
    } else {
      setHistorialLocal(fn)
    }
  }

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

  // Mostrar banner de invitación pendiente dentro de la app
  useEffect(() => {
    if (invPendiente && !grupoId) {
      setMostrarInvBanner(true)
    } else {
      setMostrarInvBanner(false)
    }
  }, [invPendiente, grupoId])

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

  const handleAceptarInv = async () => {
    setAceptandoInv(true)
    await aceptarInvitacion(invPendiente)
    setAceptandoInv(false)
    setMostrarInvBanner(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#d4c9b8' }}>
        <div style={{ fontFamily: 'cursive', fontSize: '24px', color: '#5b8dd9' }}>Cargando...</div>
      </div>
    )
  }

  if (!user) return <Login />

  const continuarSolo = localStorage.getItem('mercadito_solo')
  if (!grupoId && !continuarSolo) return <Login />

  const nombreGuardado = localStorage.getItem('mercadito_nombre')
  if (!nombreGuardado) {
    return <Onboarding onComplete={(n) => {
      localStorage.setItem('mercadito_nombre', n)
      setUserName(n)
      window.location.reload()
    }} />
  }

  return (
    <div className="app-container">

      {/* BANNER INVITACIÓN PENDIENTE dentro de la app */}
      {mostrarInvBanner && invPendiente && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 3000,
          background: '#4caf7d', color: 'white', padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: '12px',
          fontFamily: 'var(--font-hand)', fontSize: '15px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)'
        }}>
          <span>🎉 <strong>{invPendiente.deNombre?.split(' ')[0]}</strong> te invitó a compartir su Mercadito</span>
          <button onClick={handleAceptarInv} disabled={aceptandoInv} style={{
            marginLeft: 'auto', background: 'white', color: '#4caf7d',
            border: 'none', borderRadius: '16px', padding: '4px 14px',
            fontFamily: 'var(--font-hand)', fontSize: '14px', cursor: 'pointer', fontWeight: 700
          }}>
            {aceptandoInv ? 'Conectando...' : 'Aceptar'}
          </button>
          <button onClick={() => setMostrarInvBanner(false)} style={{
            background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '18px'
          }}>✕</button>
        </div>
      )}

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
          <button className="nav-btn" style={{ marginTop: 'auto' }} onClick={() => setMostrarParejaManager(true)}>
            <span className="nav-icon"><Users size={18} /></span>
            <span className="nav-label">Invitar pareja</span>
          </button>
        )}

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
        <button className="mobile-nav-btn" onClick={() => setMostrarParejaManager(true)}>
          <span className="mobile-nav-icon">
            {parejaDoc
              ? <img src={parejaDoc.foto} style={{ width: 20, height: 20, borderRadius: '50%' }} alt="" />
              : <Users size={18} />
            }
          </span>
          <span>{parejaDoc ? parejaDoc.nombre?.split(' ')[0] : 'Pareja'}</span>
        </button>
        <button className="mobile-nav-btn" onClick={logout}>
          <span className="mobile-nav-icon"><LogOut size={18} /></span>
          <span>Salir</span>
        </button>
        <div className="toggle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <input className="toggle-input" type="checkbox" checked={darkMode} onChange={() => setDarkMode(p => !p)} />
          <div className="toggle-bg"></div>
          <div className="toggle-switch">
            <div className="toggle-switch-figure"></div>
            <div className="toggle-switch-figureAlt"></div>
          </div>
        </div>
      </nav>

      {mostrarParejaManager && <ParejaManager onClose={() => setMostrarParejaManager(false)} />}

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
