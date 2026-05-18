const db = require('./index');
require('dotenv').config();

const createTables = async () => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Tabla de usuarios (admin y artesanos)
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(20) NOT NULL DEFAULT 'artesano' CHECK (rol IN ('admin', 'artesano')),
        activo BOOLEAN DEFAULT true,
        creado_en TIMESTAMP DEFAULT NOW(),
        actualizado_en TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabla de categorías de artesanías
    await client.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        descripcion TEXT,
        imagen_url VARCHAR(500),
        activa BOOLEAN DEFAULT true,
        creado_en TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabla de artesanos (perfil extendido)
    await client.query(`
      CREATE TABLE IF NOT EXISTS artesanos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        nombre_completo VARCHAR(150) NOT NULL,
        biografia TEXT,
        comunidad VARCHAR(150),
        municipio VARCHAR(150),
        region VARCHAR(150),
        telefono VARCHAR(20),
        foto_url VARCHAR(500),
        tecnica_principal VARCHAR(200),
        anios_experiencia INTEGER DEFAULT 0,
        activo BOOLEAN DEFAULT true,
        verificado BOOLEAN DEFAULT false,
        creado_en TIMESTAMP DEFAULT NOW(),
        actualizado_en TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabla de productos
    await client.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        artesano_id INTEGER REFERENCES artesanos(id) ON DELETE CASCADE,
        categoria_id INTEGER REFERENCES categorias(id),
        nombre VARCHAR(200) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10,2) NOT NULL,
        precio_mayoreo DECIMAL(10,2),
        stock INTEGER DEFAULT 0,
        unidad VARCHAR(50) DEFAULT 'pieza',
        tecnica VARCHAR(200),
        materiales TEXT,
        tiempo_elaboracion VARCHAR(100),
        disponible BOOLEAN DEFAULT true,
        destacado BOOLEAN DEFAULT false,
        vistas INTEGER DEFAULT 0,
        creado_en TIMESTAMP DEFAULT NOW(),
        actualizado_en TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabla de imágenes de productos
    await client.query(`
      CREATE TABLE IF NOT EXISTS imagenes_producto (
        id SERIAL PRIMARY KEY,
        producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
        url VARCHAR(500) NOT NULL,
        alt_text VARCHAR(200),
        es_principal BOOLEAN DEFAULT false,
        orden INTEGER DEFAULT 0,
        creado_en TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabla de reseñas/calificaciones
    await client.query(`
      CREATE TABLE IF NOT EXISTS resenas (
        id SERIAL PRIMARY KEY,
        producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
        nombre_autor VARCHAR(100) NOT NULL,
        email_autor VARCHAR(150),
        calificacion INTEGER NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
        comentario TEXT,
        aprobada BOOLEAN DEFAULT false,
        creado_en TIMESTAMP DEFAULT NOW()
      );
    `);

    // Tabla de pedidos/contacto
    await client.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        artesano_id INTEGER REFERENCES artesanos(id),
        producto_id INTEGER REFERENCES productos(id),
        nombre_cliente VARCHAR(150) NOT NULL,
        email_cliente VARCHAR(150) NOT NULL,
        telefono_cliente VARCHAR(20),
        cantidad INTEGER NOT NULL DEFAULT 1,
        mensaje TEXT,
        estado VARCHAR(30) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','en_proceso','completado','cancelado')),
        total DECIMAL(10,2),
        creado_en TIMESTAMP DEFAULT NOW(),
        actualizado_en TIMESTAMP DEFAULT NOW()
      );
    `);

    // Índices para búsquedas frecuentes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_productos_artesano ON productos(artesano_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_artesanos_region ON artesanos(region);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_productos_disponible ON productos(disponible);`);

    await client.query('COMMIT');
    console.log('✅ Tablas creadas exitosamente');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error creando tablas:', err);
    throw err;
  } finally {
    client.release();
  }
};

createTables()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
