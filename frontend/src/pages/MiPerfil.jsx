import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Cargando } from '../components/Componentes';
import '../components/Componentes.css';
import './MiPerfil.css';

export default function MiPerfil() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('perfil');
  const [perfil, setPerfil] = useState(null);
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({});
  const [formProd, setFormProd] = useState({
    nombre: '', descripcion: '', precio: '', stock: '',
    categoria_id: '', tecnica: '', materiales: '', tiempo_elaboracion: ''
  });
  const [categorias, setCategorias] = useState([]);
  const [editandoProd, setEditandoProd] = useState(null);

  // ── Imágenes ──
  const [imagenesProducto, setImagenesProducto] = useState([]);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [msgImagen, setMsgImagen] = useState('');
  const inputImagenRef = useRef(null);

  useEffect(() => {
    if (!usuario) { navigate('/login'); return; }
    Promise.all([
      api.get('/artesanos/perfil/mio'),
      api.get('/productos?artesano=' + usuario.id),
      api.get('/pedidos/mis-pedidos'),
      api.get('/categorias'),
    ]).then(([p, pr, pe, c]) => {
      setPerfil(p.data);
      setForm(p.data);
      setProductos(pr.data.productos || []);
      setPedidos(pe.data || []);
      setCategorias(c.data);
    }).catch(console.error)
      .finally(() => setCargando(false));
  }, [usuario, navigate]);

  const guardarPerfil = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMsg('');
    try {
      const res = await api.put('/artesanos/perfil', form);
      setPerfil(res.data);
      setMsg('Perfil actualizado correctamente.');
    } catch (err) {
      setMsg('Error al guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const guardarProducto = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setMsg('');
    try {
      let productoId = editandoProd;
      if (editandoProd) {
        await api.put(`/productos/${editandoProd}`, formProd);
      } else {
        const res = await api.post('/productos', formProd);
        productoId = res.data.id;
        setEditandoProd(productoId);
      }
      const res = await api.get(`/productos?artesano=${usuario.id}`);
      setProductos(res.data.productos || []);
      setMsg(editandoProd ? 'Producto actualizado. Ahora puedes subir imágenes.' : 'Producto creado. Ahora puedes subir imágenes.');

      // Cargar imágenes del producto
      cargarImagenes(productoId);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error al guardar producto.');
    } finally {
      setGuardando(false);
    }
  };

  const cargarImagenes = async (productoId) => {
    try {
      const res = await api.get(`/productos/${productoId}`);
      setImagenesProducto(res.data.imagenes || []);
    } catch (err) {
      console.error(err);
    }
  };

  const subirImagen = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo || !editandoProd) return;

    setSubiendoImagen(true);
    setMsgImagen('');

    const formData = new FormData();
    formData.append('imagen', archivo);
    formData.append('es_principal', imagenesProducto.length === 0 ? 'true' : 'false');

    try {
      await api.post(`/productos/${editandoProd}/imagenes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMsgImagen('Imagen subida correctamente.');
      cargarImagenes(editandoProd);
      // Limpiar el input
      if (inputImagenRef.current) inputImagenRef.current.value = '';
    } catch (err) {
      setMsgImagen('Error al subir la imagen. Máximo 5MB, formatos: jpg, png, webp.');
    } finally {
      setSubiendoImagen(false);
    }
  };

  const eliminarImagen = async (imgId) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    try {
      await api.delete(`/productos/${editandoProd}/imagenes/${imgId}`);
      setImagenesProducto(prev => prev.filter(i => i.id !== imgId));
    } catch (err) {
      alert('Error al eliminar imagen.');
    }
  };

  const marcarPrincipal = async (imgId) => {
    try {
      // Marcar como principal actualizando
      await api.delete(`/productos/${editandoProd}/imagenes/${imgId}`);
      // Re-subir no es ideal, mejor usamos el endpoint de imagen con es_principal
      // Por simplicidad recargamos las imágenes
      cargarImagenes(editandoProd);
    } catch (err) {
      console.error(err);
    }
  };

  const eliminarProducto = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await api.delete(`/productos/${id}`);
      setProductos(prev => prev.filter(p => p.id !== id));
      if (editandoProd === id) {
        setEditandoProd(null);
        setImagenesProducto([]);
        setFormProd({ nombre: '', descripcion: '', precio: '', stock: '', categoria_id: '', tecnica: '', materiales: '', tiempo_elaboracion: '' });
      }
    } catch (err) {
      alert('Error al eliminar.');
    }
  };

  const editarProducto = (prod) => {
    setEditandoProd(prod.id);
    setFormProd({
      nombre: prod.nombre || '',
      descripcion: prod.descripcion || '',
      precio: prod.precio || '',
      stock: prod.stock || '',
      categoria_id: prod.categoria_id || '',
      tecnica: prod.tecnica || '',
      materiales: prod.materiales || '',
      tiempo_elaboracion: prod.tiempo_elaboracion || '',
    });
    setTab('productos');
    cargarImagenes(prod.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
    setEditandoProd(null);
    setImagenesProducto([]);
    setMsgImagen('');
    setFormProd({ nombre: '', descripcion: '', precio: '', stock: '', categoria_id: '', tecnica: '', materiales: '', tiempo_elaboracion: '' });
  };

  const actualizarEstadoPedido = async (id, estado) => {
    try {
      await api.put(`/pedidos/${id}/estado`, { estado });
      setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado } : p));
    } catch (err) {
      alert('Error al actualizar estado.');
    }
  };

  if (cargando) return <Cargando />;

  const tabs = [
    { id: 'perfil', label: 'Mi perfil' },
    { id: 'productos', label: `Productos (${productos.length})` },
    { id: 'pedidos', label: `Pedidos (${pedidos.length})` },
  ];

  const estadoColor = {
    pendiente: 'badge-terracota',
    en_proceso: 'badge-ocre',
    completado: 'badge-verde',
    cancelado: ''
  };

  return (
    <main className="contenedor miperfil-layout">
      <div className="miperfil-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? 'activo' : ''}`}
            onClick={() => { setTab(t.id); setMsg(''); }}
          >{t.label}</button>
        ))}
        <Link to={`/artesano/${perfil?.id}`} className="btn btn-sm btn-secundario ml-auto">
          Ver mi perfil público →
        </Link>
      </div>

      {msg && <div className={`alerta ${msg.includes('Error') ? 'alerta-error' : 'alerta-exito'}`}>{msg}</div>}

      {/* TAB: PERFIL */}
      {tab === 'perfil' && (
        <form onSubmit={guardarPerfil} className="miperfil-form">
          <h2>Información personal</h2>
          <div className="form-grid">
            <div className="campo">
              <label>Nombre completo *</label>
              <input required value={form.nombre_completo || ''} onChange={e => setForm(f => ({ ...f, nombre_completo: e.target.value }))} />
            </div>
            <div className="campo">
              <label>Técnica principal</label>
              <input value={form.tecnica_principal || ''} onChange={e => setForm(f => ({ ...f, tecnica_principal: e.target.value }))} placeholder="Ej. Tejido en telar de cintura" />
            </div>
            <div className="campo">
              <label>Comunidad</label>
              <input value={form.comunidad || ''} onChange={e => setForm(f => ({ ...f, comunidad: e.target.value }))} placeholder="Ej. Teotitlán del Valle" />
            </div>
            <div className="campo">
              <label>Municipio</label>
              <input value={form.municipio || ''} onChange={e => setForm(f => ({ ...f, municipio: e.target.value }))} />
            </div>
            <div className="campo">
              <label>Región</label>
              <input value={form.region || ''} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} placeholder="Ej. Valles Centrales" />
            </div>
            <div className="campo">
              <label>Teléfono</label>
              <input type="tel" value={form.telefono || ''} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
            </div>
            <div className="campo">
              <label>Años de experiencia</label>
              <input type="number" min="0" value={form.anios_experiencia || ''} onChange={e => setForm(f => ({ ...f, anios_experiencia: e.target.value }))} />
            </div>
            <div className="campo">
              <label>Latitud 📍</label>
              <input type="number" step="any" placeholder="Ej. 17.0732" value={form.latitud || ''} onChange={e => setForm(f => ({ ...f, latitud: e.target.value }))} />
            </div>
            <div className="campo">
              <label>Longitud 📍</label>
              <input type="number" step="any" placeholder="Ej. -96.7266" value={form.longitud || ''} onChange={e => setForm(f => ({ ...f, longitud: e.target.value }))} />
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--texto-suave)', marginTop: '-0.5rem' }}>
            💡 Para obtener tus coordenadas: abre Google Maps, haz clic derecho en tu ubicación y copia los números.
          </p>

          <div className="campo">
            <label>Biografía</label>
            <textarea rows={4} value={form.biografia || ''} onChange={e => setForm(f => ({ ...f, biografia: e.target.value }))} placeholder="Cuéntanos sobre tu trabajo, tu comunidad y tu historia..." />
          </div>
          <button type="submit" className="btn btn-primario" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      )}

      {/* TAB: PRODUCTOS */}
      {tab === 'productos' && (
        <div className="productos-tab">
          <div className="productos-tab-layout">

            {/* Formulario nuevo/editar */}
            <div className="form-producto-wrap">
              <h2>{editandoProd ? 'Editar producto' : 'Nuevo producto'}</h2>
              <form onSubmit={guardarProducto} className="form-producto">
                <div className="campo">
                  <label>Nombre *</label>
                  <input required value={formProd.nombre} onChange={e => setFormProd(f => ({ ...f, nombre: e.target.value }))} />
                </div>
                <div className="campo">
                  <label>Descripción</label>
                  <textarea rows={3} value={formProd.descripcion} onChange={e => setFormProd(f => ({ ...f, descripcion: e.target.value }))} />
                </div>
                <div className="form-grid-2">
                  <div className="campo">
                    <label>Precio (MXN) *</label>
                    <input type="number" min="0" step="0.01" required value={formProd.precio} onChange={e => setFormProd(f => ({ ...f, precio: e.target.value }))} />
                  </div>
                  <div className="campo">
                    <label>Stock</label>
                    <input type="number" min="0" value={formProd.stock} onChange={e => setFormProd(f => ({ ...f, stock: e.target.value }))} />
                  </div>
                </div>
                <div className="campo">
                  <label>Categoría</label>
                  <select value={formProd.categoria_id} onChange={e => setFormProd(f => ({ ...f, categoria_id: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="campo">
                  <label>Técnica</label>
                  <input value={formProd.tecnica} onChange={e => setFormProd(f => ({ ...f, tecnica: e.target.value }))} />
                </div>
                <div className="campo">
                  <label>Materiales</label>
                  <input value={formProd.materiales} onChange={e => setFormProd(f => ({ ...f, materiales: e.target.value }))} placeholder="Lana, barro, copal..." />
                </div>
                <div className="campo">
                  <label>Tiempo de elaboración</label>
                  <input value={formProd.tiempo_elaboracion} onChange={e => setFormProd(f => ({ ...f, tiempo_elaboracion: e.target.value }))} placeholder="Ej. 2 semanas" />
                </div>
                <div className="form-acciones">
                  <button type="submit" className="btn btn-primario" disabled={guardando}>
                    {guardando ? 'Guardando...' : editandoProd ? 'Actualizar' : 'Publicar producto'}
                  </button>
                  {editandoProd && (
                    <button type="button" className="btn btn-secundario" onClick={cancelarEdicion}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>

              {/* ── Sección de imágenes (solo cuando se edita) ── */}
              {editandoProd && (
                <div className="imagenes-seccion">
                  <h3>Fotos del producto</h3>
                  <p className="imagenes-tip">La primera imagen será la principal. Formatos: jpg, png, webp. Máx 5MB.</p>

                  {/* Grid de imágenes actuales */}
                  {imagenesProducto.length > 0 && (
                    <div className="imagenes-grid">
                      {imagenesProducto.map(img => (
                        <div key={img.id} className={`imagen-item ${img.es_principal ? 'principal' : ''}`}>
                          <img src={`/uploads/${img.url}`} alt="Foto del producto" />
                          {img.es_principal && (
                            <span className="imagen-principal-badge">Principal</span>
                          )}
                          <button
                            className="imagen-eliminar"
                            onClick={() => eliminarImagen(img.id)}
                            title="Eliminar imagen"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Subir nueva imagen */}
                  <div className="imagen-upload-area" onClick={() => inputImagenRef.current?.click()}>
                    {subiendoImagen ? (
                      <div className="spinner" />
                    ) : (
                      <>
                        <span className="upload-icono">📸</span>
                        <p>Clic para subir una foto</p>
                        <span className="upload-sub">o arrastra aquí</span>
                      </>
                    )}
                    <input
                      ref={inputImagenRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={subirImagen}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {msgImagen && (
                    <div className={`alerta ${msgImagen.includes('Error') ? 'alerta-error' : 'alerta-exito'}`}>
                      {msgImagen}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lista de productos */}
            <div className="lista-productos-admin">
              <h3>Mis productos ({productos.length})</h3>
              {productos.length === 0 ? (
                <p style={{ color: 'var(--texto-suave)', fontSize: '0.9rem' }}>No tienes productos publicados aún.</p>
              ) : (
                <div className="tabla-productos">
                  {productos.map(p => (
                    <div key={p.id} className={`tabla-fila ${editandoProd === p.id ? 'editando' : ''}`}>
                      <div className="tabla-info">
                        {p.imagen_principal && (
                          <img src={`/uploads/${p.imagen_principal}`} alt={p.nombre} className="tabla-miniatura" />
                        )}
                        <div>
                          <strong>{p.nombre}</strong>
                          <span className="tabla-precio">${Number(p.precio).toLocaleString('es-MX')}</span>
                        </div>
                        {p.disponible ? <span className="badge badge-verde">Activo</span> : <span className="badge">Inactivo</span>}
                      </div>
                      <div className="tabla-acciones">
                        <button className="btn btn-sm btn-secundario" onClick={() => editarProducto(p)}>
                          {editandoProd === p.id ? '✓ Editando' : 'Editar + Fotos'}
                        </button>
                        <Link to={`/producto/${p.id}`} className="btn btn-sm" style={{ background: 'var(--crema-dark)', color: 'var(--texto)' }}>Ver</Link>
                        <button className="btn btn-sm" style={{ background: '#fde8e8', color: '#c0392b' }} onClick={() => eliminarProducto(p.id)}>Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: PEDIDOS */}
      {tab === 'pedidos' && (
        <div className="pedidos-tab">
          <h2>Pedidos recibidos</h2>
          {pedidos.length === 0 ? (
            <p style={{ color: 'var(--texto-suave)' }}>No tienes pedidos aún.</p>
          ) : (
            <div className="tabla-pedidos">
              {pedidos.map(pe => (
                <article key={pe.id} className="pedido-card">
                  <div className="pedido-header">
                    <div>
                      <strong>{pe.nombre_cliente}</strong>
                      <span className="pedido-email">{pe.email_cliente}</span>
                    </div>
                    <span className={`badge ${estadoColor[pe.estado] || ''}`}>{pe.estado.replace('_', ' ')}</span>
                  </div>
                  <p className="pedido-producto">🎨 {pe.producto_nombre} × {pe.cantidad}</p>
                  {pe.mensaje && <p className="pedido-mensaje">"{pe.mensaje}"</p>}
                  <div className="pedido-footer">
                    <span className="pedido-total">${Number(pe.total).toLocaleString('es-MX')} MXN</span>
                    <span className="pedido-fecha">{new Date(pe.creado_en).toLocaleDateString('es-MX')}</span>
                    <select
                      value={pe.estado}
                      onChange={e => actualizarEstadoPedido(pe.id, e.target.value)}
                      className="pedido-estado-sel"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en_proceso">En proceso</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}