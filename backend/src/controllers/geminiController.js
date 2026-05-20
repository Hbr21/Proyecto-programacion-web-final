const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../db');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/gemini/buscar
const buscarProductos = async (req, res) => {
  const { consulta } = req.body;

  if (!consulta || consulta.trim().length === 0) {
    return res.status(400).json({ error: 'La consulta no puede estar vacía.' });
  }

  try {
    // 1. Obtener todos los productos de la BD para que Gemini los analice
    const result = await db.query(`
      SELECT
        p.id, p.nombre, p.descripcion, p.precio, p.tecnica, p.materiales,
        c.nombre AS categoria,
        a.nombre_completo AS artesano,
        a.comunidad,
        a.region,
        (SELECT url FROM imagenes_producto WHERE producto_id = p.id AND es_principal = true LIMIT 1) AS imagen_principal
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN artesanos a ON p.artesano_id = a.id
      WHERE p.disponible = true
      ORDER BY p.destacado DESC
      LIMIT 50
    `);

    const productos = result.rows;

    if (productos.length === 0) {
      return res.json({ productos: [], mensaje: 'No hay productos disponibles aún.' });
    }

    // 2. Construir el prompt para Gemini
    const listaProductos = productos.map(p =>
      `ID:${p.id} | Nombre: ${p.nombre} | Categoría: ${p.categoria || 'Sin categoría'} | Precio: $${p.precio} MXN | Técnica: ${p.tecnica || 'N/A'} | Materiales: ${p.materiales || 'N/A'} | Artesano: ${p.artesano} | Comunidad: ${p.comunidad || 'N/A'} | Descripción: ${p.descripcion || 'Sin descripción'}`
    ).join('\n');

    const prompt = `
Eres un asistente experto en artesanías oaxaqueñas. Tu tarea es analizar la siguiente consulta del usuario y encontrar los productos más relevantes de la lista disponible.

Consulta del usuario: "${consulta}"

Lista de productos disponibles:
${listaProductos}

Instrucciones:
- Analiza la consulta con inteligencia: si pide "algo para regalo", busca productos bonitos o decorativos. Si pide "azul", busca productos que puedan ser de ese color. Si pide "barato", ordena por precio menor.
- Selecciona los IDs de los productos más relevantes para la consulta (máximo 8).
- Si no hay productos relevantes, devuelve una lista vacía.
- Responde ÚNICAMENTE con un JSON válido con este formato exacto, sin texto adicional:
{
  "ids": [1, 2, 3],
  "explicacion": "Encontré estos productos porque..."
}
`;

    // 3. Llamar a Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const respuesta = await model.generateContent(prompt);
    const texto = respuesta.response.text();

    // 4. Parsear la respuesta de Gemini
    let idsSeleccionados = [];
    let explicacion = '';

    try {
      const jsonLimpio = texto.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(jsonLimpio);
      idsSeleccionados = parsed.ids || [];
      explicacion = parsed.explicacion || '';
    } catch (e) {
      console.error('Error parseando respuesta de Gemini:', texto);
      return res.json({ productos: [], explicacion: 'No encontré productos para tu búsqueda.' });
    }

    // 5. Filtrar productos por los IDs que seleccionó Gemini
    const productosFiltrados = productos.filter(p => idsSeleccionados.includes(p.id));

    res.json({
      productos: productosFiltrados,
      explicacion,
      total: productosFiltrados.length,
    });

  } catch (err) {
    console.error('Error en búsqueda con Gemini:', err);
    res.status(500).json({ error: 'Error al procesar la búsqueda inteligente.' });
  }
};

module.exports = { buscarProductos };