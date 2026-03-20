export default function Historial({ historial, onRepetir }) {
  const formatFecha = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('es-UY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (historial.length === 0) {
    return (
      <div>
        <h1 className="section-title">📚 Historial de compras</h1>
        <p style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '18px',
          color: 'var(--ink3)',
          padding: '30px 0',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          Todavía no finalizaste ninguna compra 🛒<br/>
          <span style={{ fontSize: '15px' }}>¡Completá tu primera lista!</span>
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="section-title">📚 Historial de compras</h1>

      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
        color: 'var(--ink3)',
        marginBottom: '16px',
        position: 'relative',
        zIndex: 1
      }}>
        {historial.length} compra{historial.length !== 1 ? 's' : ''} guardada{historial.length !== 1 ? 's' : ''}
      </p>

      {historial.map((compra, idx) => {
        const itemsPreview = compra.items.slice(0, 5).map(i => i.nombre).join(', ')
        const mas = compra.items.length > 5 ? ` y ${compra.items.length - 5} más...` : ''
        const checkeados = compra.items.filter(i => i.checked).length

        return (
          <div key={compra.id} className="historial-card">
            {idx === 0 && (
              <span style={{
                fontSize: '11px',
                background: 'var(--accent)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '10px',
                fontFamily: 'var(--font-body)',
                marginBottom: '6px',
                display: 'inline-block'
              }}>
                Última compra
              </span>
            )}
            <div className="historial-fecha">
              📅 {formatFecha(compra.fecha)}
            </div>
            <div className="historial-items-preview">
              {itemsPreview}{mas}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                color: 'var(--ink3)'
              }}>
                {compra.items.length} productos · {checkeados} comprados
              </span>
              <button className="btn-mini verde" onClick={() => onRepetir(compra)}>
                🔄 Repetir esta compra
              </button>
              <button
                className="btn-mini"
                onClick={() => {
                  const detalle = compra.items.map(i =>
                    `• ${i.nombre} x${i.cantidad || 1}${i.checked ? ' ✓' : ''}`
                  ).join('\n')
                  alert(`Compra del ${formatFecha(compra.fecha)}\n\n${detalle}`)
                }}
              >
                Ver detalle
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
