const { Pool } = require('pg');
require('dotenv').config();

// Detectamos si el proyecto está corriendo en Render (producción)
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

const pool = new Pool({
  // Si existe DATABASE_URL (en Render), usa el enlace completo. 
  // Si no, arma la conexión dividida para tu entorno local.
  connectionString: process.env.DATABASE_URL,
  
  host: process.env.DATABASE_URL ? undefined : (process.env.DB_HOST || 'localhost'),
  port: process.env.DATABASE_URL ? undefined : (process.env.DB_PORT || 5432),
  database: process.env.DATABASE_URL ? undefined : (process.env.DB_NAME || 'artesanos_oaxaca'),
  user: process.env.DATABASE_URL ? undefined : (process.env.DB_USER || 'postgres'),
  password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD,
  
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // RENDER OBLIGA A USAR SSL EN PRODUCCIÓN
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Error inesperado en el cliente de PostgreSQL', err);
});

// ==========================================
// CÓDIGO AGREGADO: Arreglo automático de decimales para coordenadas
// ==========================================
pool.query(`
  ALTER TABLE artesanos 
  ALTER COLUMN latitud TYPE DECIMAL(18, 15),
  ALTER COLUMN longitud TYPE DECIMAL(18, 15);
`)
.then(() => {
  console.log("🚀 [DB-FIX] Columnas latitud y longitud actualizadas con éxito a DECIMAL(18,15).");
})
.catch((err) => {
  // Si las columnas ya se actualizaron antes, PostgreSQL podría lanzar un aviso, 
  // atrapamos el error aquí para que tu backend no se detenga.
  console.log("⚠️ [DB-FIX] Nota sobre columnas (puede que ya estuvieran actualizadas):", err.message);
});
// ==========================================

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};