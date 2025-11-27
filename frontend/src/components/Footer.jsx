import React from 'react';
import { Heart, Facebook, Twitter, Instagram, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-auto border-t-4 border-smigo-green">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-10">
          
          <div className="text-center md:text-left space-y-4">
            <h4 className="text-3xl font-black text-white tracking-wider flex items-center justify-center md:justify-start gap-2">
              <span className="text-smigo-green">SM</span>IGO
            </h4>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto md:mx-0">
              Sistema de Monitoreo Inteligente para Ganadería Optimizada. Tecnología accesible para proteger tu hato y mejorar tu rentabilidad.
            </p>
            <div className="flex justify-center md:justify-start gap-4 pt-2">
              <SocialIcon Icon={Facebook} />
              <SocialIcon Icon={Instagram} />
              <SocialIcon Icon={Twitter} />
            </div>
          </div>

          <div className="text-center md:text-left">
            <h5 className="text-white font-bold uppercase tracking-wider mb-4 text-sm">Navegación</h5>
            <ul className="space-y-2 text-sm">
              <li><FooterLink to="/" text="Inicio" /></li>
              <li><FooterLink to="/login" text="Ingresar / Registro" /></li>
              <li><FooterLink to="/parto" text="Monitor de Parto" /></li>
              <li><FooterLink to="/estres" text="Bienestar Térmico" /></li>
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h5 className="text-white font-bold uppercase tracking-wider mb-4 text-sm">Contáctanos</h5>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center justify-center md:justify-start gap-2">
                <Mail size={16} className="text-smigo-green" />
                <span>contacto@vacatech.com</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                <Phone size={16} className="text-smigo-green" />
                <span>+59167441819</span>
              </li>
              <li className="text-xs pt-2">
                Cochabamba, Bolivia
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>
            © {new Date().getFullYear()} <span className="text-white font-bold">SMIGO</span>. Todos los derechos reservados.
          </p>
          
          <p className="flex items-center gap-1">
            Hecho con 
            <Heart size={14} className="text-red-500 fill-current animate-pulse" /> 
            para el campo.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, text }) {
  return (
    <Link to={to} className="hover:text-smigo-green transition-colors duration-200 block py-1">
      {text}
    </Link>
  );
}

function SocialIcon({ Icon }) {
  return (
    <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-smigo-green hover:text-white transition-all duration-300">
      <Icon size={18} />
    </a>
  );
}