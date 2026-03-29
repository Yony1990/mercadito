import { createContext, useContext, useEffect, useState } from 'react'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, collection, query, where, getDocs, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userDoc, setUserDoc] = useState(null)
  const [parejaDoc, setParejaDoc] = useState(null)
  const [grupoId, setGrupoId] = useState(null)
  const [loading, setLoading] = useState(true)

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
      }
      setLoading(false)
    })
    return unsub
  }, [])

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
  }

  const loginConGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  }

  const logout = () => signOut(auth)

  const invitarPareja = async (emailPareja) => {
    if (!user) return { error: 'No autenticado' }
    if (emailPareja === user.email) return { error: 'No podés invitarte a vos mismo' }

    // Buscar si la pareja ya existe como usuario
    const q = query(collection(db, 'usuarios'), where('email', '==', emailPareja))
    const snap = await getDocs(q)

    // Crear o actualizar invitación
    const invRef = doc(db, 'invitaciones', `${user.uid}_${emailPareja}`)
    await setDoc(invRef, {
      de: user.uid,
      deEmail: user.email,
      deNombre: user.displayName || user.email,
      para: emailPareja,
      estado: 'pendiente',
      creadaEn: new Date().toISOString()
    })

    return { ok: true, usuarioExiste: !snap.empty }
  }

  const aceptarInvitacion = async (invitacion) => {
    if (!user) return

    // Crear grupo
    const grupoRef = doc(collection(db, 'grupos'))
    await setDoc(grupoRef, {
      miembros: [invitacion.de, user.uid],
      creadoEn: new Date().toISOString(),
      lista: [],
      historial: []
    })

    // Actualizar ambos usuarios con grupoId
    await updateDoc(doc(db, 'usuarios', user.uid), { grupoId: grupoRef.id })
    await updateDoc(doc(db, 'usuarios', invitacion.de), { grupoId: grupoRef.id })

    // Marcar invitación como aceptada
    await updateDoc(doc(db, 'invitaciones', `${invitacion.de}_${user.email}`), {
      estado: 'aceptada'
    })

    setGrupoId(grupoRef.id)
    await cargarPareja(user.uid, grupoRef.id)
    await cargarUsuario(user)
  }

  return (
    <AuthContext.Provider value={{
      user, userDoc, parejaDoc, grupoId, loading,
      loginConGoogle, logout, invitarPareja, aceptarInvitacion
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
