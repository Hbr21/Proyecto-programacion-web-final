const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

// Configurar entorno PayPal
const entornoPaypal = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;

  if (process.env.PAYPAL_MODE === 'production') {
    return new checkoutNodeJssdk.core.LiveEnvironment(clientId, secret);
  }
  return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, secret);
};

const clientePaypal = () => {
  return new checkoutNodeJssdk.core.PayPalHttpClient(entornoPaypal());
};

// POST /api/paypal/crear-orden
const crearOrden = async (req, res) => {
  const { producto_id, nombre_producto, precio, cantidad = 1 } = req.body;

  if (!precio || !nombre_producto) {
    return res.status(400).json({ error: 'Precio y nombre del producto son requeridos.' });
  }

  const total = (parseFloat(precio) * parseInt(cantidad)).toFixed(2);

  const solicitud = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  solicitud.prefer('return=representation');
  solicitud.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: `producto_${producto_id}`,
        description: nombre_producto,
        amount: {
          currency_code: 'MXN',
          value: total,
          breakdown: {
            item_total: {
              currency_code: 'MXN',
              value: total,
            },
          },
        },
        items: [
          {
            name: nombre_producto,
            unit_amount: {
              currency_code: 'MXN',
              value: parseFloat(precio).toFixed(2),
            },
            quantity: String(cantidad),
          },
        ],
      },
    ],
    application_context: {
      brand_name: 'Artesanos Oaxaca',
      locale: 'es-MX',
      landing_page: 'BILLING',
      user_action: 'PAY_NOW',
    },
  });

  try {
    const orden = await clientePaypal().execute(solicitud);
    res.json({
      id: orden.result.id,
      status: orden.result.status,
    });
  } catch (err) {
    console.error('Error creando orden PayPal:', err);
    res.status(500).json({ error: 'Error al crear la orden de pago.' });
  }
};

// POST /api/paypal/capturar-orden
const capturarOrden = async (req, res) => {
  const { orden_id } = req.body;

  if (!orden_id) {
    return res.status(400).json({ error: 'ID de orden requerido.' });
  }

  const solicitud = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orden_id);
  solicitud.requestBody({});

  try {
    const captura = await clientePaypal().execute(solicitud);
    const resultado = captura.result;

    res.json({
      id: resultado.id,
      status: resultado.status,
      pagador: resultado.payer,
      monto: resultado.purchase_units[0]?.payments?.captures[0]?.amount,
    });
  } catch (err) {
    console.error('Error capturando orden PayPal:', err);
    res.status(500).json({ error: 'Error al procesar el pago.' });
  }
};

// GET /api/paypal/client-id  (para el frontend)
const obtenerClientId = (req, res) => {
  res.json({ clientId: process.env.PAYPAL_CLIENT_ID });
};

module.exports = { crearOrden, capturarOrden, obtenerClientId };