import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const data = await login(form.email, form.password);
      if (data.usuario.rol === 'admin') navigate('/admin');
      else if (data.usuario.rol === 'artesano') navigate('/mi-perfil');
      else navigate('/catalogo');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-simbolo">✦</span>
          <h1>Bienvenido</h1>
          <p>Ingresa a tu cuenta</p>
        </div>
        {error && <div className="alerta alerta-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="campo">
            <label>Email</label>
            <input
              type="email" required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>
          <div className="campo">
            <label>Contraseña</label>
            <input
              type="password" required
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primario w-full" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p className="auth-footer">
          ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
}

export function Registro() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmar: '', rol: 'comprador' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmar) return setError('Las contraseñas no coinciden.');
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    setCargando(true);
    try {
      await register(form.nombre, form.email, form.password, form.rol);
      if (form.rol === 'artesano') navigate('/mi-perfil');
      else navigate('/catalogo');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-simbolo">✦</span>
          <h1>Únete</h1>
          <p>Crea tu cuenta</p>
        </div>
        {error && <div className="alerta alerta-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="campo">
            <label>Nombre completo</label>
            <input
              required value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Tu nombre completo"
            />
          </div>
          <div className="campo">
            <label>Email</label>
            <input
              type="email" required value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="tu@email.com"
            />
          </div>
          <div className="campo">
            <label>Contraseña</label>
            <input
              type="password" required value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="campo">
            <label>Confirmar contraseña</label>
            <input
              type="password" required value={form.confirmar}
              onChange={e => setForm(f => ({ ...f, confirmar: e.target.value }))}
              placeholder="Repite tu contraseña"
            />
          </div>

          {/* Selector de rol */}
          <div className="campo">
            <label>¿Cómo quieres usar la plataforma?</label>
            <div className="rol-selector">
              <button
                type="button"
                className={`rol-opcion ${form.rol === 'comprador' ? 'activo' : ''}`}
                onClick={() => setForm(f => ({ ...f, rol: 'comprador' }))}
              >
                <span className="rol-icono">🛍</span>
                <strong>Comprador</strong>
                <span>Explora y compra artesanías</span>
              </button>
              <button
                type="button"
                className={`rol-opcion ${form.rol === 'artesano' ? 'activo' : ''}`}
                onClick={() => setForm(f => ({ ...f, rol: 'artesano' }))}
              >
                <span className="rol-icono">🎨</span>
                <strong>Artesano</strong>
                <span>Vende tus creaciones</span>
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primario w-full" disabled={cargando}>
            {cargando ? 'Creando cuenta...' : `Registrarme como ${form.rol}`}
          </button>
        </form>
        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Ingresar</Link>
        </p>
      </div>
    </div>
  );
}