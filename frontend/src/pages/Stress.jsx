// Stress.jsx
import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

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
    console.error(`ITH: Datos fuera de rango seguro. T=${T}, RH=${RH}`);
    return 0;
  }

  return STRESS_TABLE[TIndex][safeRHIndex];
}

export default function Stress() {
  const [data, setData] = useState({ temp: 0, hum: 0 });
  const [ith, setIth] = useState(0);
  
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      { label: 'Temp (°C)', data: [], borderColor: '#d32f2f', backgroundColor: 'rgba(211, 47, 47, 0.1)', fill: true },
      { label: 'Humedad (%)', data: [], borderColor: '#1976D2', backgroundColor: 'rgba(25, 118, 210, 0.1)', fill: true }
    ]
  });

  // Polling con setInterval
  useEffect(() => {
    const interval = setInterval(() => {
      axios.get('http://localhost:3000/ultimo_dato')
        .then((response) => {
          const data = response.data;
          console.log("Datos recibidos:", data);

          const T = parseFloat(data.temperatura || 0);
          const RH = parseFloat(data.humedad || 0);
          const ITH_val = calculateIthFromTable(T, RH);

          setData({ temp: T, hum: RH });
          setIth(ITH_val);

          // Actualizar gráfica
          const timeNow = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setChartData(prev => {
            const newLabels = [...prev.labels, timeNow].slice(-10);
            const newTemp = [...prev.datasets[0].data, T].slice(-10);
            const newHum = [...prev.datasets[1].data, RH].slice(-10);
            return {
              labels: newLabels,
              datasets: [
                { ...prev.datasets[0], data: newTemp },
                { ...prev.datasets[1], data: newHum }
              ]
            };
          });
        })
        .catch((error) => {
          console.error("❌ Error al obtener los datos:", error);
        });
    }, 5000); // Realiza la solicitud cada 5 segundos

    // Limpiar el intervalo al desmontar el componente
    return () => clearInterval(interval);
  }, []);

  const getStatus = (val) => {
    if (val <= 74) return { text: 'NORMAL', color: 'bg-green-100 text-green-800 border-green-500', icon: '🙂' };
    if (val <= 78) return { text: 'ALERTA', color: 'bg-yellow-100 text-yellow-800 border-yellow-500', icon: '😐' };
    if (val <= 84) return { text: 'PELIGRO', color: 'bg-orange-100 text-orange-800 border-orange-500', icon: '😟' };
    return { text: 'EMERGENCIA', color: 'bg-red-200 text-red-900 border-red-700 animate-pulse', icon: '🥵' };
  };

  const status = getStatus(ith);

  return (
    <div className="container mx-auto p-4 pb-20">
      <h2 className="text-3xl font-bold text-[#2E7D32] mb-6">🌡️ Bienestar Térmico Bovino</h2>
      
      <div className={`card p-8 rounded-2xl text-center mb-8 border-4 ${status.color} shadow-xl`}>
        <h3 className="text-xl font-bold uppercase tracking-widest opacity-70">Índice ITH</h3>
        <div className="text-6xl my-4">{status.icon} {status.text}</div>
        <p className="text-2xl font-bold">ITH Calculado: <span className="text-4xl">{ith}</span></p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h4 className="text-red-600 font-bold text-xl mb-2">Temperatura Ambiente</h4>
          <p className="text-4xl font-bold mb-4">{data.temp.toFixed(1)} °C</p>
          <Line data={{labels: chartData.labels, datasets: [chartData.datasets[0]]}} options={{scales: {y: {min: 20, max: 40}}}} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h4 className="text-blue-600 font-bold text-xl mb-2">Humedad Relativa</h4>
          <p className="text-4xl font-bold mb-4">{data.hum.toFixed(1)} %</p>
          <Line data={{labels: chartData.labels, datasets: [chartData.datasets[1]]}} options={{scales: {y: {min: 0, max: 100}}}} />
        </div>
      </div>
    </div>
  );
}