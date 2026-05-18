const db = require('../db');

// GET /api/artesanos
const listar = async (req, res) => {
  const { region, tecnica, verificado, buscar, pagina = 1, limite = 12 } = req.query;
  const offset = (pagina - 1) * limite;
  const params = [];
  const condiciones = ['a.activo = true'];

  if (region) { params.push(`%${region}%`); condiciones.push(`a.region ILIKE $${params.length}`); }
  if (tecnica) { params.push(`%${tecnica}%`); condiciones.push(`a.tecnica_principal ILIKE $${params.length}`); }
  if (verificado !== undefined) { params.push(verificado === 'true'); condiciones.push(`a.verificado = $${params.length}`); }
  if (buscar) {
    params.push(`%${buscar}%`);
    condiciones.push(`(a.nombre_completo ILIKE $${params.length} OR a.comunidad ILIKE $${params.length} OR a.tecnica_principal ILIKE $${params.length})`);
  }

  const where = condiciones.join(' AND ');
  params.push(parseInt(limite), parseInt(offset));

  try {
    const result = await db.query(`
      SELECT a.*, u.email,
        COUNT(p.id) AS total_productos,
        COALESCE(AVG(r.calificacion), 0)::NUMERIC(3,1) AS calificacion_promedio
      FROM artesanos a
      JOIN usuarios u ON a.usuario_id = u.id
      LEFT JOIN productos p ON p.artesano_id = a.id AND p.disponible = true
      LEFT JOIN resenas r ON r.producto_id = p.id AND r.aprobada = true
      WHERE ${where}
      GROUP BY a.id, u.email
      ORDER BY a.verificado DESC, a.nombre_completo ASC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    const total = await db.query(
      `SELECT COUNT(*) FROM artesanos a WHERE ${where}`,
      params.slice(0, -2)
    );

    res.json({
      artesanos: result.rows,
      total: parseInt(total.rows[0].count),
      pagina: parseInt(pagina),
      limite: parseInt(limite),
    });
  } catch (err) {
    console.error('Error listando artesanos:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// GET /api/artesanos/:id
const obtener = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, u.email,
        COUNT(DISTINCT p.id) AS total_productos,
        COALESCE(AVG(r.calificacion), 0)::NUMERIC(3,1) AS calificacion_promedio
      FROM artesanos a
      JOIN usuarios u ON a.usuario_id = u.id
      LEFT JOIN productos p ON p.artesano_id = a.id AND p.disponible = true
      LEFT JOIN resenas r ON r.producto_id = p.id AND r.aprobada = true
      WHERE a.id = $1
      GROUP BY a.id, u.email
    `, [req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Artesano no encontrado.' });

    // Obtener productos del artesano
    const productos = await db.query(`
      SELECT p.*, c.nombre AS categoria,
        (SELECT url FROM imagenes_producto WHERE producto_id = p.id AND es_principal = true LIMIT 1) AS imagen_principal
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.artesano_id = $1 AND p.disponible = true
      ORDER BY p.destacado DESC, p.creado_en DESC
    `, [req.params.id]);

    res.json({ ...result.rows[0], productos: productos.rows });
  } catch (err) {
    console.error('Error obteniendo artesano:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// GET /api/artesanos/perfil/mio (propio perfil)
const miPerfil = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM artesanos WHERE usuario_id = $1',
      [req.usuario.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Perfil no encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// PUT /api/artesanos/perfil (actualizar propio perfil)
const actualizarPerfil = async (req, res) => {
  const {
    nombre_completo, biografia, comunidad, municipio, region,
    telefono, tecnica_principal, anios_experiencia,
    latitud, longitud   // ← coordenadas para el mapa
  } = req.body;

  try {
    const result = await db.query(`
      UPDATE artesanos SET
        nombre_completo    = COALESCE($1,  nombre_completo),
        biografia          = COALESCE($2,  biografia),
        comunidad          = COALESCE($3,  comunidad),
        municipio          = COALESCE($4,  municipio),
        region             = COALESCE($5,  region),
        telefono           = COALESCE($6,  telefono),
        tecnica_principal  = COALESCE($7,  tecnica_principal),
        anios_experiencia  = COALESCE($8,  anios_experiencia),
        latitud            = COALESCE($9,  latitud),
        longitud           = COALESCE($10, longitud),
        actualizado_en     = NOW()
      WHERE usuario_id = $11
      RETURNING *
    `, [
      nombre_completo, biografia, comunidad, municipio, region,
      telefono, tecnica_principal, anios_experiencia,
      latitud || null, longitud || null,
      req.usuario.id
    ]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error actualizando perfil:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// POST /api/artesanos/perfil/foto (subir foto de perfil)
const subirFoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
  const url = `/uploads/artesanos/${req.file.filename}`;
  try {
    await db.query('UPDATE artesanos SET foto_url = $1 WHERE usuario_id = $2', [url, req.usuario.id]);
    res.json({ foto_url: url });
  } catch (err) {
    res.status(500).json({ error: 'Error guardando foto.' });
  }
};

// GET /api/artesanos/regiones (para filtros)
const regiones = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT region, COUNT(*) AS total
      FROM artesanos WHERE activo = true AND region IS NOT NULL
      GROUP BY region ORDER BY total DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// Admin: PUT /api/artesanos/:id/verificar
const verificar = async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE artesanos SET verificado = $1 WHERE id = $2 RETURNING *',
      [req.body.verificado, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = { listar, obtener, miPerfil, actualizarPerfil, subirFoto, regiones, verificar };