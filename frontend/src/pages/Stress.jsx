// Stress.jsx
import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// --- TABLA Y LÓGICA DE ITH (INTACTA) ---
const STRESS_TABLE = [
  [65, 66, 67, 68, 69, 69, 70, 71, 72, 73, 73],
  [66, 67, 68, 69, 70, 71, 71, 72, 73, 74, 75],
  [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77],
  [67, 69, 70, 71, 72, 73, 74, 75, 77, 78, 79],
  [68, 69, 71, 72, 73, 74, 76, 77, 78, 79, 81],
  [69, 70, 72, 73, 74, 76, 77, 78, 80, 81, 82],
  [70, 71, 73, 74, 76, 77, 78, 80, 81, 83, 84],
  [71, 72, 74, 75, 77, 78, 80, 81, 83, 84, 86],
  [71, 73, 75, 76, 78, 80, 81, 83, 85, 86, 88],
  [72, 74, 76, 77, 79, 81, 83, 84, 86, 88, 90],
  [74, 75, 77, 79, 80, 82, 84, 86, 88, 90, 91],
  [74, 76, 78, 80, 82, 84, 85, 87, 89, 91, 93],
  [75, 77, 79, 81, 83, 85, 88, 89, 91, 93, 95],
  [76, 78, 80, 82, 84, 86, 88, 90, 93, 95, 97],
  [77, 79, 81, 83, 85, 87, 90, 92, 94, 96, 99],
  [78, 79, 82, 84, 86, 89, 91, 93, 96, 98, 100],
];
const MIN_TEMP = 23; 
const MAX_TEMP = 38; 
const TEMP_RANGE = MAX_TEMP - MIN_TEMP + 1;

function calculateIthFromTable(T, RH) {
  const safeT = Math.max(MIN_TEMP, Math.min(MAX_TEMP, Math.round(T)));
  const safeRHIndex = Math.max(0, Math.min(10, Math.round(RH / 10))); 
  const TIndex = safeT - MIN_TEMP;

  if (TIndex < 0 || TIndex >= TEMP_RANGE || safeRHIndex < 0 || safeRHIndex > 10) {
    return 0; // Fuera de rango
  }
  return STRESS_TABLE[TIndex][safeRHIndex];
}

