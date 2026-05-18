import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Estrellas, Cargando } from '../components/Componentes';
import '../components/Componentes.css';
import './Producto.css';

export default function Producto() {
  const { id } = useParams();
  const [producto, setProducto] = useState(null);
  const [imgActiva, setImgActiva] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [pedido, setPedido] = useState({ nombre_cliente: '', email_cliente: '', telefono_cliente: '', cantidad: 1, mensaje: '' });
  const [resena, setResena] = useState({ nombre_autor: '', calificacion: 5, comentario: '' });
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [msgPedido, setMsgPedido] = useState('');
  const [enviandoResena, setEnviandoResena] = useState(false);
  const [msgResena, setMsgResena] = useState('');

  useEffect(() => {
    api.get(`/productos/${id}`)
      .then(res => setProducto(res.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [id]);

  const handlePedido = async (e) => {
    e.preventDefault();
    setEnviandoPedido(true);
    try {
      await api.post(`/pedidos`, {
        ...pedido,
        producto_id: producto.id,
        artesano_id: producto.artesano_id,
      });
      setMsgPedido('¡Pedido enviado! El artesano se pondrá en contacto contigo pronto.');
      setPedido({ nombre_cliente: '', email_cliente: '', telefono_cliente: '', cantidad: 1, mensaje: '' });
    } catch (err) {
      setMsgPedido('Error al enviar el pedido. Intenta de nuevo.');
    } finally {
      setEnviandoPedido(false);
    }
  };

  const handleResena = async (e) => {
    e.preventDefault();
    setEnviandoResena(true);
    try {
      await api.post(`/productos/${id}/resenas`, resena);
      setMsgResena('¡Gracias! Tu reseña está pendiente de aprobación.');
      setResena({ nombre_autor: '', calificacion: 5, comentario: '' });
    } catch (err) {
      setMsgResena('Error al enviar la reseña.');
    } finally {
      setEnviandoResena(false);
    }
  };

  if (cargando) return <Cargando />;
  if (!producto) return <div className="contenedor mt-4"><p>Producto no encontrado.</p></div>;

  const imagenes = producto.imagenes?.length > 0 ? producto.imagenes : [{ url: '', es_principal: true }];

  return (
    <main className="contenedor producto-layout">
      {/* Galería + Info */}
      <section className="producto-galeria">
        <div className="galeria-principal">
          {imagenes[imgActiva]?.url ? (
            <img src={`/uploads/${imagenes[imgActiva].url}`} alt={producto.nombre} />
          ) : (
            <div className="galeria-placeholder">✦</div>
          )}
        </div>
        {imagenes.length > 1 && (
          <div className="galeria-miniaturas">
            {imagenes.map((img, i) => (
              <button key={i} className={`miniatura ${i === imgActiva ? 'activa' : ''}`} onClick={() => setImgActiva(i)}>
                {img.url ? <img src={`/uploads/${img.url}`} alt="" /> : <span>✦</span>}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="producto-info">
        {producto.categoria && <span className="badge badge-terracota">{producto.categoria}</span>}
        <h1>{producto.nombre}</h1>

        {parseFloat(producto.calificacion_promedio) > 0 && (
          <div className="producto-calificacion">
            <Estrellas valor={parseFloat(producto.calificacion_promedio)} />
            <span>({producto.total_resenas} reseñas)</span>
          </div>
        )}

        <p className="producto-precio">${Number(producto.precio).toLocaleString('es-MX')} MXN</p>
        {producto.precio_mayoreo && (
          <p className="precio-mayoreo">Mayoreo: ${Number(producto.precio_mayoreo).toLocaleString('es-MX')} MXN</p>
        )}

        <p className="producto-descripcion">{producto.descripcion}</p>

        {/* Detalles técnicos */}
        <dl className="producto-detalles">
          {producto.tecnica && <><dt>Técnica</dt><dd>{producto.tecnica}</dd></>}
          {producto.materiales && <><dt>Materiales</dt><dd>{producto.materiales}</dd></>}
          {producto.tiempo_elaboracion && <><dt>Tiempo de elaboración</dt><dd>{producto.tiempo_elaboracion}</dd></>}
          {producto.stock > 0 && <><dt>Disponibilidad</dt><dd>{producto.stock} {producto.unidad}{producto.stock !== 1 ? 's' : ''}</dd></>}
        </dl>

        {/* Info artesano */}
        {producto.artesano_nombre && (
          <Link to={`/artesano/${producto.artesano_id}`} className="producto-artesano">
            <div className="artesano-mini-info">
              <strong>{producto.artesano_nombre}</strong>
              {producto.artesano_verificado && <span className="badge badge-verde">✓ Verificado</span>}
              <span className="artesano-lugar">📍 {producto.artesano_comunidad}</span>
            </div>
            <span className="ver-perfil">Ver perfil →</span>
          </Link>
        )}

        {/* Formulario de pedido */}
        <div className="seccion-pedido">
          <h3>Solicitar / Contactar artesano</h3>
          {msgPedido && <div className={`alerta ${msgPedido.includes('Error') ? 'alerta-error' : 'alerta-exito'}`}>{msgPedido}</div>}
          <form onSubmit={handlePedido} className="form-pedido">
            <div className="campo">
              <label>Nombre completo *</label>
              <input required value={pedido.nombre_cliente} onChange={e => setPedido(p => ({ ...p, nombre_cliente: e.target.value }))} />
            </div>
            <div className="campo">
              <label>Email *</label>
              <input type="email" required value={pedido.email_cliente} onChange={e => setPedido(p => ({ ...p, email_cliente: e.target.value }))} />
            </div>
            <div className="campo">
              <label>Teléfono</label>
              <input value={pedido.telefono_cliente} onChange={e => setPedido(p => ({ ...p, telefono_cliente: e.target.value }))} />
            </div>
            <div className="campo">
              <label>Cantidad</label>
              <input type="number" min="1" value={pedido.cantidad} onChange={e => setPedido(p => ({ ...p, cantidad: e.target.value }))} />
            </div>
            <div className="campo">
              <label>Mensaje al artesano</label>
              <textarea rows={3} value={pedido.mensaje} onChange={e => setPedido(p => ({ ...p, mensaje: e.target.value }))} placeholder="Personalizaciones, preguntas..." />
            </div>
            <button type="submit" className="btn btn-primario w-full" disabled={enviandoPedido}>
              {enviandoPedido ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </form>
        </div>
      </section>

      {/* Reseñas */}
      <section className="seccion-resenas">
        <h2>Reseñas</h2>
        {producto.resenas?.length === 0 ? (
          <p>Sé el primero en dejar una reseña.</p>
        ) : (
          <div className="lista-resenas">
            {producto.resenas?.map(r => (
              <article key={r.id} className="resena">
                <div className="resena-header">
                  <strong>{r.nombre_autor}</strong>
                  <Estrellas valor={r.calificacion} />
                  <span className="resena-fecha">{new Date(r.creado_en).toLocaleDateString('es-MX')}</span>
                </div>
                <p>{r.comentario}</p>
              </article>
            ))}
          </div>
        )}

        <div className="form-resena">
          <h3>Escribir una reseña</h3>
          {msgResena && <div className={`alerta ${msgResena.includes('Error') ? 'alerta-error' : 'alerta-exito'}`}>{msgResena}</div>}
          <form onSubmit={handleResena}>
            <div className="campo">
              <label>Tu nombre *</label>
              <input required value={resena.nombre_autor} onChange={e => setResena(r => ({ ...r, nombre_autor: e.target.value }))} />
            </div>
            <div className="campo">
              <label>Calificación *</label>
              <select value={resena.calificacion} onChange={e => setResena(r => ({ ...r, calificacion: parseInt(e.target.value) }))}>
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
              </select>
            </div>
            <div className="campo">
              <label>Comentario</label>
              <textarea rows={3} value={resena.comentario} onChange={e => setResena(r => ({ ...r, comentario: e.target.value }))} />
            </div>
            <button type="submit" className="btn btn-secundario" disabled={enviandoResena}>
              {enviandoResena ? 'Enviando...' : 'Publicar reseña'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
