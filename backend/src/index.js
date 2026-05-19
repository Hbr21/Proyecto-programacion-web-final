require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Requerimos el paquete
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors()); // 👈 Aquí cambió. Ahora permite peticiones desde CUALQUIER origen sin restricciones.

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// Rutas API
app.use('/api', require('./routes/routes_index'));

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', env: process.env.NODE_ENV });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'El archivo es demasiado grande. Máximo 5MB.' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor.' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

app.listen(PORT, () => {
  console.log(`🌿 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📦 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;