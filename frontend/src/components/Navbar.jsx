import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, User, Activity, Thermometer } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Función para cerrar el menú al hacer clic en un enlace
  const closeMenu = () => setIsOpen(false);

  return (
    // Agregamos backdrop-blur para un efecto moderno "vidrio" al hacer scroll
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 transition-all duration-300">
      <div className="container mx-auto px-4 md:px-8 py-3">
        <div className="flex justify-between items-center">
          
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2 group" onClick={closeMenu}>
            <div className="relative">
              <img src="/logo_smigo.png" alt="SMIGO" className="h-10 w-auto transition-transform duration-300 group-hover:scale-110" />
            </div>
            <span className="text-2xl font-black text-smigo-green tracking-tight">SMIGO</span>
          </Link>

          {/* --- MENÚ DESKTOP (Hidden en móvil) --- */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-600 font-bold hover:text-smigo-green transition-colors text-sm uppercase tracking-wide">
              Inicio
            </Link>
            
            {user && (
              <>
                <Link to="/parto" className="flex items-center gap-1 text-gray-600 font-bold hover:text-smigo-green transition-colors text-sm uppercase tracking-wide">
                  <Activity size={16} /> Monitor Parto
                </Link>
                <Link to="/estres" className="flex items-center gap-1 text-gray-600 font-bold hover:text-smigo-green transition-colors text-sm uppercase tracking-wide">
                  <Thermometer size={16} /> Bienestar Térmico
                </Link>
              </>
            )}

            {/* SECCIÓN USUARIO DESKTOP */}
            <div className="pl-4 border-l border-gray-200">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                    <div className="bg-smigo-green text-white p-1 rounded-full">
                      <User size={14} />
                    </div>
                    <span className="text-smigo-green font-bold text-sm truncate max-w-[150px]">
                      {user.nombre}
                    </span>
                  </div>
                  <button 
                    onClick={logout} 
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all"
                    title="Cerrar Sesión"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="bg-smigo-green text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-green-800 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                  Ingresar
                </Link>
              )}
            </div>
          </div>

          {/* --- BOTÓN HAMBURGUESA MÓVIL --- */}
          <button 
            className="md:hidden text-gray-600 hover:text-smigo-green focus:outline-none p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* --- MENÚ MÓVIL DESPLEGABLE --- */}
      {/* Usamos un overflow-hidden con transición de altura o renderizado condicional limpio */}
      <div className={`md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-xl transition-all duration-300 ease-in-out origin-top ${isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 h-0 pointer-events-none'}`}>
        <div className="flex flex-col p-6 gap-4">
          <Link to="/" onClick={closeMenu} className="text-gray-600 font-bold hover:text-smigo-green text-lg border-b border-gray-50 pb-2">
            Inicio
          </Link>
          
          {user && (
            <>
              <Link to="/parto" onClick={closeMenu} className="flex items-center gap-3 text-gray-600 font-bold hover:text-smigo-green text-lg border-b border-gray-50 pb-2">
                <Activity size={20} /> Monitor Parto
              </Link>
              <Link to="/estres" onClick={closeMenu} className="flex items-center gap-3 text-gray-600 font-bold hover:text-smigo-green text-lg border-b border-gray-50 pb-2">
                <Thermometer size={20} /> Bienestar Térmico
              </Link>
            </>
          )}

          <div className="pt-2">
            {user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 bg-green-50 p-3 rounded-xl">
                  <User className="text-smigo-green" />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Usuario</span>
                    <span className="text-smigo-green font-bold">{user.nombre}</span>
                  </div>
                </div>
                <button 
                  onClick={() => { logout(); closeMenu(); }} 
                  className="flex items-center justify-center gap-2 w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition"
                >
                  <LogOut size={20} /> Cerrar Sesión
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                onClick={closeMenu}
                className="block w-full text-center bg-smigo-green text-white py-3 rounded-xl font-bold text-lg hover:bg-green-800 transition shadow-md"
              >
                Ingresar a mi Cuenta
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}