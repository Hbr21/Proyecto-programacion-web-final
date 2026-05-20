import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CarritoProvider } from './context/CarritoContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Inicio from './pages/Inicio';
import Catalogo from './pages/Catalogo';
import Producto from './pages/Producto';
import Artesanos from './pages/Artesanos';
import PerfilArtesano from './pages/PerfilArtesano';
import Categorias from './pages/Categorias';
import { Login, Registro } from './pages/Auth';
import MiPerfil from './pages/MiPerfil';
import Admin from './pages/Admin';
import Carrito from './pages/Carrito';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <CarritoProvider>
        <BrowserRouter>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <div style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<Inicio />} />
                <Route path="/catalogo" element={<Catalogo />} />
                <Route path="/producto/:id" element={<Producto />} />
                <Route path="/artesanos" element={<Artesanos />} />
                <Route path="/artesano/:id" element={<PerfilArtesano />} />
                <Route path="/categorias" element={<Categorias />} />
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Registro />} />
                <Route path="/mi-perfil" element={<MiPerfil />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/carrito" element={<Carrito />} />
                <Route path="*" element={
                  <div className="contenedor text-center" style={{ padding: '5rem 1.5rem' }}>
                    <h1>404</h1>
                    <p>Página no encontrada.</p>
                    <a href="/" className="btn btn-primario mt-3">Ir al inicio</a>
                  </div>
                } />
              </Routes>
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </CarritoProvider>
    </AuthProvider>
  );
}

export default App;