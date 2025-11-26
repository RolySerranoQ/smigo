import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, LogOut, User } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-smigo-green hover:scale-105 transition">
          <img src="/logo_smigo.png" alt="SMIGO" className="h-10" />
          <span>SMIGO</span>
        </Link>

        {/* Botón Menú Móvil */}
        <button className="md:hidden text-smigo-green" onClick={() => setIsOpen(!isOpen)}>
          <Menu size={28} />
        </button>

        {/* Menú Desktop */}
        <div className={`${isOpen ? 'block' : 'hidden'} md:flex flex-col md:flex-row absolute md:static top-16 left-0 w-full md:w-auto bg-white md:bg-transparent p-4 md:p-0 gap-4 items-center shadow-md md:shadow-none transition-all`}>
          <Link to="/" className="font-bold text-smigo-dark hover:text-smigo-green">Inicio</Link>
          
          {user && (
            <>
              <Link to="/parto" className="font-bold text-smigo-dark hover:text-smigo-green">Monitor Parto</Link>
              <Link to="/estres" className="font-bold text-smigo-dark hover:text-smigo-green">Bienestar Térmico</Link>
            </>
          )}

          <div className="flex gap-2">
            {user ? (
              <div className="flex items-center gap-3 bg-smigo-cream px-4 py-2 rounded-full border border-smigo-green">
                <span className="text-smigo-green font-bold flex items-center gap-2">
                  <User size={18}/> {user.nombre}
                </span>
                <button onClick={logout} className="text-red-500 hover:bg-red-50 p-1 rounded-full">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="bg-smigo-green text-white px-6 py-2 rounded-full font-bold hover:bg-green-800 transition shadow-md">
                Ingresar
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}