// import { useState } from 'react'
// import { CATEGORIAS } from '../utils/database'

// export default function Catalogo({ onAgregar, listaActual }) {
//   const [busqueda, setBusqueda] = useState('')
//   const [categoriasAbiertas, setCategoriasAbiertas] = useState(
//     Object.fromEntries(CATEGORIAS.map(c => [c.id, true]))
//   )

//   const listaIds = new Set(listaActual.map(i => i.id))

//   const toggleCategoria = (id) => {
//     setCategoriasAbiertas(prev => ({ ...prev, [id]: !prev[id] }))
//   }

//   const filtro = busqueda.toLowerCase().trim()

//   const categoriasFiltradas = CATEGORIAS.map(cat => ({
//     ...cat,
//     items: cat.items.filter(item =>
//       !filtro || item.nombre.toLowerCase().includes(filtro)
//     )
//   })).filter(cat => cat.items.length > 0)

//   return (
//     <div>
//       <h1 className="section-title">📦 Catálogo de productos</h1>

      
//       <div className="item-row" style={{ marginBottom: '16px' }}>
//         <span style={{ fontSize: '18px', marginRight: '6px' }}>🔍</span>
//         <input
//           className="input-buscar"
//           placeholder="Buscar producto..."
//           value={busqueda}
//           onChange={e => setBusqueda(e.target.value)}
//         />
//         {busqueda && (
//           <button
//             className="btn-quitar"
//             onClick={() => setBusqueda('')}
//             style={{ marginLeft: '6px' }}
//           >✕</button>
//         )}
//       </div>

//       <p style={{
//         fontFamily: 'var(--font-body)',
//         fontSize: '13px',
//         color: 'var(--ink3)',
//         marginBottom: '12px',
//         position: 'relative',
//         zIndex: 1
//       }}>
//         Tocá un producto para agregarlo a tu lista
//       </p>

//       {categoriasFiltradas.map(cat => (
//         <div key={cat.id} className="catalogo-categoria">
//           <div
//             className="cat-titulo"
//             onClick={() => toggleCategoria(cat.id)}
//           >
//             {cat.nombre}
//             <span style={{ fontSize: '14px', color: 'var(--ink3)' }}>
//               {categoriasAbiertas[cat.id] ? '▲' : '▼'}
//             </span>
//             <span style={{
//               marginLeft: 'auto',
//               fontSize: '12px',
//               color: 'var(--ink3)',
//               fontFamily: 'var(--font-body)'
//             }}>
//               {cat.items.filter(i => listaIds.has(i.id)).length}/{cat.items.length}
//             </span>
//           </div>

//           {categoriasAbiertas[cat.id] && (
//             <div className="catalogo-items">
//               {cat.items.map(item => (
//                 <button
//                   key={item.id}
//                   className={`catalogo-chip ${listaIds.has(item.id) ? 'en-lista' : ''}`}
//                   style={{
//                     background: listaIds.has(item.id) ? 'var(--accent3)' : cat.color,
//                     borderColor: listaIds.has(item.id) ? 'var(--accent3)' : cat.colorBorder,
//                     borderWidth: '2px',
//                     borderStyle: 'solid',
//                   }}
//                   onClick={() => onAgregar({ ...item, categoriaId: cat.id })}
//                 >
//                   {listaIds.has(item.id) ? '✓ ' : ''}
//                   {item.nombre}
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>
//       ))}

//       {categoriasFiltradas.length === 0 && (
//         <p style={{
//           fontFamily: 'var(--font-hand)',
//           fontSize: '18px',
//           color: 'var(--ink3)',
//           padding: '20px 0',
//           textAlign: 'center',
//           position: 'relative',
//           zIndex: 1
//         }}>
//           No encontré "{busqueda}" 🤔<br />
//           <span style={{ fontSize: '15px' }}>Podés agregarlo manual desde la lista</span>
//         </p>
//       )}
//     </div>
//   )
// }


import { useState } from 'react'
import { CATEGORIAS } from '../utils/database'

