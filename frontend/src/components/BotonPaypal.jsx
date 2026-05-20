import { useEffect, useRef, useState } from 'react';
import api from '../services/api';

export default function BotonPaypal({ producto, cantidad = 1, onExito, onError }) {
  const contenedorRef = useRef(null);
  const [cargando, setCargando] = useState(true);
  const [pagado, setPagado] = useState(false);
  const botonesRendered = useRef(false);

  useEffect(() => {
    if (botonesRendered.current) return;

    const cargarPaypal = async () => {
      try {
        // Obtener client ID del backend
        const res = await api.get('/paypal/client-id');
        const clientId = res.data.clientId;

        // Cargar el script de PayPal si no está cargado
        if (!document.querySelector('#paypal-sdk')) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.id = 'paypal-sdk';
            script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=MXN`;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }

        setCargando(false);

        // Renderizar botones de PayPal
        if (contenedorRef.current && window.paypal) {
          botonesRendered.current = true;
          window.paypal.Buttons({
            style: {
              layout: 'vertical',
              color: 'gold',
              shape: 'rect',
              label: 'pay',
            },

            // Crear la orden en el backend
            createOrder: async () => {
              const res = await api.post('/paypal/crear-orden', {
                producto_id: producto.id,
                nombre_producto: producto.nombre,
                precio: producto.precio,
                cantidad,
              });
              return res.data.id;
            },

            // Capturar el pago cuando el usuario aprueba
            onApprove: async (data) => {
              const res = await api.post('/paypal/capturar-orden', {
                orden_id: data.orderID,
              });

              if (res.data.status === 'COMPLETED') {
                setPagado(true);
                onExito && onExito(res.data);
              }
            },

            onError: (err) => {
              console.error('Error en PayPal:', err);
              onError && onError(err);
            },

            onCancel: () => {
              console.log('Pago cancelado por el usuario.');
            },
          }).render(contenedorRef.current);
        }
      } catch (err) {
        console.error('Error cargando PayPal:', err);
        setCargando(false);
      }
    };

    cargarPaypal();
  }, [producto, cantidad]);

  if (pagado) {
    return (
      <div style={{
        background: '#e8f5e9',
        border: '1.5px solid #2e7d32',
        borderRadius: '12px',
        padding: '1.25rem',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✅</p>
        <p style={{ fontWeight: '600', color: '#2e7d32' }}>¡Pago completado exitosamente!</p>
        <p style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.25rem' }}>
          Recibirás confirmación por email. El artesano se pondrá en contacto contigo.
        </p>
      </div>
    );
  }

  return (
    <div>
      {cargando && (
        <div style={{
          background: 'var(--crema-dark)',
          borderRadius: '8px',
          padding: '1rem',
          textAlign: 'center',
          fontSize: '0.88rem',
          color: 'var(--texto-suave)',
        }}>
          Cargando opciones de pago...
        </div>
      )}
      <div ref={contenedorRef} />
    </div>
  );
}