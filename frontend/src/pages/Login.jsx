import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// 1. Definimos la URL de tu Backend en Render
const API_URL = 'https://smigo-backend-clhr.onrender.com'; 

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: '', password: '', nombre: '' });
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Estados para manejo de errores y carga
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // <--- NUEVO: Para saber si está cargando

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpiar errores previos
    setLoading(true); // <--- Activamos el modo carga (bloquea el botón)

    const endpoint = isLogin ? '/login' : '/registro';
    
    try {
      console.log(`Enviando datos a: ${API_URL}${endpoint}`); // Log para depurar

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      console.log('Respuesta servidor:', data);

      if (res.ok && data.status === 'ok') {
        if (isLogin) {
          // Guardar sesión y redirigir
          login({ nombre: data.nombre, email: form.email, id: data.id });
          navigate('/'); 
        } else {
          alert('Registro exitoso. Ahora inicia sesión.');
          setIsLogin(true); // Cambiar a la vista de login
          setForm({ email: '', password: '', nombre: '' }); // Limpiar formulario
        }
      } else {
        // Error que viene del backend (ej: "Correo incorrecto")
        setError(data.mensaje || 'Error en la solicitud');
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo conectar con el servidor. Puede que esté "despertando", intenta de nuevo en 1 min.');
    } finally {
      setLoading(false); // <--- Desactivamos carga pase lo que pase
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-smigo-cream p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
        {/* Asegúrate que la imagen exista en tu carpeta public */}
        <img src="/logo_smigo.png" alt="Logo" className="w-20 mx-auto mb-4"/>
        <h2 className="text-2xl font-bold text-smigo-green mb-1">Bienvenido a SMIGO</h2>
        <p className="text-gray-400 mb-6 text-sm">Seguridad para tu Ganado</p>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <input 
              required
              type="text" placeholder="Nombre del Ganadero" className="p-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={form.nombre}
              onChange={e => setForm({...form, nombre: e.target.value})}
            />
          )}
          <input 
            required
            type="email" placeholder="Correo Electrónico" className="p-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={form.email}
            onChange={e => setForm({...form, email: e.target.value})}
          />
          <input 
            required
            type="password" placeholder="Contraseña" className="p-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
          />
          
          {/* BOTÓN CON ESTADO DE CARGA */}
          <button 
            disabled={loading} // Desactiva el botón mientras carga
            className={`py-3 rounded-full font-bold transition mt-2 text-white
              ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-smigo-green hover:bg-green-800'}
            `}
          >
            {loading ? 'Procesando...' : (isLogin ? 'INGRESAR' : 'REGISTRARSE')}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-500">
          {isLogin ? '¿Nuevo aquí?' : '¿Ya tienes cuenta?'}
          <button 
            type="button"
            onClick={() => {setIsLogin(!isLogin); setError(''); setForm({ email: '', password: '', nombre: '' })}} 
            className="ml-2 text-smigo-green font-bold underline"
          >
            {isLogin ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}