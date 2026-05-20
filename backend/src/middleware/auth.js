const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

const soloAdmin = (req, res, next) => {
  if (!req.usuario || req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido a administradores.' });
  }
  next();
};

const soloArtesano = (req, res, next) => {
  if (!req.usuario || (req.usuario.rol !== 'artesano' && req.usuario.rol !== 'admin')) {
    return res.status(403).json({ error: 'Acceso restringido a artesanos.' });
  }
  next();
};

// Comprador, artesano y admin pueden acceder
const usuarioAutenticado = (req, res, next) => {
  if (!req.usuario) {
    return res.status(403).json({ error: 'Debes iniciar sesión.' });
  }
  next();
};

module.exports = { verificarToken, soloAdmin, soloArtesano, usuarioAutenticado };