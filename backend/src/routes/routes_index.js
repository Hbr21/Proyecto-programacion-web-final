const express = require('express');
const router = express.Router();
const { verificarToken, soloAdmin, soloArtesano } = require('../middleware/auth');
const upload = require('../middleware/upload');

const auth = require('../controllers/authController');
const artesanos = require('../controllers/artesanosController');
const productos = require('../controllers/productosController');
const otros = require('../controllers/otrosControllers');
const paypal = require('../controllers/paypalController');
const gemini = require('../controllers/geminiController');

// ── AUTH ──────────────────────────────────────
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', verificarToken, auth.me);
router.put('/auth/password', verificarToken, auth.cambiarPassword);

// ── ARTESANOS ─────────────────────────────────
router.get('/artesanos', artesanos.listar);
router.get('/artesanos/regiones', artesanos.regiones);
router.get('/artesanos/perfil/mio', verificarToken, soloArtesano, artesanos.miPerfil);
router.put('/artesanos/perfil', verificarToken, soloArtesano, artesanos.actualizarPerfil);
router.post('/artesanos/perfil/foto', verificarToken, soloArtesano, (req, res, next) => {
  req.uploadSubdir = 'artesanos'; next();
}, upload.single('foto'), artesanos.subirFoto);
router.get('/artesanos/:id', artesanos.obtener);
router.put('/artesanos/:id/verificar', verificarToken, soloAdmin, artesanos.verificar);

// ── PRODUCTOS ─────────────────────────────────
router.get('/productos/destacados', productos.destacados);
router.get('/productos', productos.listar);
router.get('/productos/:id', productos.obtener);
router.post('/productos', verificarToken, soloArtesano, productos.crear);
router.put('/productos/:id', verificarToken, productos.actualizar);
router.delete('/productos/:id', verificarToken, productos.eliminar);
router.post('/productos/:id/imagenes', verificarToken, (req, res, next) => {
  req.uploadSubdir = 'productos'; next();
}, upload.single('imagen'), productos.subirImagen);
router.delete('/productos/:id/imagenes/:imgId', verificarToken, productos.eliminarImagen);
router.post('/productos/:id/resenas', productos.agregarResena);

// ── CATEGORÍAS ────────────────────────────────
router.get('/categorias', otros.listarCategorias);
router.post('/categorias', verificarToken, soloAdmin, otros.crearCategoria);
router.put('/categorias/:id', verificarToken, soloAdmin, otros.actualizarCategoria);

// ── PEDIDOS ───────────────────────────────────
router.post('/pedidos', otros.crearPedido);
router.get('/pedidos/mis-pedidos', verificarToken, soloArtesano, otros.listarPedidosArtesano);
router.put('/pedidos/:id/estado', verificarToken, soloArtesano, otros.actualizarEstadoPedido);

// ── PAYPAL ────────────────────────────────────
router.get('/paypal/client-id', paypal.obtenerClientId);
router.post('/paypal/crear-orden', paypal.crearOrden);
router.post('/paypal/capturar-orden', paypal.capturarOrden);

// ── GEMINI ────────────────────────────────────
router.post('/gemini/buscar', gemini.buscarProductos);

// ── ADMIN ─────────────────────────────────────
router.get('/admin/pedidos', verificarToken, soloAdmin, otros.listarTodosPedidos);
router.get('/admin/estadisticas', verificarToken, soloAdmin, otros.estadisticas);

module.exports = router;