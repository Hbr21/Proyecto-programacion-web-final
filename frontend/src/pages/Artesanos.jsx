import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { TarjetaArtesano, Cargando, Vacio } from '../components/Componentes';
import '../components/Componentes.css';
import './Artesanos.css';

export default function Artesanos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [artesanos, setArtesanos] = useState([]);
  const [regiones, setRegiones] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);

  const pagina = parseInt(searchParams.get('pagina') || '1');
  const region = searchParams.get('region') || '';
  const buscar = searchParams.get('buscar') || '';
  const verificado = searchParams.get('verificado') || '';
  const limite = 12;

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = { pagina, limite };
      if (region) params.region = region;
      if (buscar) params.buscar = buscar;
      if (verificado) params.verificado = verificado;
      const res = await api.get('/artesanos', { params });
      setArtesanos(res.data.artesanos || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, [pagina, region, buscar, verificado]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    api.get('/artesanos/regiones').then(res => setRegiones(res.data)).catch(console.error);
  }, []);

  const set = (key, value) => {
    const n = new URLSearchParams(searchParams);
    if (value) n.set(key, value); else n.delete(key);
    n.delete('pagina');
    setSearchParams(n);
  };

  const totalPaginas = Math.ceil(total / limite);

  return (
    <main className="artesanos-layout">
      <aside className="artesanos-filtros">
        <h3>Filtros</h3>

        <div className="filtro-grupo">
          <label>Región</label>
          <select value={region} onChange={e => set('region', e.target.value)}>
            <option value="">Todas las regiones</option>
            {regiones.map(r => (
              <option key={r.region} value={r.region}>{r.region} ({r.total})</option>
            ))}
          </select>
        </div>

        <div className="filtro-grupo">
          <label>Estado</label>
          <select value={verificado} onChange={e => set('verificado', e.target.value)}>
            <option value="">Todos</option>
            <option value="true">Solo verificados</option>
          </select>
        </div>

        <button className="btn btn-secundario btn-sm w-full mt-2" onClick={() => setSearchParams({})}>
          Limpiar filtros
        </button>
      </aside>

      <div className="artesanos-contenido">
        <div className="artesanos-header">
          <h1>Artesanos</h1>
          <input
            type="search"
            className="artesanos-buscar"
            placeholder="Buscar por nombre, técnica..."
            value={buscar}
            onChange={e => set('buscar', e.target.value)}
          />
        </div>

        <p className="artesanos-total">{total} artesano{total !== 1 ? 's' : ''}</p>

        {cargando ? <Cargando /> : artesanos.length === 0 ? (
          <Vacio mensaje="No se encontraron artesanos con estos filtros." icono="🎨" />
        ) : (
          <div className="grid-4">
            {artesanos.map(a => <TarjetaArtesano key={a.id} artesano={a} />)}
          </div>
        )}

        {totalPaginas > 1 && (
          <div className="paginacion">
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
              <button key={p} className={p === pagina ? 'activo' : ''} onClick={() => set('pagina', p)}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
