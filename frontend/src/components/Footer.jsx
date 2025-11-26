import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-10 mt-auto border-t-4 border-yellow-400">
      <div className="container mx-auto px-6 text-center">
        {/* Logo o Nombre en el Footer */}
        <h4 className="text-2xl font-black text-yellow-400 mb-3 tracking-wider">
          SMIGO
        </h4>
        
        {/* Texto de derechos */}
        <p className="text-gray-400 text-sm font-medium flex items-center justify-center gap-1">
          Sistema de Monitoreo Inteligente para Ganadería Optimizada | Hecho con 
          <Heart size={16} className="text-red-500 fill-current animate-pulse" /> 
          para el campo.
        </p>
        
        {/* Copyright */}
        <p className="text-gray-600 text-xs mt-4">
          © {new Date().getFullYear()} Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}