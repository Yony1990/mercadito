import { useState } from 'react'
import { CATEGORIAS } from '../utils/database'

export default function Catalogo({ onAgregar, listaActual }) {
  const [busqueda, setBusqueda] = useState('')
  const [categoriasAbiertas, setCategoriasAbiertas] = useState(
    Object.fromEntries(CATEGORIAS.map(c => [c.id, true]))
  )

  const listaIds = new Set(listaActual.map(i => i.id))

  const toggleCategoria = (id) => {
    setCategoriasAbiertas(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const filtro = busqueda.toLowerCase().trim()

  const categoriasFiltradas = CATEGORIAS.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !filtro || item.nombre.toLowerCase().includes(filtro)
    )
  })).filter(cat => cat.items.length > 0)

  return (
    <div>
      <h1 className="section-title">📦 Catálogo de productos</h1>

      {/* Buscador */}
      <div className="item-row" style={{ marginBottom: '16px' }}>
        <span style={{ fontSize: '18px', marginRight: '6px' }}>🔍</span>
        <input
          className="input-buscar"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <button
            className="btn-quitar"
            onClick={() => setBusqueda('')}
            style={{ marginLeft: '6px' }}
          >✕</button>
        )}
      </div>

      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
        color: 'var(--ink3)',
        marginBottom: '12px',
        position: 'relative',
        zIndex: 1
      }}>
        Tocá un producto para agregarlo a tu lista
      </p>

      {categoriasFiltradas.map(cat => (
        <div key={cat.id} className="catalogo-categoria">
          <div
            className="cat-titulo"
            onClick={() => toggleCategoria(cat.id)}
          >
            {cat.nombre}
            <span style={{ fontSize: '14px', color: 'var(--ink3)' }}>
              {categoriasAbiertas[cat.id] ? '▲' : '▼'}
            </span>
            <span style={{
              marginLeft: 'auto',
              fontSize: '12px',
              color: 'var(--ink3)',
              fontFamily: 'var(--font-body)'
            }}>
              {cat.items.filter(i => listaIds.has(i.id)).length}/{cat.items.length}
            </span>
          </div>

          {categoriasAbiertas[cat.id] && (
            <div className="catalogo-items">
              {cat.items.map(item => (
                <button
                  key={item.id}
                  className={`catalogo-chip ${listaIds.has(item.id) ? 'en-lista' : ''}`}
                  style={{
                    background: listaIds.has(item.id) ? 'var(--accent3)' : cat.color,
                    borderColor: listaIds.has(item.id) ? 'var(--accent3)' : cat.colorBorder,
                    borderWidth: '2px',
                    borderStyle: 'solid',
                  }}
                  onClick={() => onAgregar({ ...item, categoriaId: cat.id })}
                >
                  {listaIds.has(item.id) ? '✓ ' : ''}
                  {item.nombre}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {categoriasFiltradas.length === 0 && (
        <p style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '18px',
          color: 'var(--ink3)',
          padding: '20px 0',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          No encontré "{busqueda}" 🤔<br />
          <span style={{ fontSize: '15px' }}>Podés agregarlo manual desde la lista</span>
        </p>
      )}
    </div>
  )
}
