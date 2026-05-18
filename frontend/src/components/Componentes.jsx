import { Link } from 'react-router-dom';

const PLACEHOLDER_PRODUCTO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="%23F0E9DC" width="400" height="300"/><text fill="%23C45C2E" font-family="Georgia,serif" font-size="14" x="50%" y="50%" text-anchor="middle" dy=".3em">Sin imagen</text></svg>';
const PLACEHOLDER_ARTESANO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="%23F0E9DC" width="200" height="200" rx="100"/><text fill="%23C45C2E" font-family="Georgia,serif" font-size="12" x="50%" y="50%" text-anchor="middle" dy=".3em">✦</text></svg>';

// Estrellas de calificación
export function Estrellas({ valor, max = 5 }) {
  return (
    <span className="estrellas" aria-label={`${valor} de ${max} estrellas`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i}>{i < Math.round(valor) ? '★' : '☆'}</span>
      ))}
    </span>
  );
}

// Tarjeta de producto para el catálogo
export function TarjetaProducto({ producto }) {
  const imagen = producto.imagen_principal
    ? `/uploads/${producto.imagen_principal}`
    : PLACEHOLDER_PRODUCTO;

  return (
    <Link to={`/producto/${producto.id}`} style={{ display: 'block' }}>
      <article className="tarjeta tarjeta-producto">
        <div className="tarjeta-imagen">
          <img
            src={imagen}
            alt={producto.nombre}
            onError={(e) => { e.target.src = PLACEHOLDER_PRODUCTO; }}
            loading="lazy"
          />
          {producto.destacado && <span className="badge badge-ocre tarjeta-badge">Destacado</span>}
        </div>
        <div className="tarjeta-cuerpo">
          {producto.categoria && (
            <span className="badge badge-terracota">{producto.categoria}</span>
          )}
          <h3 className="tarjeta-titulo">{producto.nombre}</h3>
          {producto.artesano_nombre && (
            <p className="tarjeta-artesano">por {producto.artesano_nombre}</p>
          )}
          {parseFloat(producto.calificacion_promedio) > 0 && (
            <div className="tarjeta-calificacion">
              <Estrellas valor={parseFloat(producto.calificacion_promedio)} />
              <span className="calificacion-num">({producto.total_resenas})</span>
            </div>
          )}
          <p className="tarjeta-precio">${Number(producto.precio).toLocaleString('es-MX')} MXN</p>
        </div>
      </article>
    </Link>
  );
}

// Tarjeta de artesano
export function TarjetaArtesano({ artesano }) {
  const foto = artesano.foto_url
    ? `/uploads/${artesano.foto_url}`
    : PLACEHOLDER_ARTESANO;

  return (
    <Link to={`/artesano/${artesano.id}`} style={{ display: 'block' }}>
      <article className="tarjeta tarjeta-artesano">
        <div className="artesano-foto-wrap">
          <img
            src={foto}
            alt={artesano.nombre_completo}
            onError={(e) => { e.target.src = PLACEHOLDER_ARTESANO; }}
          />
          {artesano.verificado && (
            <span className="verificado-badge" title="Artesano verificado">✓</span>
          )}
        </div>
        <div className="tarjeta-cuerpo text-center">
          <h3 className="tarjeta-titulo">{artesano.nombre_completo}</h3>
          {artesano.comunidad && (
            <p className="artesano-comunidad">📍 {artesano.comunidad}</p>
          )}
          {artesano.tecnica_principal && (
            <span className="badge badge-verde">{artesano.tecnica_principal}</span>
          )}
          <p className="artesano-productos mt-1">
            {artesano.total_productos || 0} producto{artesano.total_productos !== '1' ? 's' : ''}
          </p>
        </div>
      </article>
    </Link>
  );
}

// Spinner de carga
export function Cargando() {
  return (
    <div className="cargando-centro">
      <div className="spinner" role="status" aria-label="Cargando..." />
    </div>
  );
}

// Mensaje de vacío
export function Vacio({ mensaje = 'No se encontraron resultados.', icono = '🌿' }) {
  return (
    <div className="vacio text-center">
      <span className="vacio-icono">{icono}</span>
      <p>{mensaje}</p>
    </div>
  );
}
