# 🌿 Artesanos Oaxaca

Plataforma web para conectar artesanos oaxaqueños con compradores, preservando tradiciones artesanales.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18, React Router v6, Vite, HTML5, CSS3 |
| Backend | Node.js, Express.js |
| Base de datos | PostgreSQL |
| Autenticación | JWT (jsonwebtoken) |
| Archivos | Multer |
| Seguridad | bcryptjs, CORS |

---

## Funcionalidades

### Públicas
- 🏠 Página de inicio con productos destacados y artesanos verificados
- 🛍 Catálogo con filtros por categoría, búsqueda y paginación
- 👤 Perfil público de cada artesano con sus productos
- 📦 Detalle de producto con galería, reseñas y formulario de contacto
- 🗂 Categorías de artesanías
- 📬 Formulario para enviar pedidos/consultas al artesano

### Artesanos (requieren login)
- 📝 Registro y login con JWT
- 🖼 Editar perfil: nombre, biografía, comunidad, región, técnica, teléfono
- ➕ Crear, editar y eliminar productos
- 📋 Ver y gestionar pedidos recibidos con actualización de estado
- 📸 Subir imágenes de perfil y de productos

### Administrador
- 📊 Panel de estadísticas: artesanos, productos, pedidos, ingresos, reseñas
- ✅ Verificar o revocar verificación de artesanos
- 📦 Ver todos los pedidos del sistema
- 🗂 Crear y editar categorías

---

## Estructura del proyecto

```
artesanos-oaxaca/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── artesanosController.js
│   │   │   ├── productosController.js
│   │   │   └── otrosControllers.js
│   │   ├── db/
│   │   │   ├── index.js          # Pool de conexión
│   │   │   ├── migrate.js        # Crear tablas
│   │   │   └── seed.js           # Datos de prueba
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT middleware
│   │   │   └── upload.js         # Multer config
│   │   ├── routes/
│   │   │   └── index.js          # Todas las rutas API
│   │   └── index.js              # Entry point Express
│   ├── uploads/                  # Imágenes subidas (se crea automático)
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx / .css
    │   │   ├── Footer.jsx / .css
    │   │   └── Componentes.jsx / .css   # Tarjetas, Estrellas, Spinner, etc.
    │   ├── context/
    │   │   └── AuthContext.jsx    # Estado global de autenticación
    │   ├── pages/
    │   │   ├── Inicio.jsx / .css
    │   │   ├── Catalogo.jsx / .css
    │   │   ├── Producto.jsx / .css
    │   │   ├── Artesanos.jsx / .css
    │   │   ├── PerfilArtesano.jsx / .css
    │   │   ├── Categorias.jsx / .css
    │   │   ├── Auth.jsx / .css    # Login + Registro
    │   │   ├── MiPerfil.jsx / .css
    │   │   └── Admin.jsx / .css
    │   ├── services/
    │   │   └── api.js             # Axios con interceptors JWT
    │   ├── App.jsx                # Router principal
    │   ├── main.jsx
    │   └── index.css              # Variables y estilos globales
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Instalación y configuración

### Prerrequisitos
- Node.js >= 18
- PostgreSQL >= 14
- npm o yarn

---

### 1. Clonar y preparar

```bash
git clone <tu-repo>
cd artesanos-oaxaca
```

### 2. Configurar el backend

```bash
cd backend
npm install

# Copiar y editar variables de entorno
cp .env.example .env
```

Edita `.env` con tus datos:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=artesanos_oaxaca
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
JWT_SECRET=una_clave_secreta_muy_larga_y_segura
JWT_EXPIRES_IN=7d
```

### 3. Crear la base de datos

```bash
# En psql o pgAdmin, crea la base de datos:
CREATE DATABASE artesanos_oaxaca;

# Luego ejecuta las migraciones:
npm run db:migrate

# Opcionalmente, agrega datos de prueba:
npm run db:seed
```

### 4. Iniciar el backend

```bash
npm run dev
# Servidor en http://localhost:4000
```

### 5. Configurar el frontend

```bash
cd ../frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:4000/api  (ya viene así por defecto)
```

### 6. Iniciar el frontend

```bash
npm run dev
# App en http://localhost:3000
```

---

## Endpoints de la API

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/register | Registro |
| POST | /api/auth/login | Login → retorna JWT |
| GET | /api/auth/me | Perfil propio (🔒) |
| PUT | /api/auth/password | Cambiar contraseña (🔒) |

### Artesanos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/artesanos | Listar (filtros: region, tecnica, buscar, verificado) |
| GET | /api/artesanos/regiones | Regiones disponibles |
| GET | /api/artesanos/:id | Perfil público |
| GET | /api/artesanos/perfil/mio | Mi perfil (🔒) |
| PUT | /api/artesanos/perfil | Actualizar perfil (🔒) |
| POST | /api/artesanos/perfil/foto | Subir foto (🔒) |
| PUT | /api/artesanos/:id/verificar | Verificar (🔒 admin) |

### Productos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/productos | Listar (filtros: categoria, artesano, buscar, precio) |
| GET | /api/productos/destacados | Productos destacados |
| GET | /api/productos/:id | Detalle |
| POST | /api/productos | Crear (🔒 artesano) |
| PUT | /api/productos/:id | Editar (🔒) |
| DELETE | /api/productos/:id | Eliminar (🔒) |
| POST | /api/productos/:id/imagenes | Subir imagen (🔒) |
| DELETE | /api/productos/:id/imagenes/:imgId | Eliminar imagen (🔒) |
| POST | /api/productos/:id/resenas | Agregar reseña |

### Categorías
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/categorias | Listar |
| POST | /api/categorias | Crear (🔒 admin) |
| PUT | /api/categorias/:id | Editar (🔒 admin) |

### Pedidos
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/pedidos | Crear pedido público |
| GET | /api/pedidos/mis-pedidos | Pedidos del artesano (🔒) |
| PUT | /api/pedidos/:id/estado | Actualizar estado (🔒) |
| GET | /api/admin/pedidos | Todos los pedidos (🔒 admin) |

### Admin
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/admin/estadisticas | Stats generales (🔒 admin) |

---

## Usuarios de prueba (después del seed)

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | admin@artesanosoaxaca.mx | admin123 |
| Artesano | maria@ejemplo.com | artesano123 |
| Artesano | juan@ejemplo.com | artesano123 |

---

## Esquema de base de datos

```
usuarios          → artesanos (1:1)
artesanos         → productos (1:N)
productos         → imagenes_producto (1:N)
productos         → resenas (1:N)
artesanos/productos → pedidos (N:1)
productos         → categorias (N:1)
```

---

## Despliegue en producción

### Backend
```bash
NODE_ENV=production
FRONTEND_URL=https://tu-dominio.com
```

### Frontend
```bash
npm run build
# Los archivos estáticos quedan en /dist
```

Puedes usar **Railway**, **Render** o **Fly.io** para el backend, y **Vercel** o **Netlify** para el frontend.
