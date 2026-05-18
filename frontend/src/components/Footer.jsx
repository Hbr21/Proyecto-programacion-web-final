import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="contenedor footer-inner">
        <div className="footer-marca">
          <span className="footer-logo">✦ Artesanos<em>Oaxaca</em></span>
          <p>Conectamos a artesanos oaxaqueños con el mundo, preservando siglos de tradición.</p>
        </div>

        <div className="footer-links">
          <div>
            <h4>Explorar</h4>
            <ul>
              <li><Link to="/catalogo">Catálogo</Link></li>
              <li><Link to="/artesanos">Artesanos</Link></li>
              <li><Link to="/categorias">Categorías</Link></li>
            </ul>
          </div>
          <div>
            <h4>Cuenta</h4>
            <ul>
              <li><Link to="/login">Ingresar</Link></li>
              <li><Link to="/registro">Registrarse</Link></li>
              <li><Link to="/mi-perfil">Mi perfil</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-base">
        <div className="contenedor">
          <p>© {new Date().getFullYear()} Artesanos Oaxaca · Hecho con ❤ en Oaxaca, México</p>
        </div>
      </div>
    </footer>
  );
}
