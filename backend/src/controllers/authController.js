const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const generarToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
const register = async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos.' });
  }
  try {
    const existe = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO usuarios (nombre, email, password, rol)
       VALUES ($1, $2, $3, 'artesano') RETURNING id, nombre, email, rol`,
      [nombre, email, hash]
    );
    const usuario = result.rows[0];

    // Crear perfil de artesano vacío
    await db.query(
      `INSERT INTO artesanos (usuario_id, nombre_completo)
       VALUES ($1, $2)`,
      [usuario.id, nombre]
    );

    const token = generarToken(usuario);
    res.status(201).json({ token, usuario });
  } catch (err) {
    console.error('Error en register:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
  }
  try {
    const result = await db.query(
      'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }
    const usuario = result.rows[0];
    const coincide = await bcrypt.compare(password, usuario.password);
    if (!coincide) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }
    const token = generarToken(usuario);
    const { password: _, ...usuarioSin } = usuario;
    res.json({ token, usuario: usuarioSin });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// GET /api/auth/me
const me = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, nombre, email, rol, creado_en FROM usuarios WHERE id = $1',
      [req.usuario.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// PUT /api/auth/password
const cambiarPassword = async (req, res) => {
  const { passwordActual, passwordNuevo } = req.body;
  try {
    const result = await db.query('SELECT password FROM usuarios WHERE id = $1', [req.usuario.id]);
    const coincide = await bcrypt.compare(passwordActual, result.rows[0].password);
    if (!coincide) return res.status(401).json({ error: 'Contraseña actual incorrecta.' });
    const hash = await bcrypt.hash(passwordNuevo, 10);
    await db.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hash, req.usuario.id]);
    res.json({ mensaje: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

module.exports = { register, login, me, cambiarPassword };