export default function Catalogo({ onAgregar, onQuitar, listaActual, precios, actualizarPrecios, catalogoCustom = [], actualizarCatalogoCustom }) {
  const [busqueda, setBusqueda] = useState('')
  
  // 1. Armamos el catálogo unificado en caliente
  const todasLasCategorias = CATEGORIAS.map(catFija => {
    const extensionUsuario = catalogoCustom.find(c => c.id === catFija.id)
    return {
      ...catFija,
      items: [...catFija.items, ...(extensionUsuario?.items || [])]
    }
  })

  // Añadimos al final las categorías que son 100% creadas desde cero por el usuario
  catalogoCustom.forEach(catUser => {
    const yaExiste = todasLasCategorias.some(c => c.id === catUser.id)
    if (!yaExiste) {
      todasLasCategorias.push({
        ...catUser,
        items: catUser.items || [],
        custom: true // Bandera explícita para saber que es una categoría 100% creada por el usuario
      })
    }
  })

  // Estado dinámico para colapsar categorías
  const [categoriasCerradas, setCategoriasCerradas] = useState({})
  
  // Modales y formularios
  const [itemSeleccionado, setItemSeleccionado] = useState(null)
  const [cantidad, setQuantity] = useState('1')
  const [precioInput, setPrecioInput] = useState('')
  
  const [mostrarModalCategoria, setMostrarModalCategoria] = useState(false)
  const [nuevaCatNombre, setNuevaCatNombre] = useState('')
  
  const [catSeleccionadaParaProducto, setCatSeleccionadaParaProducto] = useState(null)
  const [nuevoProdNombre, setNuevoProdNombre] = useState('')

  const listaIds = new Set(listaActual.map(i => i.id))

  const toggleCategoria = (id) => {
    setCategoriasCerradas(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const filtro = busqueda.toLowerCase().trim()

  // Filtrado de las categorías según la búsqueda
  const categoriasFiltradas = todasLasCategorias.map(cat => ({
    ...cat,
    items: (cat.items || []).filter(item =>
      !filtro || item.nombre.toLowerCase().includes(filtro)
    )
  })).filter(cat => cat.items.length > 0 || (cat.id.startsWith('cat_custom_') && !filtro))

  const handleTouchProducto = (item, categoriaId) => {
    const precioActual = precios[item.id] || ''
    setItemSeleccionado({ ...item, categoriaId })
    setPrecioInput(precioActual.toString())
    
    const itemEnLista = listaActual.find(i => i.id === item.id)
    setQuantity(itemEnLista ? itemEnLista.cantidad.toString() : '1')
  }

  const handleConfirmarAgregar = (e) => {
    e.preventDefault()
    if (!itemSeleccionado) return

    const cantNum = parseInt(cantidad, 10) || 1
    const precioNum = parseFloat(precioInput) || 0

    if (precioNum !== (precios[itemSeleccionado.id] || 0)) {
      actualizarPrecios({
        ...precios,
        [itemSeleccionado.id]: precioNum
      })
    }

    onAgregar({ ...itemSeleccionado, cantidad: cantNum })
    setItemSeleccionado(null)
  }

  // --- CREAR NUEVA CATEGORÍA DESDE CERO ---
  const handleCrearCategoria = (e) => {
    e.preventDefault()
    if (!nuevaCatNombre.trim()) return

    const nuevaCat = {
      id: 'cat_custom_' + Date.now(),
      nombre: '📁 ' + nuevaCatNombre.trim(),
      color: '#f5f5f5',
      colorBorder: '#ccc',
      items: []
    }

    const nuevoCatalogo = [...catalogoCustom, nuevaCat]
    actualizarCatalogoCustom(nuevoCatalogo)
    
    setNuevaCatNombre('')
    setMostrarModalCategoria(false)
  }

  // --- CREAR NUEVO PRODUCTO ---
  const handleCrearProducto = (e) => {
    e.preventDefault()
    if (!nuevoProdNombre.trim() || !catSeleccionadaParaProducto) return

    const nuevoProducto = {
      id: 'prod_custom_' + Date.now(),
      nombre: nuevoProdNombre.trim()
    }

    let nuevoCatalogo = [...catalogoCustom]
    const indexCat = nuevoCatalogo.findIndex(cat => cat.id === catSeleccionadaParaProducto)

    if (indexCat !== -1) {
      nuevoCatalogo[indexCat] = {
        ...nuevoCatalogo[indexCat],
        items: [...(nuevoCatalogo[indexCat].items || []), nuevoProducto]
      }
    } else {
      const catOriginal = CATEGORIAS.find(c => c.id === catSeleccionadaParaProducto)
      nuevoCatalogo.push({
        id: catSeleccionadaParaProducto,
        nombre: catOriginal ? catOriginal.nombre : 'Categoría',
        items: [nuevoProducto]
      })
    }

    actualizarCatalogoCustom(nuevoCatalogo)
    setNuevoProdNombre('')
    setCatSeleccionadaParaProducto(null)
  }

  // --- ELIMINAR UN PRODUCTO DEL CATÁLOGO ---
  const handleEliminarProductoDelCatalogo = (itemId) => {
    const confirmar = window.confirm("¿Seguro que querés eliminar este producto definitivamente del catálogo?")
    if (!confirmar) return

    if (onQuitar) onQuitar(itemId)

    const nuevoCatalogo = catalogoCustom.map(cat => ({
      ...cat,
      items: (cat.items || []).filter(i => i.id !== itemId)
    })).filter(cat => cat.items.length > 0 || cat.id.startsWith('cat_custom_'))

    actualizarCatalogoCustom(nuevoCatalogo)
    setItemSeleccionado(null)
  }

  // --- NUEVO: ELIMINAR UNA CATEGORÍA COMPLETA PERSONALIZADA ---
  const handleEliminarCategoriaCompleta = (catId) => {
    const confirmar = window.confirm("¿Seguro que querés eliminar esta categoría completa junto con todos sus productos?")
    if (!confirmar) return

    // Opcional: Quitamos de la lista del changuito los productos que pertenecían a esta categoría
    const catABorrar = catalogoCustom.find(c => c.id === catId)
    if (catABorrar && catABorrar.items && onQuitar) {
      catABorrar.items.forEach(item => onQuitar(item.id))
    }

    // Filtramos el catálogo para remover la categoría entera
    const nuevoCatalogo = catalogoCustom.filter(cat => cat.id !== catId)
    
    actualizarCatalogoCustom(nuevoCatalogo)
    setCatSeleccionadaParaProducto(null) // Cerramos el modal si estaba abierto
  }

  return (
    <div style={{ position: 'relative' }}>
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
          <button className="btn-quitar" onClick={() => setBusqueda('')} style={{ marginLeft: '6px' }}>✕</button>
        )}
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--ink3)', marginBottom: '12px' }}>
        Tocá un producto para gestionar cantidad, precio o añadirlo.
      </p>

      {/* AGREGAR CATEGORÍA NUEVA */}
      <button 
        onClick={() => setMostrarModalCategoria(true)}
        style={{
          width: '100%', padding: '10px', background: 'var(--accent2, #5b8dd9)', color: '#fff',
          border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
          marginBottom: '20px', fontSize: '14px'
        }}
      >
        📁 Agregar nueva categoría
      </button>

      {/* Render de Categorías */}
      {categoriasFiltradas.map(cat => {
        const estaAbierta = !categoriasCerradas[cat.id]
        return (
          <div key={cat.id} className="catalogo-categoria" style={{ marginBottom: '16px' }}>
            <div className="cat-titulo" onClick={() => toggleCategoria(cat.id)}>
              {cat.nombre}
              <span style={{ fontSize: '14px', color: 'var(--ink3)' }}>
                {estaAbierta ? '▲' : '▼'}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--ink3)', fontFamily: 'var(--font-body)' }}>
                {(cat.items || []).filter(i => listaIds.has(i.id)).length}/{(cat.items || []).length}
              </span>
            </div>

            {estaAbierta && (
              <div style={{ padding: '8px 4px' }}>
                <div className="catalogo-items">
                  {(cat.items || []).map(item => {
                    const tienePrecio = precios[item.id] !== undefined && precios[item.id] > 0
                    return (
                      <button
                        key={item.id}
                        className={`catalogo-chip ${listaIds.has(item.id) ? 'en-lista' : ''}`}
                        style={{
                          background: listaIds.has(item.id) ? 'var(--accent3)' : cat.color || '#f5f5f5',
                          borderColor: listaIds.has(item.id) ? 'var(--accent3)' : cat.colorBorder || '#ccc',
                          borderWidth: '2px',
                          borderStyle: 'solid',
                          display: 'inline-flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          padding: '6px 12px'
                        }}
                        onClick={() => handleTouchProducto(item, cat.id)}
                      >
                        <span style={{ fontWeight: '500' }}>
                          {listaIds.has(item.id) ? '✓ ' : ''}{item.nombre}
                        </span>
                        {tienePrecio && (
                          <span style={{ fontSize: '10px', opacity: 0.75, fontFamily: 'var(--font-body)' }}>
                            ${precios[item.id]}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setCatSeleccionadaParaProducto(cat.id)}
                  style={{
                    marginTop: '10px', padding: '5px 12px', background: '#fafafa', border: '1px dashed #999',
                    borderRadius: '6px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                    color: 'var(--ink1)'
                  }}
                >
                  ➕ Añadir producto / Gestionar categoría
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* MODAL: CREAR CATEGORÍA */}
      {mostrarModalCategoria && (
        <div className="modal-overlay" onClick={() => setMostrarModalCategoria(false)} style={modalOverlayStyle}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={modalContentStyle}>
            <h3 style={{ margin: '0 0 12px 0' }}>Nueva Categoría</h3>
            <form onSubmit={handleCrearCategoria}>
              <input
                type="text"
                placeholder="Ej: Kiosco, Mascotas, Bebés..."
                value={nuevaCatNombre}
                onChange={e => setNuevaCatNombre(e.target.value)}
                style={inputStyle}
                required
                autoFocus
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type="button" onClick={() => setMostrarModalCategoria(false)} style={{ flex: 1, padding: '8px', background: '#eee', border: 'none', borderRadius: '6px' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '8px', background: 'var(--accent, #4caf50)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GESTIONAR O AÑADIR PRODUCTO A CATEGORÍA */}
      {catSeleccionadaParaProducto && (
        <div className="modal-overlay" onClick={() => setCatSeleccionadaParaProducto(null)} style={modalOverlayStyle}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={modalContentStyle}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Nuevo Producto</h3>
              
              {/* SI LA CATEGORÍA ES PERSONALIZADA (ID EMPIEZA CON cat_custom_), SE MUESTRA EL BOTÓN DE ELIMINARLA COMPLETA */}
              {catSeleccionadaParaProducto.startsWith('cat_custom_') && (
                <button
                  type="button"
                  onClick={() => handleEliminarCategoriaCompleta(catSeleccionadaParaProducto)}
                  style={{ background: 'none', border: 'none', color: '#c62828', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}
                >
                  🗑️ Borrar Categoría
                </button>
              )}
            </div>

            <form onSubmit={handleCrearProducto}>
              <input
                type="text"
                placeholder="Ej: Crema de leche, Detergente..."
                value={nuevoProdNombre}
                onChange={e => setNuevoProdNombre(e.target.value)}
                style={inputStyle}
                required
                autoFocus
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type="button" onClick={() => setCatSeleccionadaParaProducto(null)} style={{ flex: 1, padding: '8px', background: '#eee', border: 'none', borderRadius: '6px' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '8px', background: 'var(--accent, #4caf50)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Añadir</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLES DEL PRODUCTO */}
      {itemSeleccionado && (
        <div className="modal-overlay" onClick={() => setItemSeleccionado(null)} style={modalOverlayStyle}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>{itemSeleccionado.nombre}</h3>
              
              {itemSeleccionado.id.startsWith('prod_custom_') && (
                <button 
                  type="button"
                  onClick={() => handleEliminarProductoDelCatalogo(itemSeleccionado.id)}
                  style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#c62828', marginRight: '8px' }}
                  title="Eliminar permanentemente del catálogo"
                >
                  🗑️ Borrar de Catálogo
                </button>
              )}
              <button onClick={() => setItemSeleccionado(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleConfirmarAgregar}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 'bold' }}>Cantidad de unidades:</label>
                <input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={e => setQuantity(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 'bold' }}>Precio Estimado ($):</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Ej: 45"
                  value={precioInput}
                  onChange={e => setPrecioInput(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {listaIds.has(itemSeleccionado.id) && (
                  <button
                    type="button"
                    onClick={() => { onQuitar(itemSeleccionado.id); setItemSeleccionado(null); }}
                    className="btn-quitar"
                    style={{ flex: 1, padding: '10px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Quitar de Lista
                  </button>
                )}
                <button
                  type="submit"
                  style={{ flex: 2, padding: '10px', background: 'var(--accent3, #4caf50)', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {listaIds.has(itemSeleccionado.id) ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', zIndex: 999
}

const modalContentStyle = {
  background: '#fff', padding: '20px', borderRadius: '12px',
  width: '90%', maxWidth: '320px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
}

const inputStyle = {
  width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box'
}