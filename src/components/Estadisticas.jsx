export default function Estadisticas({ historial, lista }) {
  const ahora = new Date()
  const inicioSemana = new Date(ahora)
  inicioSemana.setDate(ahora.getDate() - ahora.getDay())
  inicioSemana.setHours(0, 0, 0, 0)

  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  const contarItems = (compras) => {
    const conteo = {}
    compras.forEach(compra => {
      compra.items.forEach(item => {
        if (!conteo[item.id]) conteo[item.id] = { nombre: item.nombre, count: 0 }
        conteo[item.id].count += (item.cantidad || 1)
      })
    })
    return Object.values(conteo).sort((a, b) => b.count - a.count)
  }

  const comprasSemana = historial.filter(c => new Date(c.fecha) >= inicioSemana)
  const comprasMes = historial.filter(c => new Date(c.fecha) >= inicioMes)

  const topSemana = contarItems(comprasSemana).slice(0, 5)
  const topMes = contarItems(comprasMes).slice(0, 5)

  const maxSemana = topSemana[0]?.count || 1
  const maxMes = topMes[0]?.count || 1

  // Items sobrantes de la lista actual
  const sobrantes = lista.filter(i => i.sobrante)

  // Items que aparecen mucho pero no en lista actual
  const listaIds = new Set(lista.map(i => i.id))
  const noUsadosMes = contarItems(comprasMes)
    .filter(i => !listaIds.has(i.id.replace('custom_', '')))
    .slice(0, 5)

  const totalComprasMes = comprasMes.length
  const totalProductosMes = comprasMes.reduce((acc, c) => acc + c.items.length, 0)

  return (
    <div>
      <h1 className="section-title">📊 Estadísticas</h1>

      {/* Resumen rápido */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginBottom: '20px',
        position: 'relative',
        zIndex: 1
      }}>
        <div className="stat-card">
          <div className="stat-label">Compras este mes</div>
          <div className="stat-valor">{totalComprasMes}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--accent2)' }}>
          <div className="stat-label">Productos este mes</div>
          <div className="stat-valor">{totalProductosMes}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--accent3)' }}>
          <div className="stat-label">Compras esta semana</div>
          <div className="stat-valor">{comprasSemana.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#9c27b0' }}>
          <div className="stat-label">Total en historial</div>
          <div className="stat-valor">{historial.length}</div>
        </div>
      </div>

      {/* Top semana */}
      <h2 style={{
        fontFamily: 'var(--font-hand)',
        fontSize: '20px',
        color: 'var(--accent2)',
        marginBottom: '8px',
        position: 'relative',
        zIndex: 1
      }}>
        🔥 Más comprado esta semana
      </h2>

      {topSemana.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '16px', color: 'var(--ink3)', position: 'relative', zIndex: 1, marginBottom: '16px' }}>
          Sin compras esta semana todavía
        </p>
      ) : (
        <ul className="top-list" style={{ marginBottom: '20px' }}>
          {topSemana.map((item, i) => (
            <li key={item.nombre}>
              <span className="top-num">{i + 1}.</span>
              <span style={{ flex: 1, fontFamily: 'var(--font-hand)', fontSize: '17px' }}>
                {item.nombre}
              </span>
              <div className="bar-wrap">
                <div
                  className="bar-fill"
                  style={{ width: `${Math.round((item.count / maxSemana) * 100)}%`, background: 'var(--accent2)' }}
                />
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--ink3)', minWidth: '30px', textAlign: 'right' }}>
                ×{item.count}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Top mes */}
      <h2 style={{
        fontFamily: 'var(--font-hand)',
        fontSize: '20px',
        color: 'var(--accent)',
        marginBottom: '8px',
        position: 'relative',
        zIndex: 1
      }}>
        📅 Más comprado este mes
      </h2>

      {topMes.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '16px', color: 'var(--ink3)', position: 'relative', zIndex: 1, marginBottom: '16px' }}>
          Sin compras registradas este mes
        </p>
      ) : (
        <ul className="top-list" style={{ marginBottom: '20px' }}>
          {topMes.map((item, i) => (
            <li key={item.nombre}>
              <span className="top-num">{i + 1}.</span>
              <span style={{ flex: 1, fontFamily: 'var(--font-hand)', fontSize: '17px' }}>
                {item.nombre}
              </span>
              <div className="bar-wrap">
                <div
                  className="bar-fill"
                  style={{ width: `${Math.round((item.count / maxMes) * 100)}%` }}
                />
              </div>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--ink3)', minWidth: '30px', textAlign: 'right' }}>
                ×{item.count}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Sobrantes */}
      {sobrantes.length > 0 && (
        <>
          <h2 style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '20px',
            color: 'var(--accent2)',
            marginBottom: '8px',
            position: 'relative',
            zIndex: 1
          }}>
            ⚠️ Sobrantes de esta lista
          </h2>
          <ul className="top-list" style={{ marginBottom: '20px' }}>
            {sobrantes.map(item => (
              <li key={item.id}>
                <span style={{ fontFamily: 'var(--font-hand)', fontSize: '17px', color: 'var(--accent2)' }}>
                  {item.nombre} — posiblemente no necesitás comprarlo
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Productos que compraste antes pero no están en lista actual */}
      {noUsadosMes.length > 0 && (
        <>
          <h2 style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '20px',
            color: 'var(--ink3)',
            marginBottom: '8px',
            position: 'relative',
            zIndex: 1
          }}>
            💤 Compraste este mes pero no están en la lista actual
          </h2>
          <ul className="top-list" style={{ marginBottom: '20px' }}>
            {noUsadosMes.map(item => (
              <li key={item.nombre}>
                <span style={{ fontFamily: 'var(--font-hand)', fontSize: '16px', color: 'var(--ink3)' }}>
                  {item.nombre} <span style={{ fontSize: '13px' }}>(×{item.count} este mes)</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {historial.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px 0',
          fontFamily: 'var(--font-hand)',
          fontSize: '18px',
          color: 'var(--ink3)',
          position: 'relative',
          zIndex: 1
        }}>
          Todavía no hay datos suficientes 📊<br />
          <span style={{ fontSize: '15px' }}>Completá algunas compras para ver estadísticas</span>
        </div>
      )}
    </div>
  )
}
