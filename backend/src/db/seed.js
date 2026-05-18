const db = require('./index');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seed = async () => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Admin por defecto
    const hashAdmin = await bcrypt.hash('admin123', 10);
    const adminResult = await client.query(`
      INSERT INTO usuarios (nombre, email, password, rol)
      VALUES ('Administrador', 'admin@artesanosoaxaca.mx', $1, 'admin')
      ON CONFLICT (email) DO NOTHING RETURNING id;
    `, [hashAdmin]);

    // Categorías
    const categorias = [
      { nombre: 'Textiles', descripcion: 'Tejidos a mano en telar de cintura y pedal, bordados y tapetes' },
      { nombre: 'Cerámica', descripcion: 'Barro negro, barro verde y alfarería tradicional de Oaxaca' },
      { nombre: 'Madera', descripcion: 'Tallas en copal, alebrijes y muebles artesanales' },
      { nombre: 'Joyería', descripcion: 'Plata, oro y metales preciosos con diseños prehispánicos' },
      { nombre: 'Cuero', descripcion: 'Huaraches, bolsos y accesorios en piel curtida' },
      { nombre: 'Palma', descripcion: 'Sombreros, petates, canastas y cestería' },
    ];

    for (const cat of categorias) {
      await client.query(`
        INSERT INTO categorias (nombre, descripcion)
        VALUES ($1, $2) ON CONFLICT (nombre) DO NOTHING;
      `, [cat.nombre, cat.descripcion]);
    }

    // Artesanos de ejemplo
    const hashArtesano = await bcrypt.hash('artesano123', 10);
    const artesanosData = [
      { nombre: 'María Guadalupe López', email: 'maria@ejemplo.com', comunidad: 'Teotitlán del Valle', region: 'Valles Centrales', tecnica: 'Tejido en telar', bio: 'Tejedora con más de 30 años de experiencia en diseños zapotecas.' },
      { nombre: 'Juan Carlos Mendoza', email: 'juan@ejemplo.com', comunidad: 'San Bartolo Coyotepec', region: 'Valles Centrales', tecnica: 'Barro negro', bio: 'Alfarero especialista en la técnica del barro negro sin torno.' },
      { nombre: 'Rosa Elena Cruz', email: 'rosa@ejemplo.com', comunidad: 'Arrazola', region: 'Valles Centrales', tecnica: 'Talla en copal', bio: 'Artista de alebrijes con diseños únicos basados en la cosmovisión zapoteca.' },
    ];

    for (const a of artesanosData) {
      const userRes = await client.query(`
        INSERT INTO usuarios (nombre, email, password, rol)
        VALUES ($1, $2, $3, 'artesano')
        ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id;
      `, [a.nombre, a.email, hashArtesano]);

      await client.query(`
        INSERT INTO artesanos (usuario_id, nombre_completo, biografia, comunidad, region, tecnica_principal, anios_experiencia, verificado)
        VALUES ($1, $2, $3, $4, $5, $6, 15, true)
        ON CONFLICT DO NOTHING;
      `, [userRes.rows[0].id, a.nombre, a.bio, a.comunidad, a.region, a.tecnica]);
    }

    // Productos de ejemplo
    const artesanosRes = await client.query(`SELECT id FROM artesanos LIMIT 3;`);
    const categoriasRes = await client.query(`SELECT id, nombre FROM categorias;`);

    if (artesanosRes.rows.length > 0 && categoriasRes.rows.length > 0) {
      const productos = [
        { artesano: artesanosRes.rows[0]?.id, cat: 'Textiles', nombre: 'Tapete Zapoteca Grande', precio: 2500, descripcion: 'Tapete tejido en telar de pedal con diseños geométricos zapotecas. 150x90cm.' },
        { artesano: artesanosRes.rows[0]?.id, cat: 'Textiles', nombre: 'Rebozo Tradicional', precio: 800, descripcion: 'Rebozo bordado a mano con figuras de animales y flores.' },
        { artesano: artesanosRes.rows[1]?.id, cat: 'Cerámica', nombre: 'Olla de Barro Negro', precio: 450, descripcion: 'Olla de barro negro bruñido, técnica tradicional de San Bartolo Coyotepec.' },
        { artesano: artesanosRes.rows[1]?.id, cat: 'Cerámica', nombre: 'Candelabro Barro Negro', precio: 350, descripcion: 'Candelabro ceremonial de barro negro con relieves florales.' },
        { artesano: artesanosRes.rows[2]?.id, cat: 'Madera', nombre: 'Alebrije Tigre', precio: 1200, descripcion: 'Alebrije de copal pintado a mano con diseños de puntos y flores. 30cm.' },
        { artesano: artesanosRes.rows[2]?.id, cat: 'Madera', nombre: 'Alebrije Perro', precio: 900, descripcion: 'Perro fantástico tallado en copal, pintado con colores vivos.' },
      ];

      for (const p of productos) {
        if (!p.artesano) continue;
        const catRow = categoriasRes.rows.find(c => c.nombre === p.cat);
        if (!catRow) continue;
        await client.query(`
          INSERT INTO productos (artesano_id, categoria_id, nombre, descripcion, precio, stock, disponible, destacado)
          VALUES ($1, $2, $3, $4, $5, 5, true, true) ON CONFLICT DO NOTHING;
        `, [p.artesano, catRow.id, p.nombre, p.descripcion, p.precio]);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Datos de prueba insertados correctamente');
    console.log('👤 Admin: admin@artesanosoaxaca.mx / admin123');
    console.log('🎨 Artesano: maria@ejemplo.com / artesano123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error en seed:', err);
    throw err;
  } finally {
    client.release();
  }
};

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
