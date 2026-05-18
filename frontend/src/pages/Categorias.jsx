import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Cargando } from '../components/Componentes';
import '../components/Componentes.css';
import './Categorias.css';

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/categorias')
      .then(res => setCategorias(res.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const iconos = {
    'Textiles': '🧵', 'Cerámica': '🏺', 'Madera': '🪵',
    'Joyería': '💍', 'Cuero': '👜', 'Palma': '🌿',
  };

  if (cargando) return <Cargando />;

  return (
    <main className="contenedor categorias-page">
      <div className="categorias-titulo">
        <h1>Categorías de artesanías</h1>
        <p>Explora la diversidad de tradiciones artesanales de Oaxaca</p>
      </div>

      <div className="grid-categorias">
        {categorias.map(c => (
          <Link key={c.id} to={`/catalogo?categoria=${c.id}`} className="cat-card">
            <div className="cat-card-icono">{iconos[c.nombre] || '✦'}</div>
            <div className="cat-card-info">
              <h3>{c.nombre}</h3>
              {c.descripcion && <p>{c.descripcion}</p>}
              <span className="cat-card-total">{c.total_productos} producto{c.total_productos !== '1' ? 's' : ''}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
