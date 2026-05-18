import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { TarjetaProducto, Cargando, Vacio } from '../components/Componentes';
import '../components/Componentes.css';
import './Catalogo.css';

export default function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);

  const pagina = parseInt(searchParams.get('pagina') || '1');
  const categoria = searchParams.get('categoria') || '';
  const buscar = searchParams.get('buscar') || '';
  const limite = 12;

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = { pagina, limite };
      if (categoria) params.categoria = categoria;
      if (buscar) params.buscar = buscar;
      const res = await api.get('/productos', { params });
      setProductos(res.data.productos);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, [pagina, categoria, buscar]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    api.get('/categorias').then(res => setCategorias(res.data)).catch(console.error);
  }, []);

  const actualizarFiltro = (key, value) => {
    const nuevo = new URLSearchParams(searchParams);
    if (value) nuevo.set(key, value); else nuevo.delete(key);
    nuevo.delete('pagina');
    setSearchParams(nuevo);
  };

  const totalPaginas = Math.ceil(total / limite);

  return (
    <main className="catalogo-layout">
      <aside className="catalogo-filtros">
        <h3>Filtros</h3>

        <div className="filtro-grupo">
          <label>Categoría</label>
          <select
            value={categoria}
            onChange={e => actualizarFiltro('categoria', e.target.value)}
          >
            <option value="">Todas</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-secundario btn-sm w-full mt-2"
          onClick={() => setSearchParams({})}
        >
          Limpiar filtros
        </button>
      </aside>

      <div className="catalogo-contenido">
        <div className="catalogo-header">
          <h1>Catálogo</h1>
          <div className="catalogo-buscador">
            <input
              type="search"
              placeholder="Buscar productos, técnicas..."
              value={buscar}
              onChange={e => actualizarFiltro('buscar', e.target.value)}
            />
          </div>
        </div>

        <p className="catalogo-total">{total} producto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>

        {cargando ? <Cargando /> : productos.length === 0 ? (
          <Vacio mensaje="No hay productos con estos filtros." />
        ) : (
          <div className="grid-3">
            {productos.map(p => <TarjetaProducto key={p.id} producto={p} />)}
          </div>
        )}

        {totalPaginas > 1 && (
          <div className="paginacion">
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={p === pagina ? 'activo' : ''}
                onClick={() => actualizarFiltro('pagina', p)}
              >{p}</button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
