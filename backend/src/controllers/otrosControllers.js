const db = require('../db');

// ──────────────── CATEGORÍAS ────────────────

const listarCategorias = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, COUNT(p.id) AS total_productos
      FROM categorias c
      LEFT JOIN productos p ON p.categoria_id = c.id AND p.disponible = true
      WHERE c.activa = true
      GROUP BY c.id
      ORDER BY c.nombre ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const crearCategoria = async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido.' });
  try {
    const result = await db.query(
      'INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2) RETURNING *',
      [nombre, descripcion]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'La categoría ya existe.' });
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const actualizarCategoria = async (req, res) => {
  const { nombre, descripcion, activa } = req.body;
  try {
    const result = await db.query(
      'UPDATE categorias SET nombre = COALESCE($1, nombre), descripcion = COALESCE($2, descripcion), activa = COALESCE($3, activa) WHERE id = $4 RETURNING *',
      [nombre, descripcion, activa, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// ──────────────── PEDIDOS / CONTACTO ────────────────

const crearPedido = async (req, res) => {
  const { artesano_id, producto_id, nombre_cliente, email_cliente, telefono_cliente, cantidad, mensaje } = req.body;
  if (!nombre_cliente || !email_cliente || !producto_id) {
    return res.status(400).json({ error: 'Nombre, email y producto son requeridos.' });
  }
  try {
    const prod = await db.query('SELECT precio FROM productos WHERE id = $1', [producto_id]);
    if (prod.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado.' });
    const total = prod.rows[0].precio * (cantidad || 1);

    const result = await db.query(`
      INSERT INTO pedidos (artesano_id, producto_id, nombre_cliente, email_cliente, telefono_cliente, cantidad, mensaje, total)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [artesano_id, producto_id, nombre_cliente, email_cliente, telefono_cliente, cantidad || 1, mensaje, total]);

    res.status(201).json({ ...result.rows[0], mensaje_confirmacion: 'Tu pedido fue enviado al artesano.' });
  } catch (err) {
    console.error('Error creando pedido:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const listarPedidosArtesano = async (req, res) => {
  try {
    const artesanoRes = await db.query('SELECT id FROM artesanos WHERE usuario_id = $1', [req.usuario.id]);
    if (artesanoRes.rows.length === 0) return res.status(404).json({ error: 'Perfil no encontrado.' });

    const result = await db.query(`
      SELECT pe.*, pr.nombre AS producto_nombre
      FROM pedidos pe
      LEFT JOIN productos pr ON pe.producto_id = pr.id
      WHERE pe.artesano_id = $1
      ORDER BY pe.creado_en DESC
    `, [artesanoRes.rows[0].id]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const actualizarEstadoPedido = async (req, res) => {
  const { estado } = req.body;
  const estadosValidos = ['pendiente', 'en_proceso', 'completado', 'cancelado'];
  if (!estadosValidos.includes(estado)) return res.status(400).json({ error: 'Estado inválido.' });

  try {
    const result = await db.query(
      'UPDATE pedidos SET estado = $1, actualizado_en = NOW() WHERE id = $2 RETURNING *',
      [estado, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Admin: listar todos los pedidos
const listarTodosPedidos = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT pe.*, pr.nombre AS producto_nombre, a.nombre_completo AS artesano_nombre
      FROM pedidos pe
      LEFT JOIN productos pr ON pe.producto_id = pr.id
      LEFT JOIN artesanos a ON pe.artesano_id = a.id
      ORDER BY pe.creado_en DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Admin: estadísticas generales
const estadisticas = async (req, res) => {
  try {
    const [artesanos, productos, pedidos, resenas] = await Promise.all([
      db.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE verificado = true) as verificados FROM artesanos WHERE activo = true'),
      db.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE destacado = true) as destacados FROM productos WHERE disponible = true'),
      db.query(`SELECT COUNT(*) as total,
        COUNT(*) FILTER (WHERE estado = 'completado') as completados,
        COALESCE(SUM(total) FILTER (WHERE estado = 'completado'), 0) as ingresos
        FROM pedidos`),
      db.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE aprobada = true) as aprobadas FROM resenas'),
    ]);

    res.json({
      artesanos: artesanos.rows[0],
      productos: productos.rows[0],
      pedidos: pedidos.rows[0],
      resenas: resenas.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = {
  listarCategorias, crearCategoria, actualizarCategoria,
  crearPedido, listarPedidosArtesano, actualizarEstadoPedido, listarTodosPedidos,
  estadisticas,
};
