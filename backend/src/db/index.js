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
// CÓDIGO ACTUALIZADO: Crea las columnas si no existen y ajusta sus decimales
// ==========================================
(async () => {
  try {
    // 1. Intentamos agregar la columna latitud si no existe
    await pool.query(`ALTER TABLE artesanos ADD COLUMN IF NOT EXISTS latitud DECIMAL(18, 15);`);
    
    // 2. Intentamos agregar la columna longitud si no existe
    await pool.query(`ALTER TABLE artesanos ADD COLUMN IF NOT EXISTS longitud DECIMAL(18, 15);`);
    
    // 3. Por si acaso ya existían con el formato viejo, aseguramos su tipo de dato exacto
    await pool.query(`
      ALTER TABLE artesanos 
      ALTER COLUMN latitud TYPE DECIMAL(18, 15),
      ALTER COLUMN longitud TYPE DECIMAL(18, 15);
    `);
    
    console.log("🚀 [DB-FIX] Columnas latitud y longitud aseguradas con éxito en DECIMAL(18,15).");
  } catch (err) {
    console.error("❌ [DB-FIX] Error procesando las columnas de ubicación:", err.message);
  }
})();
// ==========================================

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};