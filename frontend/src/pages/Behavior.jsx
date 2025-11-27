import { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';

const HISTORY_SIZE = 50;
const BASE_URL = 'https://smigo-backend-clhr.onrender.com';
const API_URL_ULTIMO = `${BASE_URL}/datos_vaca/ultimo`;
const API_URL_ESTADO = `${BASE_URL}/analisis_cola`;

export default function Behavior() {
  // --- ESTADOS DE SENSORES ---
  const [gyro, setGyro] = useState({ x: 0, y: 0, z: 0 });
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 });
  const [gyroHistory, setGyroHistory] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [errorData, setErrorData] = useState(null);
  const [alertImmediate, setAlertImmediate] = useState(false);

  // --- ESTADOS DE ANALISIS DE COLA ---
  const [estadoCola, setEstadoCola] = useState('');
  const [loadingEstado, setLoadingEstado] = useState(true);

  // 1. PETICIÓN DATOS SENSORES (Cada 10 segundos)
  useEffect(() => {
    const fetchUltimoDato = async () => {
      try {
        const resp = await axios.get(API_URL_ULTIMO);
        const { giro_x, giro_y, giro_z, aceleracion_x, aceleracion_y, aceleracion_z, fecha_registro } = resp.data;

        setGyro({ x: giro_x, y: giro_y, z: giro_z });
        setAccel({ x: aceleracion_x, y: aceleracion_y, z: aceleracion_z });

        setGyroHistory((prev) => {
          const newPoint = { x: giro_x, y: giro_y, z: giro_z, timestamp: fecha_registro || Date.now() };
          const updated = [...prev, newPoint];
          if (updated.length > HISTORY_SIZE) updated.shift();
          return updated;
        });

        // Alerta inmediata si el giro supera 250
        if (Math.abs(giro_x) > 250) setAlertImmediate(true);
        else setAlertImmediate(false);

        setHasData(true);
        setErrorData(null);
        setLoadingData(false);
        setLastUpdate(fecha_registro || new Date().toISOString());
      } catch (err) {
        console.error('Error sensores:', err);
        setErrorData('Error de conexión');
        setLoadingData(false);
      }
    };

    fetchUltimoDato();
    const intervalId = setInterval(fetchUltimoDato, 10000); 
    return () => clearInterval(intervalId);
  }, []);

  // 2. PETICIÓN ESTADO COLA (Cada 2 MINUTOS)
  useEffect(() => {
    const fetchEstadoCola = async () => {
      try {
        console.log('Consultando estado de cola...');
        const resp = await axios.get(API_URL_ESTADO);
        setEstadoCola(resp.data.estado);
      } catch (err) {
        console.error('Error obteniendo el estado de la cola:', err);
      } finally {
        setLoadingEstado(false);
      }
    };

    fetchEstadoCola();
    const intervalId = setInterval(fetchEstadoCola, 120000); // 120,000 ms = 2 minutos
    return () => clearInterval(intervalId);
  }, []);

  // =========================================================
  // 3. HELPERS DE ESTILO Y MENSAJES
  // =========================================================
  
  const loading = loadingEstado; 

  const getCardStyle = () => {
    if (alertImmediate) return 'text-red-600';

    switch (estadoCola) {
      case 'Normal': return 'text-green-600'; 
      case 'Cola levantada': return 'text-red-600';   
      case 'Vaca hechada': return 'text-gray-500';  
      default: return 'text-gray-300';  
    }
  };

  const getMessage = () => {
    if (alertImmediate) return '¡MOVIMIENTO BRUSCO DETECTADO! (>250°/s)';
    switch (estadoCola) {
      case 'Normal': return 'Nivel de actividad normal. Giroscopio estable.';
      case 'Cola levantada': return 'Movimiento de cola levantada detectado. Posible alerta.';
      case 'Vaca hechada': return 'Vaca en reposo anómalo. Revisión recomendada.';
      default: return 'Esperando datos para análisis...';
    }
  };

  const historyX = gyroHistory.map((d) => d.x);
  const historyY = gyroHistory.map((d) => d.y);
  const historyZ = gyroHistory.map((d) => d.z);
  const formattedLastUpdate = lastUpdate ? new Date(lastUpdate).toLocaleString() : '—';

  return (
    // AQUÍ CAMBIAMOS 'bg-gray-50' POR 'bg-green-50' PARA EL FONDO VERDE BAJITO
    <div className="min-h-screen bg-green-50 font-sans p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto">
        
        {/* ENCABEZADO */}
        <div className="mb-8 text-center md:text-left">
          <h2 className="text-2xl md:text-4xl font-extrabold text-gray-800 tracking-tight">
            🐄 Monitor de Comportamiento
          </h2>
          <p className="text-xs md:text-sm text-gray-500 mt-2">
            {loadingData && !hasData && 'Conectando con el dispositivo...'}
            {!loadingData && hasData && (
              <>
                Último dato: <span className="font-semibold text-gray-700">{formattedLastUpdate}</span>
              </>
            )}
            {errorData && <span className="text-red-600 font-medium block mt-1">Error: {errorData}</span>}
          </p>
        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* --- COLUMNA IZQUIERDA: TARJETAS DE DATOS --- */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* 1. TARJETA ESTADO PRINCIPAL */}
            <div className="bg-white p-6 rounded-3xl shadow-lg border-2 border-green-100 transition-all duration-300 hover:shadow-xl text-center">
              <h3 className="text-gray-400 font-bold uppercase text-xs tracking-[0.2em]">ESTADO ACTUAL</h3>
              <div className={`text-3xl md:text-5xl font-black my-4 transition-colors duration-500 ${getCardStyle()}`}>
                {loading ? 'Cargando...' : estadoCola || 'SIN DATOS'}
              </div>
              <p className="text-sm md:text-base font-medium text-gray-600 leading-relaxed px-2">
                {loading ? 'Analizando patrones...' : getMessage()}
              </p>
            </div>

            {/* 2. DATOS GIROSCOPIO */}
            <div className="bg-white p-5 rounded-3xl shadow-lg border border-green-100">
              <h4 className="font-extrabold text-base md:text-lg text-gray-700 mb-4 border-b pb-2 flex items-center gap-2">
                <span>🔄</span> Rotación (°/s)
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {/* Eje X */}
                <div className={`p-3 rounded-2xl border-2 transition-colors ${Math.abs(gyro.x) > 250 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Eje X</div>
                  <div className="font-mono text-lg md:text-xl font-bold text-gray-800 truncate">
                    {hasData ? gyro.x.toFixed(0) : '--'}
                  </div>
                </div>
                {/* Eje Y */}
                <div className="p-3 rounded-2xl border-2 border-gray-100 bg-gray-50">
                  <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Eje Y</div>
                  <div className="font-mono text-lg md:text-xl font-bold text-gray-800 truncate">
                    {hasData ? gyro.y.toFixed(0) : '--'}
                  </div>
                </div>
                {/* Eje Z */}
                <div className="p-3 rounded-2xl border-2 border-gray-100 bg-gray-50">
                  <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Eje Z</div>
                  <div className="font-mono text-lg md:text-xl font-bold text-gray-800 truncate">
                    {hasData ? gyro.z.toFixed(0) : '--'}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. DATOS ACELERÓMETRO */}
            <div className="bg-white p-5 rounded-3xl shadow-lg border border-green-100">
              <h4 className="font-extrabold text-base md:text-lg text-gray-700 mb-4 border-b pb-2 flex items-center gap-2">
                <span>⚡</span> Aceleración (G)
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {['X', 'Y', 'Z'].map((axis, i) => (
                  <div key={axis} className="p-3 rounded-2xl border-2 border-gray-100 bg-gray-50 text-center">
                    <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Eje {axis}</div>
                    <div className="font-mono text-lg md:text-xl font-bold text-gray-800 truncate">
                      {hasData ? (i === 0 ? accel.x : i === 1 ? accel.y : accel.z).toFixed(2) : '--'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --- COLUMNA DERECHA: GRÁFICO 3D --- */}
          <div className="lg:col-span-2">
            <div className="bg-white p-4 md:p-6 rounded-3xl shadow-lg border border-green-100 h-[450px] md:h-[550px] lg:h-[600px] flex flex-col relative overflow-hidden">
              <div className="absolute top-6 left-6 z-10 pointer-events-none">
                <h4 className="font-extrabold text-lg text-gray-700 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg inline-block">
                  Historial 3D
                </h4>
                <p className="text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg inline-block mt-1">
                  Rastro de movimiento en tiempo real
                </p>
              </div>
              
              <div className="flex-grow w-full h-full">
                <Plot
                  data={[
                    {
                      type: 'scatter3d',
                      mode: 'lines',
                      x: historyX, y: historyY, z: historyZ,
                      name: 'Rastro',
                      line: { width: 5, color: '#4CAF50', opacity: 0.8 },
                    },
                    {
                      type: 'scatter3d',
                      mode: 'markers',
                      x: [gyro.x], y: [gyro.y], z: [gyro.z],
                      name: 'Actual',
                      marker: { size: 10, color: alertImmediate ? '#EF4444' : '#F59E0B', symbol: 'circle', line: {width: 2, color: 'white'} },
                    },
                  ]}
                  layout={{
                    autosize: true,
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    scene: {
                      xaxis: { title: 'X', backgroundcolor: '#f9fafb', gridcolor: '#e5e7eb' },
                      yaxis: { title: 'Y', backgroundcolor: '#f9fafb', gridcolor: '#e5e7eb' },
                      zaxis: { title: 'Z', backgroundcolor: '#f9fafb', gridcolor: '#e5e7eb' },
                      aspectmode: 'cube',
                      camera: { eye: { x: 1.5, y: 1.5, z: 1.5 } }
                    },
                    margin: { l: 0, r: 0, b: 0, t: 0 },
                    showlegend: true,
                    legend: { x: 0, y: 0, orientation: 'h', bgcolor: 'rgba(255,255,255,0.5)' },
                  }}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false, responsive: true }}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}