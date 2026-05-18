import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Cargando } from '../components/Componentes';
import '../components/Componentes.css';
import './Admin.css';

export default function Admin() {
  const { usuario, esAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [artesanos, setArtesanos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nuevaCat, setNuevaCat] = useState({ nombre: '', descripcion: '' });
  const [msgCat, setMsgCat] = useState('');

  useEffect(() => {
    if (!usuario || !esAdmin) { navigate('/'); return; }
    Promise.all([
      api.get('/admin/estadisticas'),
      api.get('/artesanos?limite=50'),
      api.get('/admin/pedidos'),
      api.get('/categorias'),
    ]).then(([s, a, p, c]) => {
      setStats(s.data);
      setArtesanos(a.data.artesanos || []);
      setPedidos(p.data || []);
      setCategorias(c.data);
    }).catch(console.error)
      .finally(() => setCargando(false));
  }, [usuario, esAdmin, navigate]);

  const verificarArtesano = async (id, verificado) => {
    try {
      await api.put(`/artesanos/${id}/verificar`, { verificado });
      setArtesanos(prev => prev.map(a => a.id === id ? { ...a, verificado } : a));
    } catch (err) {
      alert('Error al verificar.');
    }
  };

  const crearCategoria = async (e) => {
    e.preventDefault();
    setMsgCat('');
    try {
      const res = await api.post('/categorias', nuevaCat);
      setCategorias(prev => [...prev, res.data]);
      setNuevaCat({ nombre: '', descripcion: '' });
      setMsgCat('Categoría creada correctamente.');
    } catch (err) {
      setMsgCat(err.response?.data?.error || 'Error al crear categoría.');
    }
  };

  if (cargando) return <Cargando />;

  const tabs = [
    { id: 'stats', label: 'Estadísticas' },
    { id: 'artesanos', label: `Artesanos (${artesanos.length})` },
    { id: 'pedidos', label: `Pedidos (${pedidos.length})` },
    { id: 'categorias', label: 'Categorías' },
  ];

  return (
    <main className="contenedor admin-layout">
      <div className="admin-header">
        <h1>Panel de administración</h1>
        <p>Bienvenido, {usuario?.nombre}</p>
      </div>

      <div className="miperfil-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? 'activo' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ESTADÍSTICAS */}
      {tab === 'stats' && stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icono">🎨</span>
            <div>
              <p className="stat-numero">{stats.artesanos.total}</p>
              <p className="stat-label">Artesanos activos</p>
              <p className="stat-sub">{stats.artesanos.verificados} verificados</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icono">🛍</span>
            <div>
              <p className="stat-numero">{stats.productos.total}</p>
              <p className="stat-label">Productos disponibles</p>
              <p className="stat-sub">{stats.productos.destacados} destacados</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icono">📦</span>
            <div>
              <p className="stat-numero">{stats.pedidos.total}</p>
              <p className="stat-label">Pedidos totales</p>
              <p className="stat-sub">{stats.pedidos.completados} completados</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icono">💰</span>
            <div>
              <p className="stat-numero">${Number(stats.pedidos.ingresos).toLocaleString('es-MX')}</p>
              <p className="stat-label">Ingresos totales</p>
              <p className="stat-sub">pedidos completados</p>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-icono">⭐</span>
            <div>
              <p className="stat-numero">{stats.resenas.total}</p>
              <p className="stat-label">Reseñas recibidas</p>
              <p className="stat-sub">{stats.resenas.aprobadas} aprobadas</p>
            </div>
          </div>
        </div>
      )}

      {/* ARTESANOS */}
      {tab === 'artesanos' && (
        <div>
          <h2 className="mb-3">Gestión de artesanos</h2>
          <div className="tabla-admin">
            <div className="tabla-admin-header">
              <span>Artesano</span>
              <span>Región</span>
              <span>Técnica</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>
            {artesanos.map(a => (
              <div key={a.id} className="tabla-admin-fila">
                <div>
                  <strong>{a.nombre_completo}</strong>
                  <span className="tabla-sub">{a.email}</span>
                </div>
                <span>{a.region || '—'}</span>
                <span>{a.tecnica_principal || '—'}</span>
                <span>
                  {a.verificado
                    ? <span className="badge badge-verde">Verificado</span>
                    : <span className="badge badge-terracota">Sin verificar</span>}
                </span>
                <div className="tabla-acciones">
                  <button
                    className={`btn btn-sm ${a.verificado ? 'btn-secundario' : 'btn-verde'}`}
                    onClick={() => verificarArtesano(a.id, !a.verificado)}
                  >
                    {a.verificado ? 'Revocar' : 'Verificar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PEDIDOS */}
      {tab === 'pedidos' && (
        <div>
          <h2 className="mb-3">Todos los pedidos</h2>
          <div className="tabla-admin">
            <div className="tabla-admin-header">
              <span>Cliente</span>
              <span>Producto</span>
              <span>Artesano</span>
              <span>Total</span>
              <span>Estado</span>
            </div>
            {pedidos.map(p => (
              <div key={p.id} className="tabla-admin-fila">
                <div>
                  <strong>{p.nombre_cliente}</strong>
                  <span className="tabla-sub">{p.email_cliente}</span>
                </div>
                <span>{p.producto_nombre}</span>
                <span>{p.artesano_nombre}</span>
                <span>${Number(p.total).toLocaleString('es-MX')}</span>
                <span className={`badge ${p.estado === 'completado' ? 'badge-verde' : p.estado === 'cancelado' ? '' : 'badge-ocre'}`}>
                  {p.estado.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORÍAS */}
      {tab === 'categorias' && (
        <div className="categorias-admin">
          <div>
            <h2 className="mb-3">Categorías existentes</h2>
            <div className="lista-cats-admin">
              {categorias.map(c => (
                <div key={c.id} className="cat-admin-item">
                  <div>
                    <strong>{c.nombre}</strong>
                    <span className="tabla-sub">{c.descripcion}</span>
                  </div>
                  <span className="badge badge-terracota">{c.total_productos} productos</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-3">Nueva categoría</h2>
            {msgCat && <div className={`alerta ${msgCat.includes('Error') ? 'alerta-error' : 'alerta-exito'}`}>{msgCat}</div>}
            <form onSubmit={crearCategoria} className="form-cat">
              <div className="campo">
                <label>Nombre *</label>
                <input required value={nuevaCat.nombre} onChange={e => setNuevaCat(n => ({ ...n, nombre: e.target.value }))} placeholder="Ej. Orfebrería" />
              </div>
              <div className="campo">
                <label>Descripción</label>
                <textarea rows={2} value={nuevaCat.descripcion} onChange={e => setNuevaCat(n => ({ ...n, descripcion: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primario">Crear categoría</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
