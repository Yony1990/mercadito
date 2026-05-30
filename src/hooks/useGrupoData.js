// import { useEffect, useState, useCallback } from 'react'
// import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore'
// import { db } from '../firebase'

// export function useGrupoData(grupoId) {
//   const [lista, setLista] = useState([])
//   const [historial, setHistorial] = useState([])
//   const [syncing, setSyncing] = useState(false)

//   useEffect(() => {
//     if (!grupoId) return

//     const ref = doc(db, 'grupos', grupoId)
//     const unsub = onSnapshot(ref, (snap) => {
//       if (snap.exists()) {
//         const data = snap.data()
//         setLista(data.lista || [])
//         setHistorial(data.historial || [])
//       }
//     })

//     return unsub
//   }, [grupoId])

//   const actualizarLista = useCallback(async (nuevaLista) => {
//     if (!grupoId) return
//     setSyncing(true)
//     try {
//       await updateDoc(doc(db, 'grupos', grupoId), { lista: nuevaLista })
//     } finally {
//       setSyncing(false)
//     }
//   }, [grupoId])

//   const actualizarHistorial = useCallback(async (nuevoHistorial) => {
//     if (!grupoId) return
//     await updateDoc(doc(db, 'grupos', grupoId), { historial: nuevoHistorial })
//   }, [grupoId])

//   return { lista, historial, actualizarLista, actualizarHistorial, syncing }
// }

import { useEffect, useState, useCallback } from 'react'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

export function useGrupoData(grupoId) {
  const [lista, setLista] = useState([])
  const [historial, setHistorial] = useState([])
  const [precios, setPrecios] = useState({})
  const [catalogoCustom, setCatalogoCustom] = useState([]) // <-- Nuevo estado para el catálogo editable
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (!grupoId) return

    const ref = doc(db, 'grupos', grupoId)
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setLista(data.lista || [])
        setHistorial(data.historial || [])
        setPrecios(data.precios || {})
        setCatalogoCustom(data.catalogoCustom || []) // <-- Trae las categorías personalizadas
      }
    })

    return unsub
  }, [grupoId])

  const actualizarLista = useCallback(async (nuevaLista) => {
    if (!grupoId) return
    setSyncing(true)
    try {
      await updateDoc(doc(db, 'grupos', grupoId), { lista: nuevaLista })
    } finally {
      setSyncing(false)
    }
  }, [grupoId])

  const actualizarHistorial = useCallback(async (nuevoHistorial) => {
    if (!grupoId) return
    await updateDoc(doc(db, 'grupos', grupoId), { historial: nuevoHistorial })
  }, [grupoId])

  const actualizarPrecios = useCallback(async (nuevosPrecios) => {
    if (!grupoId) return
    await updateDoc(doc(db, 'grupos', grupoId), { precios: nuevosPrecios })
  }, [grupoId])

  // <-- Nueva función para guardar el catálogo personalizado en Firestore
  const actualizarCatalogoCustom = useCallback(async (nuevoCatalogo) => {
    if (!grupoId) return
    await updateDoc(doc(db, 'grupos', grupoId), { catalogoCustom: nuevoCatalogo })
  }, [grupoId])

  return { 
    lista, 
    historial, 
    precios, 
    catalogoCustom, // <-- Lo exportamos
    actualizarLista, 
    actualizarHistorial, 
    actualizarPrecios, 
    actualizarCatalogoCustom, // <-- Lo exportamos
    syncing 
  }
}