import { useState } from 'react'
import { CATEGORIAS, getCategoria } from '../utils/database'

export default function ListaActiva({ lista, setLista, onFinalizar, historial, onRepetir }) {
  const [mostrarConfirm, setMostrarConfirm] = useState(false)
  const [itemCustom, setItemCustom] = useState('')

  const toggleCheck = (id) => {
    setLista(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
  }

  const cambiarCantidad = (id, delta) => {
    setLista(prev => prev.map(i => {
      if (i.id !== id) return i
      const nueva = Math.max(1, (i.cantidad || 1) + delta)
      return { ...i, cantidad: nueva }
    }))
  }

  const toggleSobrante = (id) => {
    setLista(prev => prev.map(i => i.id === id ? { ...i, sobrante: !i.sobrante } : i))
  }

  const quitarItem = (id) => {
    setLista(prev => prev.filter(i => i.id !== id))
  }

  const agregarCustom = () => {
    if (!itemCustom.trim()) return
    const nuevo = {
      id: 'custom_' + Date.now(),
      nombre: itemCustom.trim(),
      categoriaId: 'otros',
      checked: false,
      cantidad: 1,
      sobrante: false,
      custom: true
    }
    setLista(prev => [...prev, nuevo])
    setItemCustom('')
  }

  const checkeados = lista.filter(i => i.checked).length
  const total = lista.length
  const pct = total > 0 ? Math.round((checkeados / total) * 100) : 0
  const sobrantes = lista.filter(i => i.sobrante)

  const ultimaCompra = historial[0]

  // Agrupar por categoría
  const porCategoria = {}
  lista.forEach(item => {
    const cat = getCategoria(item.id) || { id: 'otros', nombre: '📦 Otros', color: '#f5f5f5', colorBorder: '#ccc' }
    if (!porCategoria[cat.id]) porCategoria[cat.id] = { cat, items: [] }
    porCategoria[cat.id].items.push(item)
  })

  return (
    <div>
      <h1 className="section-title">✏️ Mi lista de hoy</h1>

      {total === 0 ? (
        <div className="lista-vacia">
          <p>¡Lista vacía! 🛒</p>
          <p style={{ fontSize: '16px', marginTop: '8px' }}>Agregá productos desde el <strong>Catálogo</strong></p>
          {ultimaCompra && (
            <div style={{ marginTop: '20px' }}>
              <button className="btn-secondary" onClick={() => onRepetir(ultimaCompra)}>
                🔄 Repetir última compra
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Progreso */}
          <div className="progreso-wrap">
            <div className="progreso-bar-wrap">
              <div className="progreso-bar-fill" style={{ width: pct + '%' }} />
            </div>
            <span className="progreso-texto">{checkeados}/{total} ✓</span>
          </div>

          {/* Items por categoría */}
          {Object.values(porCategoria).map(({ cat, items }) => (
            <div key={cat.id} style={{ marginBottom: '8px' }}>
              <div style={{
                fontSize: '13px',
                fontFamily: 'var(--font-body)',
                color: 'var(--ink3)',
                padding: '4px 0',
                borderBottom: `2px solid ${cat.colorBorder || '#eee'}`,
                marginBottom: '4px'
              }}>
                {cat.nombre}
              </div>
              {items.map(item => (
                <div key={item.id} className="item-row">
                  <div
                    className={`item-check ${item.checked ? 'checked' : ''}`}
                    onClick={() => toggleCheck(item.id)}
                  >
                    {item.checked && '✓'}
                  </div>

                  <span className={`item-nombre ${item.checked ? 'tachado' : ''}`}>
                    {item.nombre}
                  </span>

                  {!item.checked && (
                    <>
                      <div className="item-cantidad">
                        <button className="btn-cantidad" onClick={() => cambiarCantidad(item.id, -1)}>−</button>
                        <span className="cantidad-num">{item.cantidad || 1}</span>
                        <button className="btn-cantidad" onClick={() => cambiarCantidad(item.id, 1)}>+</button>
                      </div>

                      <button
                        className={`btn-sobrante ${item.sobrante ? 'activo' : ''}`}
                        onClick={() => toggleSobrante(item.id)}
                        title="Marcar como sobrante del mes anterior"
                      >
                        {item.sobrante ? '⚠️ sobra' : 'sobra?'}
                      </button>
                    </>
                  )}

                  <button className="btn-quitar" onClick={() => quitarItem(item.id)}>✕</button>
                </div>
              ))}
            </div>
          ))}

          {/* Sobrantes aviso */}
          {sobrantes.length > 0 && (
            <div className="sobrantes-nota">
              ⚠️ <strong>{sobrantes.length} producto{sobrantes.length > 1 ? 's' : ''}</strong> marcado{sobrantes.length > 1 ? 's' : ''} como sobrante: {sobrantes.map(s => s.nombre).join(', ')}. ¿Querés quitarlos?
              <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
                <button className="btn-mini" onClick={() => {
                  setLista(prev => prev.filter(i => !i.sobrante))
                }}>Quitar todos</button>
                <button className="btn-mini" onClick={() => {
                  setLista(prev => prev.map(i => ({ ...i, sobrante: false })))
                }}>Dejar igual</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Agregar item custom */}
      <div className="item-row" style={{ marginTop: '12px' }}>
        <span style={{ color: 'var(--accent2)', fontSize: '18px', marginRight: '4px' }}>+</span>
        <input
          className="input-agregar-custom"
          placeholder="Agregar producto manual..."
          value={itemCustom}
          onChange={e => setItemCustom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && agregarCustom()}
        />
        {itemCustom && (
          <button className="btn-mini verde" onClick={agregarCustom}>Agregar</button>
        )}
      </div>

      <hr className="divider" />

      {/* Acciones */}
      <div className="lista-acciones">
        {total > 0 && (
          <>
            {!mostrarConfirm ? (
              <button className="btn-primary" onClick={() => setMostrarConfirm(true)}>
                ✅ Finalizar compra
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '15px', color: 'var(--ink2)' }}>
                  ¿Guardar esta compra en el historial?
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-primary" onClick={() => { onFinalizar(); setMostrarConfirm(false) }}>
                    Sí, guardar
                  </button>
                  <button className="btn-danger" onClick={() => { setLista([]); setMostrarConfirm(false) }}>
                    No, descartar
                  </button>
                  <button className="btn-secondary" onClick={() => setMostrarConfirm(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {ultimaCompra && total === 0 && (
          <button className="btn-secondary" onClick={() => onRepetir(ultimaCompra)}>
            🔄 Repetir última compra
          </button>
        )}
      </div>
    </div>
  )
}
