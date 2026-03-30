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
  
  // El hook useGrupoData ahora se activará solo si grupoId existe
  const { lista: listaFirestore, historial: historialFirestore, actualizarLista, actualizarHistorial, syncing } = useGrupoData(grupoId)

  const [tab, setTab] = useState('lista')
  const [mostrarParejaManager, setMostrarParejaManager] = useState(false)
  const [sullyOpen, setSullyOpen] = useState(false)
  const [sullyMensaje, setSullyMensaje] = useState(null)
  const [aceptandoInv, setAceptandoInv] = useState(false)

  // Estados locales solo para modo Offline/Solo
  const [listaLocal, setListaLocal] = useState(() => JSON.parse(localStorage.getItem('mercadito_lista') || '[]'))
  const [historialLocal, setHistorialLocal] = useState(() => JSON.parse(localStorage.getItem('mercadito_historial') || '[]'))

  // Persistencia local (solo si no hay grupoId)
  useEffect(() => { if (!grupoId) localStorage.setItem('mercadito_lista', JSON.stringify(listaLocal)) }, [listaLocal, grupoId])
  useEffect(() => { if (!grupoId) localStorage.setItem('mercadito_historial', JSON.stringify(historialLocal)) }, [historialLocal, grupoId])

  // LÓGICA DE DATOS: Si hay grupoId usa Firestore, si no usa Local
  const lista = grupoId ? listaFirestore : listaLocal
  const historial = grupoId ? historialFirestore : historialLocal

  const setLista = (fn) => {
    const nueva = typeof fn === 'function' ? fn(lista) : fn
    if (grupoId) actualizarLista(nueva); else setListaLocal(nueva);
  }

  const setHistorial = (fn) => {
    const nuevo = typeof fn === 'function' ? fn(historial) : fn
    if (grupoId) actualizarHistorial(nuevo); else setHistorialLocal(nuevo);
  }

  // --- Lógica de Renderizado ---
  if (loading) return <div className="loading-screen">Cargando Mercadito...</div>
  if (!user) return <Login />

  // Si no tiene grupo y no ha marcado "continuar solo", forzamos pantalla de vinculación (Login)
  const continuarSolo = localStorage.getItem('mercadito_solo')
  if (!grupoId && !continuarSolo) return <Login />

  // Onboarding (Nombre)
  const nombreGuardado = localStorage.getItem('mercadito_nombre')
  if (!nombreGuardado) {
    return <Onboarding onComplete={(n) => {
      localStorage.setItem('mercadito_nombre', n)
      window.location.reload()
    }} />
  }

  // Handlers
  const agregarItem = (item) => {
    setLista(prev => prev.find(i => i.id === item.id) ? prev : [...prev, { ...item, checked: false, cantidad: 1, sobrante: false }])
    setTab('lista')
  }

  const finalizarCompra = () => {
    const compraActual = { id: Date.now(), fecha: new Date().toISOString(), items: lista.map(i => ({ ...i })) }
    setHistorial(prev => [compraActual, ...prev.slice(0, 19)])
    setLista([])
    setSullyMensaje('compra_guardada'); setSullyOpen(true)
  }

  return (
    <div className="app-container">
      {/* Banner de invitación (si entra solo pero le llega una inv) */}
      {invPendiente && !grupoId && (
        <div className="invitation-banner">
          <span>🎉 {invPendiente.deNombre} te invitó</span>
          <button onClick={() => aceptarInvitacion(invPendiente)}>Aceptar</button>
        </div>
      )}

      <aside className="sidebar">
        <div className="sidebar-logo">
          <ShoppingBag size={26} color="var(--accent)" />
          <span className="logo-text">Mercadito</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.id} className={`nav-btn ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}>
              {item.icon} <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        {parejaDoc ? (
          <div className="sidebar-pareja" onClick={() => setMostrarParejaManager(true)}>
            <img src={parejaDoc.foto} className="pareja-avatar" alt="" />
            <div>
              <div className="pareja-nombre">{parejaDoc.nombre?.split(' ')[0]}</div>
              <div className="pareja-label">en línea {syncing && '🔄'}</div>
            </div>
          </div>
        ) : (
          <button className="nav-btn" onClick={() => setMostrarParejaManager(true)}>
            <Users size={18} /> <span className="nav-label">Invitar pareja</span>
          </button>
        )}
        <button className="btn-logout" onClick={logout}><LogOut size={14} /> Salir</button>
      </aside>

      <main className="app-main">
        <div className="notebook-lines">
          {tab === 'lista' && <ListaActiva lista={lista} setLista={setLista} onFinalizar={finalizarCompra} historial={historial} onRepetir={(c) => { setLista(c.items.map(i => ({...i, checked: false}))); setTab('lista') }} />}
          {tab === 'catalogo' && <Catalogo onAgregar={agregarItem} listaActual={lista} />}
          {tab === 'historial' && <Historial historial={historial} onRepetir={(c) => { setLista(c.items.map(i => ({...i, checked: false}))); setTab('lista') }} />}
          {tab === 'stats' && <Estadisticas historial={historial} lista={lista} />}
        </div>
      </main>

      {mostrarParejaManager && <ParejaManager onClose={() => setMostrarParejaManager(false)} />}
      
      <Sully 
        open={sullyOpen} setOpen={setSullyOpen} 
        mensajeInicial={sullyMensaje} setMensajeInicial={setSullyMensaje}
        historial={historial} lista={lista}
        onAgregarItem={agregarItem}
        userName={nombreGuardado}
      />
    </div>
  )
}