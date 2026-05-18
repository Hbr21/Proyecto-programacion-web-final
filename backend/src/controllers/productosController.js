const db = require('../db');

// GET /api/productos
const listar = async (req, res) => {
  const { categoria, artesano, buscar, destacado, min_precio, max_precio, pagina = 1, limite = 12 } = req.query;
  const offset = (pagina - 1) * limite;
  const params = [];
  const condiciones = ['p.disponible = true'];

  if (categoria) { params.push(categoria); condiciones.push(`p.categoria_id = $${params.length}`); }
  if (artesano) { params.push(artesano); condiciones.push(`p.artesano_id = $${params.length}`); }
  if (destacado === 'true') condiciones.push('p.destacado = true');
  if (min_precio) { params.push(min_precio); condiciones.push(`p.precio >= $${params.length}`); }
  if (max_precio) { params.push(max_precio); condiciones.push(`p.precio <= $${params.length}`); }
  if (buscar) {
    params.push(`%${buscar}%`);
    condiciones.push(`(p.nombre ILIKE $${params.length} OR p.descripcion ILIKE $${params.length} OR p.tecnica ILIKE $${params.length})`);
  }

  const where = condiciones.join(' AND ');
  params.push(parseInt(limite), parseInt(offset));

  try {
    const result = await db.query(`
      SELECT p.*,
        c.nombre AS categoria,
        a.nombre_completo AS artesano_nombre,
        a.comunidad AS artesano_comunidad,
        a.foto_url AS artesano_foto,
        (SELECT url FROM imagenes_producto WHERE producto_id = p.id AND es_principal = true LIMIT 1) AS imagen_principal,
        COALESCE(AVG(r.calificacion), 0)::NUMERIC(3,1) AS calificacion_promedio,
        COUNT(DISTINCT r.id) AS total_resenas
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN artesanos a ON p.artesano_id = a.id
      LEFT JOIN resenas r ON r.producto_id = p.id AND r.aprobada = true
      WHERE ${where}
      GROUP BY p.id, c.nombre, a.nombre_completo, a.comunidad, a.foto_url
      ORDER BY p.destacado DESC, p.creado_en DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    const total = await db.query(
      `SELECT COUNT(*) FROM productos p WHERE ${where}`,
      params.slice(0, -2)
    );

    res.json({
      productos: result.rows,
      total: parseInt(total.rows[0].count),
      pagina: parseInt(pagina),
      limite: parseInt(limite),
    });
  } catch (err) {
    console.error('Error listando productos:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// GET /api/productos/:id
const obtener = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*,
        c.nombre AS categoria,
        a.id AS artesano_id,
        a.nombre_completo AS artesano_nombre,
        a.comunidad AS artesano_comunidad,
        a.region AS artesano_region,
        a.foto_url AS artesano_foto,
        a.verificado AS artesano_verificado,
        COALESCE(AVG(r.calificacion), 0)::NUMERIC(3,1) AS calificacion_promedio,
        COUNT(DISTINCT r.id) AS total_resenas
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN artesanos a ON p.artesano_id = a.id
      LEFT JOIN resenas r ON r.producto_id = p.id AND r.aprobada = true
      WHERE p.id = $1
      GROUP BY p.id, c.nombre, a.id, a.nombre_completo, a.comunidad, a.region, a.foto_url, a.verificado
    `, [req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado.' });

    // Incrementar vistas
    await db.query('UPDATE productos SET vistas = vistas + 1 WHERE id = $1', [req.params.id]);

    // Obtener imágenes
    const imagenes = await db.query(
      'SELECT * FROM imagenes_producto WHERE producto_id = $1 ORDER BY es_principal DESC, orden ASC',
      [req.params.id]
    );

    // Obtener reseñas aprobadas
    const resenas = await db.query(
      'SELECT * FROM resenas WHERE producto_id = $1 AND aprobada = true ORDER BY creado_en DESC LIMIT 10',
      [req.params.id]
    );

    res.json({ ...result.rows[0], imagenes: imagenes.rows, resenas: resenas.rows });
  } catch (err) {
    console.error('Error obteniendo producto:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// POST /api/productos
const crear = async (req, res) => {
  const { nombre, descripcion, precio, precio_mayoreo, stock, unidad, tecnica, materiales, tiempo_elaboracion, categoria_id } = req.body;
  if (!nombre || !precio) return res.status(400).json({ error: 'Nombre y precio son requeridos.' });

  try {
    // Obtener artesano del usuario actual
    const artesanoRes = await db.query('SELECT id FROM artesanos WHERE usuario_id = $1', [req.usuario.id]);
    if (artesanoRes.rows.length === 0) return res.status(404).json({ error: 'Perfil de artesano no encontrado.' });
    const artesano_id = artesanoRes.rows[0].id;

    const result = await db.query(`
      INSERT INTO productos (artesano_id, categoria_id, nombre, descripcion, precio, precio_mayoreo, stock, unidad, tecnica, materiales, tiempo_elaboracion)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [artesano_id, categoria_id, nombre, descripcion, precio, precio_mayoreo, stock, unidad, tecnica, materiales, tiempo_elaboracion]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creando producto:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// PUT /api/productos/:id
const actualizar = async (req, res) => {
  const { nombre, descripcion, precio, precio_mayoreo, stock, unidad, tecnica, materiales, tiempo_elaboracion, categoria_id, disponible, destacado } = req.body;

  try {
    // Verificar que el producto pertenece al artesano (o es admin)
    const prod = await db.query(`
      SELECT p.id FROM productos p
      JOIN artesanos a ON p.artesano_id = a.id
      WHERE p.id = $1 AND (a.usuario_id = $2 OR $3 = 'admin')
    `, [req.params.id, req.usuario.id, req.usuario.rol]);

    if (prod.rows.length === 0) return res.status(403).json({ error: 'Sin permiso para modificar este producto.' });

    const result = await db.query(`
      UPDATE productos SET
        nombre = COALESCE($1, nombre),
        descripcion = COALESCE($2, descripcion),
        precio = COALESCE($3, precio),
        precio_mayoreo = COALESCE($4, precio_mayoreo),
        stock = COALESCE($5, stock),
        unidad = COALESCE($6, unidad),
        tecnica = COALESCE($7, tecnica),
        materiales = COALESCE($8, materiales),
        tiempo_elaboracion = COALESCE($9, tiempo_elaboracion),
        categoria_id = COALESCE($10, categoria_id),
        disponible = COALESCE($11, disponible),
        destacado = COALESCE($12, destacado),
        actualizado_en = NOW()
      WHERE id = $13 RETURNING *
    `, [nombre, descripcion, precio, precio_mayoreo, stock, unidad, tecnica, materiales, tiempo_elaboracion, categoria_id, disponible, destacado, req.params.id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error actualizando producto:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// DELETE /api/productos/:id
const eliminar = async (req, res) => {
  try {
    const prod = await db.query(`
      SELECT p.id FROM productos p JOIN artesanos a ON p.artesano_id = a.id
      WHERE p.id = $1 AND (a.usuario_id = $2 OR $3 = 'admin')
    `, [req.params.id, req.usuario.id, req.usuario.rol]);

    if (prod.rows.length === 0) return res.status(403).json({ error: 'Sin permiso.' });
    await db.query('DELETE FROM productos WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Producto eliminado correctamente.' });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// POST /api/productos/:id/imagenes
const subirImagen = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió imagen.' });
  const url = `/uploads/productos/${req.file.filename}`;
  const { es_principal = false, alt_text = '' } = req.body;

  try {
    if (es_principal === 'true' || es_principal === true) {
      await db.query('UPDATE imagenes_producto SET es_principal = false WHERE producto_id = $1', [req.params.id]);
    }
    const result = await db.query(`
      INSERT INTO imagenes_producto (producto_id, url, alt_text, es_principal)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [req.params.id, url, alt_text, es_principal === 'true' || es_principal === true]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error guardando imagen.' });
  }
};

// DELETE /api/productos/:id/imagenes/:imgId
const eliminarImagen = async (req, res) => {
  try {
    await db.query('DELETE FROM imagenes_producto WHERE id = $1 AND producto_id = $2', [req.params.imgId, req.params.id]);
    res.json({ mensaje: 'Imagen eliminada.' });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando imagen.' });
  }
};

// POST /api/productos/:id/resenas
const agregarResena = async (req, res) => {
  const { nombre_autor, email_autor, calificacion, comentario } = req.body;
  if (!nombre_autor || !calificacion) return res.status(400).json({ error: 'Nombre y calificación son requeridos.' });
  try {
    const result = await db.query(`
      INSERT INTO resenas (producto_id, nombre_autor, email_autor, calificacion, comentario)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [req.params.id, nombre_autor, email_autor, calificacion, comentario]);
    res.status(201).json({ ...result.rows[0], mensaje: 'Reseña enviada, pendiente de aprobación.' });
  } catch (err) {
    res.status(500).json({ error: 'Error guardando reseña.' });
  }
};

// GET /api/productos/destacados
const destacados = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, c.nombre AS categoria,
        a.nombre_completo AS artesano_nombre, a.comunidad AS artesano_comunidad,
        (SELECT url FROM imagenes_producto WHERE producto_id = p.id AND es_principal = true LIMIT 1) AS imagen_principal
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN artesanos a ON p.artesano_id = a.id
      WHERE p.destacado = true AND p.disponible = true
      LIMIT 8
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = { listar, obtener, crear, actualizar, eliminar, subirImagen, eliminarImagen, agregarResena, destacados };
