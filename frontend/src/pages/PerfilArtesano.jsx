import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { TarjetaProducto, Estrellas, Cargando } from '../components/Componentes';
import MapaArtesano from '../components/MapaArtesano';
import '../components/Componentes.css';
import './PerfilArtesano.css';

export default function PerfilArtesano() {
  const { id } = useParams();
  const [artesano, setArtesano] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get(`/artesanos/${id}`)
      .then(res => setArtesano(res.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <Cargando />;
  if (!artesano) return <div className="contenedor mt-4"><p>Artesano no encontrado.</p></div>;

  const foto = artesano.foto_url
  ? artesano.foto_url.startsWith('/uploads/')
    ? artesano.foto_url
    : `/uploads/${artesano.foto_url}`
  : null;

  return (
    <main>
      {/* Encabezado de perfil */}
      <section className="perfil-hero">
        <div className="contenedor perfil-hero-inner">
          <div className="perfil-foto-wrap">
            {foto ? (
              <img src={foto} alt={artesano.nombre_completo} className="perfil-foto" />
            ) : (
              <div className="perfil-foto-placeholder">✦</div>
            )}
            {artesano.verificado && (
              <span className="verificado-badge" title="Artesano verificado">✓</span>
            )}
          </div>

          <div className="perfil-info">
            <div className="perfil-nombre-row">
              <h1>{artesano.nombre_completo}</h1>
              {artesano.verificado && (
                <span className="badge badge-verde">✓ Verificado</span>
              )}
            </div>

            {artesano.tecnica_principal && (
              <p className="perfil-tecnica">{artesano.tecnica_principal}</p>
            )}

            <div className="perfil-meta">
              {artesano.comunidad && <span>📍 {artesano.comunidad}{artesano.municipio ? `, ${artesano.municipio}` : ''}</span>}
              {artesano.region && <span>🗺 {artesano.region}</span>}
              {artesano.anios_experiencia > 0 && <span>⏳ {artesano.anios_experiencia} años de experiencia</span>}
              {artesano.total_productos > 0 && <span>🎨 {artesano.total_productos} productos</span>}
            </div>

            {parseFloat(artesano.calificacion_promedio) > 0 && (
              <div className="perfil-calificacion">
                <Estrellas valor={parseFloat(artesano.calificacion_promedio)} />
                <span>{artesano.calificacion_promedio} promedio</span>
              </div>
            )}

            {artesano.telefono && (
              <a href={`tel:${artesano.telefono}`} className="btn btn-secundario btn-sm">
                📞 {artesano.telefono}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Biografía */}
      {artesano.biografia && (
        <section className="seccion">
          <div className="contenedor perfil-bio-layout">
            <div>
              <h2>Acerca del artesano</h2>
              <p className="perfil-bio">{artesano.biografia}</p>
            </div>
          </div>
        </section>
      )}

      {/* Mapa de ubicación */}
      <section className="seccion seccion-crema">
        <div className="contenedor">
          <h2>Ubicación</h2>
          <p style={{ color: 'var(--texto-suave)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            {artesano.comunidad && `${artesano.comunidad}, `}{artesano.region || 'Oaxaca, México'}
          </p>
          <MapaArtesano
            latitud={artesano.latitud}
            longitud={artesano.longitud}
            nombre={artesano.nombre_completo}
            comunidad={artesano.comunidad || 'Oaxaca'}
          />
        </div>
      </section>

      {/* Productos */}
      <section className="seccion">
        <div className="contenedor">
          <h2>Productos de {artesano.nombre_completo.split(' ')[0]}</h2>
          {artesano.productos?.length === 0 ? (
            <p className="mt-2" style={{ color: 'var(--texto-suave)' }}>Este artesano aún no ha publicado productos.</p>
          ) : (
            <div className="grid-3 mt-3">
              {artesano.productos?.map(p => <TarjetaProducto key={p.id} producto={p} />)}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}