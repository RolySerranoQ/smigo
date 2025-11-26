import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: '', password: '', nombre: '' });
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // Cambia http://localhost:3000 por tu URL de Render si ya está subido
  const API_URL = 'http://localhost:3000'; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/login' : '/registro';
    
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (data.status === 'ok') {
        if (isLogin) {
          login({ nombre: data.nombre, email: form.email });
          navigate('/'); // Ir al Home
        } else {
          alert('Registro exitoso. Inicia sesión.');
          setIsLogin(true);
        }
      } else {
        setError(data.mensaje);
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-smigo-cream p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
        <img src="/logo_smigo.png" alt="Logo" className="w-20 mx-auto mb-4"/>
        <h2 className="text-2xl font-bold text-smigo-green mb-1">Bienvenido a SMIGO</h2>
        <p className="text-gray-400 mb-6 text-sm">Seguridad para tu Ganado</p>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <input 
              type="text" placeholder="Nombre del Ganadero" className="p-3 bg-gray-50 border rounded-lg"
              onChange={e => setForm({...form, nombre: e.target.value})}
            />
          )}
          <input 
            type="email" placeholder="Correo Electrónico" className="p-3 bg-gray-50 border rounded-lg"
            onChange={e => setForm({...form, email: e.target.value})}
          />
          <input 
            type="password" placeholder="Contraseña" className="p-3 bg-gray-50 border rounded-lg"
            onChange={e => setForm({...form, password: e.target.value})}
          />
          
          <button className="bg-smigo-green text-white py-3 rounded-full font-bold hover:bg-green-800 transition mt-2">
            {isLogin ? 'INGRESAR' : 'REGISTRARSE'}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-500">
          {isLogin ? '¿Nuevo aquí?' : '¿Ya tienes cuenta?'}
          <button onClick={() => {setIsLogin(!isLogin); setError('')}} className="ml-2 text-smigo-green font-bold underline">
            {isLogin ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}