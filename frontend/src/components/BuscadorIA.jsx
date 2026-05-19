import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './BuscadorIA.css';

export default function BuscadorIA() {
  const [consulta, setConsulta] = useState('');
  const [resultados, setResultados] = useState([]);
  const [explicacion, setExplicacion] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [error, setError] = useState('');

  const ejemplos = [
    'algo azul para regalo',
    'artesanía barata menos de 500 pesos',
    'tapete de lana tejido a mano',
    'cerámica de barro negro',
    'algo único y tradicional',
  ];

  const buscar = async (texto) => {
    const q = texto || consulta;
    if (!q.trim()) return;

    setBuscando(true);
    setBuscado(false);
    setError('');
    setResultados([]);
    setExplicacion('');

    try {
      const res = await api.post('/gemini/buscar', { consulta: q });
      setResultados(res.data.productos || []);
      setExplicacion(res.data.explicacion || '');
      setBuscado(true);
    } catch (err) {
      setError('Error al realizar la búsqueda. Intenta de nuevo.');
    } finally {
      setBuscando(false);
    }
  };

  const handleEjemplo = (ejemplo) => {
    setConsulta(ejemplo);
    buscar(ejemplo);
  };

  return (
    <div className="buscador-ia">
      {/* Encabezado */}
      <div className="buscador-ia-header">
        <span className="buscador-ia-icono">✨</span>
        <div>
          <h2>Búsqueda inteligente</h2>
          <p>Describe lo que buscas con tus propias palabras</p>
        </div>
      </div>

      {/* Input de búsqueda */}
      <div className="buscador-ia-input-wrap">
        <input
          type="text"
          className="buscador-ia-input"
          placeholder="Ej. algo azul para regalo de cumpleaños..."
          value={consulta}
          onChange={e => setConsulta(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && buscar()}
          disabled={buscando}
        />
        <button
          className="buscador-ia-btn"
          onClick={() => buscar()}
          disabled={buscando || !consulta.trim()}
        >
          {buscando ? (
            <span className="buscador-ia-cargando">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </span>
          ) : (
            'Buscar con IA'
          )}
        </button>
      </div>

      {/* Ejemplos */}
      {!buscado && !buscando && (
        <div className="buscador-ia-ejemplos">
          <span className="ejemplos-label">Prueba con:</span>
          {ejemplos.map((ej, i) => (
            <button key={i} className="ejemplo-chip" onClick={() => handleEjemplo(ej)}>
              {ej}
            </button>
          ))}
        </div>
      )}

      {/* Estado cargando */}
      {buscando && (
        <div className="buscador-ia-estado">
          <div className="spinner" />
          <p>Gemini está analizando tu búsqueda...</p>
        </div>
      )}

      {/* Error */}
      {error && <div className="alerta alerta-error">{error}</div>}

      {/* Explicación de Gemini */}
      {buscado && explicacion && (
        <div className="buscador-ia-explicacion">
          <span>🤖</span>
          <p>{explicacion}</p>
        </div>
      )}

      {/* Resultados */}
      {buscado && (
        <>
          {resultados.length === 0 ? (
            <div className="buscador-ia-vacio">
              <span>🌿</span>
              <p>No encontré productos para "<strong>{consulta}</strong>"</p>
              <p>Intenta con otras palabras o explora el <Link to="/catalogo">catálogo completo</Link>.</p>
            </div>
          ) : (
            <div className="buscador-ia-resultados">
              <p className="resultados-total">{resultados.length} producto{resultados.length !== 1 ? 's' : ''} encontrado{resultados.length !== 1 ? 's' : ''}</p>
              <div className="resultados-grid">
                {resultados.map(p => (
                  <Link key={p.id} to={`/producto/${p.id}`} className="resultado-card">
                    <div className="resultado-imagen">
                      {p.imagen_principal ? (
                        <img src={`/uploads/${p.imagen_principal}`} alt={p.nombre} />
                      ) : (
                        <div className="resultado-imagen-placeholder">✦</div>
                      )}
                    </div>
                    <div className="resultado-info">
                      {p.categoria && <span className="badge badge-terracota">{p.categoria}</span>}
                      <h3>{p.nombre}</h3>
                      <p className="resultado-artesano">por {p.artesano}</p>
                      <p className="resultado-precio">${Number(p.precio).toLocaleString('es-MX')} MXN</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}