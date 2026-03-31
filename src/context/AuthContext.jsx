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
  const grupoUnsubRef = useRef(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        await cargarUsuario(firebaseUser)
      } else {
        setUser(null)
        setUserDoc(null)
        setParejaDoc(null)
        setGrupoId(null)
        setInvPendiente(null)
        invUnsubRef.current?.()
        grupoUnsubRef.current?.()
      }
      setLoading(false)
    })
    return unsub
  }, [])

  // Escuchar invitaciones SIEMPRE que el usuario esté logueado sin grupo
  // Esto funciona aunque estén en modo "solo"
  useEffect(() => {
    invUnsubRef.current?.()
    if (!user) return

    const q = query(
      collection(db, 'invitaciones'),
      where('para', '==', user.email),
      where('estado', '==', 'pendiente')
    )
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setInvPendiente(snap.docs[0].data())
      } else {
        setInvPendiente(null)
      }
    })
    invUnsubRef.current = unsub
    return unsub
  }, [user])

  // Escuchar cambios en el doc del usuario en tiempo real
  // Esto detecta cuando alguien acepta tu invitación y te asigna grupoId
  useEffect(() => {
    grupoUnsubRef.current?.()
    if (!user) return

    const ref = doc(db, 'usuarios', user.uid)
    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        const nuevoGrupoId = data.grupoId
        if (nuevoGrupoId && nuevoGrupoId !== grupoId) {
          setGrupoId(nuevoGrupoId)
          setUserDoc(data)
          await cargarPareja(user.uid, nuevoGrupoId)
          // Limpiar flag de solo si ahora tiene pareja
          localStorage.removeItem('mercadito_solo')
        }
      }
    })
    grupoUnsubRef.current = unsub
    return unsub
  }, [user, grupoId])

  const cargarUsuario = async (firebaseUser) => {
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
      if (data.grupoId) {
        setGrupoId(data.grupoId)
        await cargarPareja(firebaseUser.uid, data.grupoId)
      }
    }
  }

  const cargarPareja = async (miUid, gId) => {
    try {
      const grupoRef = doc(db, 'grupos', gId)
      const grupoSnap = await getDoc(grupoRef)
      if (grupoSnap.exists()) {
        const miembros = grupoSnap.data().miembros || []
        const parejaUid = miembros.find(uid => uid !== miUid)
        if (parejaUid) {
          const parejaRef = doc(db, 'usuarios', parejaUid)
          const parejaSnap = await getDoc(parejaRef)
          if (parejaSnap.exists()) setParejaDoc(parejaSnap.data())
        }
      }
    } catch (e) {
      console.error('Error cargando pareja:', e)
    }
  }

  const loginConGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  }

  const logout = () => {
    localStorage.removeItem('mercadito_solo')
    signOut(auth)
  }

  const invitarPareja = async (emailPareja) => {
    if (!user) return { error: 'No autenticado' }
    if (emailPareja === user.email) return { error: 'No podés invitarte a vos mismo' }
    try {
      // Borrar invitaciones previas de este usuario para evitar duplicados
      const qPrev = query(collection(db, 'invitaciones'), where('de', '==', user.uid))
      const snapPrev = await getDocs(qPrev)
      snapPrev.forEach(d => deleteDoc(d.ref))

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
    } catch (e) {
      return { error: 'Error al enviar invitación' }
    }
  }

  const aceptarInvitacion = async (invitacion) => {
  if (!user) return
  try {
    // Siempre crear grupo nuevo
    const grupoRef = doc(collection(db, 'grupos'))
    await setDoc(grupoRef, {
      miembros: [invitacion.de, user.uid],
      creadoEn: new Date().toISOString(),
      lista: [],
      historial: []
    })

    // Actualizar ambos usuarios
    await updateDoc(doc(db, 'usuarios', user.uid), { grupoId: grupoRef.id })
    await updateDoc(doc(db, 'usuarios', invitacion.de), { grupoId: grupoRef.id })

    // Marcar invitaciones como aceptadas
    try { await updateDoc(doc(db, 'invitaciones', `${invitacion.de}_${user.email}`), { estado: 'aceptada' }) } catch(e) {}
    try { await updateDoc(doc(db, 'invitaciones', `${user.uid}_${invitacion.deEmail}`), { estado: 'aceptada' }) } catch(e) {}

    setGrupoId(grupoRef.id)
    setUserDoc(prev => ({ ...prev, grupoId: grupoRef.id }))
    setInvPendiente(null)
    localStorage.removeItem('mercadito_solo')
    await cargarPareja(user.uid, grupoRef.id)
  } catch (e) {
    console.error('Error aceptando invitación:', e)
  }
}

  const desvincularPareja = async () => {
    if (!user || !grupoId) return
    try {
      await updateDoc(doc(db, 'usuarios', user.uid), { grupoId: null })
      if (parejaDoc?.uid) {
        await updateDoc(doc(db, 'usuarios', parejaDoc.uid), { grupoId: null })
      }
      const q = query(collection(db, 'invitaciones'), where('de', '==', user.uid))
      const snap = await getDocs(q)
      snap.forEach(d => deleteDoc(d.ref))

      setGrupoId(null)
      setParejaDoc(null)
      setUserDoc(prev => ({ ...prev, grupoId: null }))
    } catch (e) {
      console.error('Error desvinculando:', e)
    }
  }

  return (
    <AuthContext.Provider value={{
      user, userDoc, parejaDoc, grupoId, loading, invPendiente,
      loginConGoogle, logout, invitarPareja, aceptarInvitacion, desvincularPareja,
      setGrupoId, setParejaDoc
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
