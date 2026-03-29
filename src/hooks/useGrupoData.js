import { useEffect, useState, useCallback } from 'react'
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

export function useGrupoData(grupoId) {
  const [lista, setLista] = useState([])
  const [historial, setHistorial] = useState([])
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (!grupoId) return

    const ref = doc(db, 'grupos', grupoId)
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setLista(data.lista || [])
        setHistorial(data.historial || [])
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

  return { lista, historial, actualizarLista, actualizarHistorial, syncing }
}
