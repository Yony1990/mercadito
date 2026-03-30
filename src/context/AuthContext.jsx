import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userDoc, setUserDoc] = useState(null)
  const [parejaDoc, setParejaDoc] = useState(null)
  const [grupoId, setGrupoId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [invPendiente, setInvPendiente] = useState(null)
  const invUnsubRef = useRef(null)
  const userUnsubRef = useRef(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // 1. Cargamos datos iniciales
        await cargarUsuarioInicial(firebaseUser)
        // 2. Activamos escucha en tiempo real del perfil del usuario
        activarEscuchaUsuario(firebaseUser.uid)
      } else {
        setUser(null)
        setUserDoc(null)
        setParejaDoc(null)
        setGrupoId(null)
        setInvPendiente(null)
        invUnsubRef.current?.()
        userUnsubRef.current?.()
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // Escuchar el documento del usuario para detectar cuando se le asigna un grupoId
  const activarEscuchaUsuario = (uid) => {
    userUnsubRef.current?.()
    const ref = doc(db, 'usuarios', uid)
    userUnsubRef.current = onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setUserDoc(data)
        
        // Si detectamos un nuevo grupoId, lo activamos y limpiamos el modo "solo"
        if (data.grupoId && data.grupoId !== grupoId) {
          console.log("¡Grupo vinculado detectado!");
          setGrupoId(data.grupoId)
          localStorage.removeItem('mercadito_solo') // Forzamos modo sincronizado
          await cargarPareja(uid, data.grupoId)
        }
      }
    })
  }

  // Escuchar invitaciones pendientes
  useEffect(() => {
    invUnsubRef.current?.()
    if (!user) return

    const q = query(
      collection(db, 'invitaciones'),
      where('para', '==', user.email),
      where('estado', '==', 'pendiente')
    )
    invUnsubRef.current = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setInvPendiente(snap.docs[0].data())
      } else {
        setInvPendiente(null)
      }
    })
    return () => invUnsubRef.current?.()
  }, [user])

  const cargarUsuarioInicial = async (firebaseUser) => {
    const ref = doc(db, 'usuarios', firebaseUser.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      const nuevoUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        nombre: firebaseUser.displayName,
        foto: firebaseUser.photoURL,
        grupoId: null,
        creadoEn: new Date().toISOString()
      }
      await setDoc(ref, nuevoUser)
      setUserDoc(nuevoUser)
    } else {
      const data = snap.data()
      setUserDoc(data)
      if (data.grupoId) setGrupoId(data.grupoId)
    }
  }

  const cargarPareja = async (miUid, gId) => {
    try {
      const grupoSnap = await getDoc(doc(db, 'grupos', gId))
      if (grupoSnap.exists()) {
        const miembros = grupoSnap.data().miembros || []
        const parejaUid = miembros.find(uid => uid !== miUid)
        if (parejaUid) {
          const parejaSnap = await getDoc(doc(db, 'usuarios', parejaUid))
          if (parejaSnap.exists()) setParejaDoc(parejaSnap.data())
        }
      }
    } catch (e) { console.error(e) }
  }

  const loginConGoogle = async () => await signInWithPopup(auth, googleProvider)
  const logout = () => {
    localStorage.removeItem('mercadito_solo')
    signOut(auth)
  }

  const invitarPareja = async (emailPareja) => {
    if (!user) return { error: 'No autenticado' }
    try {
      const invRef = doc(db, 'invitaciones', `${user.uid}_${emailPareja}`)
      await setDoc(invRef, {
        de: user.uid,
        deEmail: user.email,
        deNombre: user.displayName || user.email,
        para: emailPareja,
        estado: 'pendiente',
        creadaEn: new Date().toISOString()
      })
      return { ok: true }
    } catch (e) { return { error: 'Error al enviar' } }
  }

  const aceptarInvitacion = async (invitacion) => {
    if (!user) return
    try {
      const grupoRef = doc(collection(db, 'grupos'))
      await setDoc(grupoRef, {
        miembros: [invitacion.de, user.uid],
        creadoEn: new Date().toISOString(),
        lista: [],
        historial: []
      })
      await updateDoc(doc(db, 'usuarios', user.uid), { grupoId: grupoRef.id })
      await updateDoc(doc(db, 'usuarios', invitacion.de), { grupoId: grupoRef.id })
      const invId = `${invitacion.de}_${user.email}`
      await updateDoc(doc(db, 'invitaciones', invId), { estado: 'aceptada' })
    } catch (e) { console.error(e) }
  }

  const desvincularPareja = async () => {
    if (!user || !grupoId) return
    await updateDoc(doc(db, 'usuarios', user.uid), { grupoId: null })
    if (parejaDoc?.uid) await updateDoc(doc(db, 'usuarios', parejaDoc.uid), { grupoId: null })
    setGrupoId(null); setParejaDoc(null);
  }

  return (
    <AuthContext.Provider value={{
      user, userDoc, parejaDoc, grupoId, loading, invPendiente,
      loginConGoogle, logout, invitarPareja, aceptarInvitacion, desvincularPareja
    }}>
      {children}
    </AuthContext.Provider>
  )
}
export const useAuth = () => useContext(AuthContext)