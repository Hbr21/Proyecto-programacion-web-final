import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { TarjetaProducto, TarjetaArtesano, Cargando } from '../components/Componentes';
import '../components/Componentes.css';
import './Inicio.css';

export default function Inicio() {
  const [destacados, setDestacados] = useState([]);
  const [artesanos, setArtesanos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/productos/destacados'),
      api.get('/artesanos?limite=4&verificado=true'),
      api.get('/categorias'),
    ]).then(([prod, art, cat]) => {
      setDestacados(prod.data);
      setArtesanos(art.data.artesanos || []);
      setCategorias(cat.data.slice(0, 6));
    }).catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  return (
    <main>
      {/* Hero */}
      <section className="hero decoracion-oaxaca">
        <div className="contenedor hero-inner">
          <div className="hero-texto">
            <p className="hero-supratitulo">Hecho a mano en Oaxaca</p>
            <h1>Arte y tradición en cada pieza</h1>
            <p className="hero-descripcion">
              Conecta directamente con artesanos oaxaqueños y descubre piezas únicas
              tejidas, talladas y moldeadas con siglos de tradición.
            </p>
            <div className="hero-acciones">
              <Link to="/catalogo" className="btn btn-primario btn-lg">Ver catálogo</Link>
              <Link to="/artesanos" className="btn btn-secundario btn-lg">Conocer artesanos</Link>
            </div>
          </div>
          <div className="hero-imagen">
            <div className="hero-imagen-placeholder">
              <span>✦</span>
              <p>Artesanías de Oaxaca</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="seccion">
        <div className="contenedor">
          <div className="seccion-header">
            <h2>Explora por categoría</h2>
            <Link to="/categorias" className="ver-todos">Ver todas →</Link>
          </div>
          <div className="grid-cat">
            {categorias.map(cat => (
              <Link
                key={cat.id}
                to={`/catalogo?categoria=${cat.id}`}
                className="cat-chip"
              >
                <span className="cat-nombre">{cat.nombre}</span>
                <span className="cat-total">{cat.total_productos} productos</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Productos destacados */}
      <section className="seccion seccion-crema">
        <div className="contenedor">
          <div className="seccion-header">
            <h2>Productos destacados</h2>
            <Link to="/catalogo" className="ver-todos">Ver catálogo →</Link>
          </div>
          {cargando ? <Cargando /> : (
            <div className="grid-4">
              {destacados.map(p => <TarjetaProducto key={p.id} producto={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Artesanos verificados */}
      <section className="seccion">
        <div className="contenedor">
          <div className="seccion-header">
            <h2>Artesanos verificados</h2>
            <Link to="/artesanos" className="ver-todos">Ver todos →</Link>
          </div>
          {cargando ? <Cargando /> : (
            <div className="grid-4">
              {artesanos.map(a => <TarjetaArtesano key={a.id} artesano={a} />)}
            </div>
          )}
        </div>
      </section>

      {/* CTA Registro */}
      <section className="seccion-cta">
        <div className="contenedor text-center">
          <h2>¿Eres artesano?</h2>
          <p>Registra tu perfil y comparte tu trabajo con el mundo.</p>
          <Link to="/registro" className="btn btn-primario btn-lg mt-3">Únete gratis</Link>
        </div>
      </section>
    </main>
  );
}
