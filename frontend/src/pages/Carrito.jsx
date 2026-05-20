import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCarrito } from '../context/CarritoContext';
import { useAuth } from '../context/AuthContext';
import BotonPaypal from '../components/BotonPaypal';
import './Carrito.css';

export default function Carrito() {
  const { items, quitar, cambiarCantidad, vaciar, totalItems, totalPrecio } = useCarrito();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [pagando, setPagando] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);

  if (!usuario) {
    return (
      <div className="contenedor carrito-vacio">
        <span>🔒</span>
        <h2>Inicia sesión para ver tu carrito</h2>
        <Link to="/login" className="btn btn-primario">Ingresar</Link>
      </div>
    );
  }

  if (pagoExitoso) {
    return (
      <div className="contenedor carrito-exito">
        <span>✅</span>
        <h2>¡Pago completado!</h2>
        <p>Tu orden fue procesada exitosamente. Los artesanos se pondrán en contacto contigo pronto.</p>
        <div className="carrito-exito-btns">
          <Link to="/catalogo" className="btn btn-primario">Seguir comprando</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="contenedor carrito-vacio">
        <span>🛒</span>
        <h2>Tu carrito está vacío</h2>
        <p>Explora el catálogo y agrega artesanías que te gusten.</p>
        <Link to="/catalogo" className="btn btn-primario">Ver catálogo</Link>
      </div>
    );
  }

  // Para PayPal tomamos el primer producto del carrito
  // En una implementación real se haría una orden con todos los items
  const productoPaypal = {
    id: items[0].id,
    nombre: items.length === 1 ? items[0].nombre : `${items.length} artesanías`,
    precio: totalPrecio,
  };

  const handlePagoExitoso = (datos) => {
    vaciar();
    setPagoExitoso(true);
  };

  return (
    <main className="contenedor carrito-layout">
      <div className="carrito-items">
        <div className="carrito-header">
          <h1>Mi carrito</h1>
          <span>{totalItems} producto{totalItems !== 1 ? 's' : ''}</span>
        </div>

        {items.map(item => (
          <div key={item.id} className="carrito-item">
            <div className="carrito-item-imagen">
              {item.imagen_principal ? (
                <img src={`/uploads/${item.imagen_principal}`} alt={item.nombre} />
              ) : (
                <div className="carrito-item-placeholder">✦</div>
              )}
            </div>
            <div className="carrito-item-info">
              <Link to={`/producto/${item.id}`} className="carrito-item-nombre">
                {item.nombre}
              </Link>
              {item.artesano_nombre && (
                <p className="carrito-item-artesano">por {item.artesano_nombre}</p>
              )}
              <p className="carrito-item-precio">${Number(item.precio).toLocaleString('es-MX')} MXN</p>
            </div>
            <div className="carrito-item-acciones">
              <div className="cantidad-control">
                <button onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}>−</button>
                <span>{item.cantidad}</span>
                <button onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}>+</button>
              </div>
              <p className="carrito-item-subtotal">
                ${(Number(item.precio) * item.cantidad).toLocaleString('es-MX')} MXN
              </p>
              <button className="carrito-item-quitar" onClick={() => quitar(item.id)}>✕</button>
            </div>
          </div>
        ))}

        <button className="btn btn-secundario btn-sm" onClick={vaciar}>
          Vaciar carrito
        </button>
      </div>

      {/* Resumen y pago */}
      <div className="carrito-resumen">
        <h2>Resumen del pedido</h2>

        <div className="resumen-lineas">
          {items.map(item => (
            <div key={item.id} className="resumen-linea">
              <span>{item.nombre} × {item.cantidad}</span>
              <span>${(Number(item.precio) * item.cantidad).toLocaleString('es-MX')}</span>
            </div>
          ))}
          <div className="resumen-linea resumen-total">
            <strong>Total</strong>
            <strong>${totalPrecio.toLocaleString('es-MX')} MXN</strong>
          </div>
        </div>

        {!pagando ? (
          <button
            className="btn btn-primario btn-lg w-full"
            onClick={() => setPagando(true)}
          >
            💳 Proceder al pago
          </button>
        ) : (
          <div className="carrito-paypal">
            <p className="carrito-paypal-label">Selecciona tu método de pago:</p>
            <BotonPaypal
              producto={productoPaypal}
              cantidad={1}
              onExito={handlePagoExitoso}
              onError={() => alert('Error al procesar el pago. Intenta de nuevo.')}
            />
            <button
              className="btn btn-secundario btn-sm w-full mt-1"
              onClick={() => setPagando(false)}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </main>
  );
}