import { Heart, Sun, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Hero Section con Imagen de Fondo */}
      <header 
        className="relative min-h-[85vh] flex items-center justify-center text-center text-white bg-cover bg-center py-20 px-4"
        style={{ 
          backgroundImage: `linear-gradient(rgba(46, 125, 50, 0.85), rgba(46, 125, 50, 0.6)), url('https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=1920')`,
        }}
      >
        <div className="absolute inset-x-0 bottom-0 h-2 bg-smigo-yellow"></div> {/* Borde amarillo inferior */}
        
        <div className="container mx-auto z-10 animate-float max-w-5xl">
          <span className="bg-smigo-yellow text-black px-4 py-2 rounded-full font-bold text-[10px] sm:text-xs md:text-sm uppercase mb-6 inline-block shadow-lg tracking-wider">
            🚀 Tecnología Amiga del Campo
          </span>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-6 leading-tight drop-shadow-lg">
            Tranquilidad para ti,<br/>
            <span className="text-smigo-yellow block mt-2 md:mt-0">Seguridad para tu Hato</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-2xl mb-10 max-w-2xl mx-auto opacity-90 font-light px-2">
            Monitoreo de partos y salud 24/7. Aumenta tu rentabilidad y duerme tranquilo mientras SMIGO vigila.
          </p>
          
          {/* Botones: Stack en móvil (columna), fila en desktop */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mx-auto md:max-w-none">
            <Link 
              to="/login" 
              className="w-full sm:w-auto bg-smigo-yellow text-smigo-dark px-8 py-4 rounded-full font-black text-lg hover:bg-white hover:text-smigo-green transition transform hover:-translate-y-1 shadow-xl inline-flex items-center justify-center gap-2"
            >
              Ver a mis Vacas <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/registro" 
              className="w-full sm:w-auto bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-smigo-green transition text-center"
            >
              Registrarse Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="pb-20 pt-0 container mx-auto px-4 -mt-16 md:-mt-24 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 md:p-12">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-smigo-green mb-3 md:mb-4">Hermandad Tecnológica</h2>
            <p className="text-gray-500 text-sm md:text-lg max-w-2xl mx-auto">Un sistema diseñado para darte la mano cuando más lo necesitas.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard 
              icon={<Heart size={32} className="md:w-10 md:h-10" />} 
              title="Salva Vidas (Partos)" 
              desc="Detectamos el momento exacto del parto y te enviamos una alerta para que puedas asistir si es necesario." 
              color="text-red-500"
              bg="bg-red-100"
            />
            <FeatureCard 
              icon={<Sun size={32} className="md:w-10 md:h-10" />} 
              title="Vacas Felices" 
              desc="Monitoreamos la temperatura y humedad para determinar el estrés que afecta a la vaca." 
              color="text-orange-500"
              bg="bg-orange-100"
            />
            <FeatureCard 
              icon={<Users size={32} className="md:w-10 md:h-10" />} 
              title="Más Tiempo para Ti" 
              desc="Deja de hacer rondas nocturnas innecesarias. SMIGO lo hace por ti. Disfruta de tu familia." 
              color="text-blue-500"
              bg="bg-blue-100"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color, bg }) {
  return (
    <div className="p-6 rounded-2xl border border-gray-100 hover:border-smigo-green hover:shadow-lg transition duration-300 text-center group h-full flex flex-col items-center">
      <div className={`w-16 h-16 md:w-20 md:h-20 ${bg} ${color} rounded-full flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition duration-300 shrink-0`}>
        {icon}
      </div>
      <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 md:mb-3">{title}</h3>
      <p className="text-sm md:text-base text-gray-600 leading-relaxed">{desc}</p>
    </div>
  );
}