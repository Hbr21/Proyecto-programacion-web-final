import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import './Navbar.css';

export default function Navbar() {
  const { usuario, logout, esAdmin, esArtesano } = useAuth();
  const { totalItems } = useCarrito();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="contenedor navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-simbolo">✦</span>
          <span className="logo-texto">Artesanos<em>Oaxaca</em></span>
        </Link>

        <div className={`navbar-links ${menuAbierto ? 'abierto' : ''}`}>
          <Link to="/catalogo" onClick={() => setMenuAbierto(false)}>Catálogo</Link>
          <Link to="/artesanos" onClick={() => setMenuAbierto(false)}>Artesanos</Link>
          <Link to="/categorias" onClick={() => setMenuAbierto(false)}>Categorías</Link>

          {usuario ? (
            <div className="navbar-usuario">
              <span className="usuario-nombre ocultar-movil">Hola, {usuario.nombre.split(' ')[0]}</span>

              {/* Carrito — visible para todos los usuarios logueados */}
              <Link to="/carrito" className="carrito-btn" onClick={() => setMenuAbierto(false)}>
                🛒
                {totalItems > 0 && (
                  <span className="carrito-badge">{totalItems}</span>
                )}
              </Link>

              {esAdmin && (
                <Link to="/admin" className="btn btn-sm btn-verde" onClick={() => setMenuAbierto(false)}>Admin</Link>
              )}

              {/* Mi perfil solo para artesanos y admin */}
              {esArtesano && (
                <Link to="/mi-perfil" className="btn btn-sm btn-secundario" onClick={() => setMenuAbierto(false)}>Mi perfil</Link>
              )}

              <button className="btn btn-sm btn-primario" onClick={handleLogout}>Salir</button>
            </div>
          ) : (
            <div className="navbar-auth">
              <Link to="/login" className="btn btn-sm btn-secundario" onClick={() => setMenuAbierto(false)}>Ingresar</Link>
              <Link to="/registro" className="btn btn-sm btn-primario" onClick={() => setMenuAbierto(false)}>Registrarse</Link>
            </div>
          )}
        </div>

        <button
          className={`navbar-hamburguesa ${menuAbierto ? 'abierto' : ''}`}
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-label="Menú"
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}