// --- COMPONENTE PRINCIPAL ---
export default function Stress() {
  const [data, setData] = useState({ temp: 0, hum: 0 });
  const [ith, setIth] = useState(0);
  
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      { 
        label: 'Temp (°C)', 
        data: [], 
        borderColor: '#EF4444', // Red-500
        backgroundColor: 'rgba(239, 68, 68, 0.1)', 
        fill: true,
        tension: 0.4, // Curvas suaves
        pointRadius: 3
      },
      { 
        label: 'Humedad (%)', 
        data: [], 
        borderColor: '#3B82F6', // Blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)', 
        fill: true,
        tension: 0.4, // Curvas suaves
        pointRadius: 3
      }
    ]
  });

  // Polling con setInterval
  useEffect(() => {
    const fetchStressData = () => {
      // USAMOS LA URL DE RENDER
      axios.get('https://smigo-backend-clhr.onrender.com/ultimo_dato')
        .then((response) => {
          const apiData = response.data;
          
          const T = parseFloat(apiData.temperatura || 0);
          const RH = parseFloat(apiData.humedad || 0);
          const ITH_val = calculateIthFromTable(T, RH);

          setData({ temp: T, hum: RH });
          setIth(ITH_val);

          // Actualizar gráfica
          const timeNow = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setChartData(prev => {
            const newLabels = [...prev.labels, timeNow].slice(-15); // Muestra últimos 15 puntos
            const newTemp = [...prev.datasets[0].data, T].slice(-15);
            const newHum = [...prev.datasets[1].data, RH].slice(-15);
            return {
              labels: newLabels,
              datasets: [
                { ...prev.datasets[0], data: newTemp },
                { ...prev.datasets[1], data: newHum }
              ]
            };
          });
        })
        .catch((error) => console.error("Error fetching data:", error));
    };

    fetchStressData();
    const interval = setInterval(fetchStressData, 5000); 

    return () => clearInterval(interval);
  }, []);

  const getStatus = (val) => {
    if (val <= 74) return { text: 'NORMAL', bg: 'bg-green-100', textCol: 'text-green-700', border: 'border-green-300', icon: '' };
    if (val <= 78) return { text: 'ALERTA', bg: 'bg-yellow-50', textCol: 'text-yellow-700', border: 'border-yellow-300', icon: '' };
    if (val <= 84) return { text: 'PELIGRO', bg: 'bg-orange-50', textCol: 'text-orange-700', border: 'border-orange-300', icon: '' };
    return { text: 'EMERGENCIA', bg: 'bg-red-50', textCol: 'text-red-700', border: 'border-red-300 animate-pulse', icon: '🆘' };
  };

  const status = getStatus(ith);

  // Opciones comunes para las gráficas
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1f2937',
        bodyColor: '#1f2937',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 } } }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    // FONDO VERDE BAJITO PARA TODA LA PANTALLA
    <div className="min-h-screen bg-green-50 font-sans p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto">
        
        {/* ENCABEZADO */}
        <div className="mb-8 text-center md:text-left">
          <h2 className="text-2xl md:text-4xl font-extrabold text-gray-800 tracking-tight">
            Nivel de estres de la vaca
          </h2>
          <p className="text-gray-500 mt-2 text-sm">Monitoreo del Índice de Temperatura y Humedad (ITH) en tiempo real.</p>
        </div>
        
        {/* TARJETA PRINCIPAL: ITH */}
        <div className={`p-8 rounded-3xl text-center mb-8 shadow-xl border-2 transition-all duration-500 bg-white ${status.border}`}>
          <div className="flex flex-col items-center justify-center">
            <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 ${status.bg} ${status.textCol}`}>
              Estado Actual
            </span>
            <div className="flex items-center gap-4 mb-2">
              <span className="text-6xl md:text-7xl">{status.icon}</span>
              <div className="text-left">
                <div className={`text-4xl md:text-6xl font-black ${status.textCol}`}>
                  {ith}
                </div>
                <div className="text-sm text-gray-400 font-medium">Índice ITH</div>
              </div>
            </div>
            <p className={`text-lg md:text-2xl font-bold mt-2 ${status.textCol}`}>
              Nivel de estres: {status.text}
            </p>
          </div>
        </div>

        {/* GRID DE GRÁFICAS */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          
          {/* TARJETA TEMPERATURA */}
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-green-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-gray-500 font-bold text-sm uppercase tracking-wide">Temperatura</h4>
                <p className="text-3xl font-black text-gray-800">{data.temp.toFixed(1)} <span className="text-lg text-gray-400 font-normal">°C</span></p>
              </div>
              <div className="p-3 bg-red-50 rounded-2xl">
                <span className="text-2xl"></span>
              </div>
            </div>
            <div className="flex-grow h-64 w-full">
              <Line 
                data={{labels: chartData.labels, datasets: [chartData.datasets[0]]}} 
                options={{ ...commonOptions, scales: { ...commonOptions.scales, y: { min: 20, max: 45 } } }} 
              />
            </div>
          </div>

          {/* TARJETA HUMEDAD */}
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-green-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-gray-500 font-bold text-sm uppercase tracking-wide">Humedad Relativa</h4>
                <p className="text-3xl font-black text-gray-800">{data.hum.toFixed(1)} <span className="text-lg text-gray-400 font-normal">%</span></p>
              </div>
              <div className="p-3 bg-blue-50 rounded-2xl">
                <span className="text-2xl"></span>
              </div>
            </div>
            <div className="flex-grow h-64 w-full">
              <Line 
                data={{labels: chartData.labels, datasets: [chartData.datasets[1]]}} 
                options={{ ...commonOptions, scales: { ...commonOptions.scales, y: { min: 0, max: 100 } } }} 
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}