import { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';

const HISTORY_SIZE = 50;
const API_URL_ULTIMO = 'http://localhost:3000/datos_vaca/ultimo';
const API_URL_ESTADO = 'http://localhost:3000/analisis_cola';

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

  // Definición de Colores según tu requerimiento
  const getCardStyle = () => {
    // Si hay alerta inmediata (sensor brusco), priorizamos rojo
    if (alertImmediate) return 'text-red-600';

    switch (estadoCola) {
      case 'Normal':
        return 'text-green-600'; // VERDE
      case 'Cola levantada':
        return 'text-red-600';   // ROJO
      case 'Vaca hechada':
        return 'text-gray-500';  // GRIS / PLOMO
      default:
        return 'text-gray-300';  // Desconocido
    }
  };

  const getMessage = () => {
    if (alertImmediate) return 'Estado de la actividad Bovina';
    switch (estadoCola) {
      case 'Normal':
        return 'Nivel de actividad normal. Giroscopio estable.';
      case 'Cola levantada':
        return 'Movimiento de cola levantada detectado. Posible alerta.';
      case 'Vaca hechada':
        return 'Vaca en reposo anómalo. Revisión recomendada.';
      default:
        return 'Esperando datos para análisis...';
    }
  };

  // Datos para gráfica
  const historyX = gyroHistory.map((d) => d.x);
  const historyY = gyroHistory.map((d) => d.y);
  const historyZ = gyroHistory.map((d) => d.z);
  const formattedLastUpdate = lastUpdate ? new Date(lastUpdate).toLocaleString() : '—';

  return (
    <div className="container mx-auto p-4 pb-20 bg-gray-50 min-h-screen font-sans">
      <h2 className="text-4xl font-extrabold text-gray-800 mb-2 tracking-tight">
        🐄 Monitor de Comportamiento (Parto)
      </h2>

      <p className="text-sm text-gray-500 mb-6">
        {loadingData && !hasData && 'Cargando datos...'}
        {!loadingData && hasData && (
          <>Último dato: <span className="font-semibold text-gray-700">{formattedLastUpdate}</span></>
        )}
      </p>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* --- TARJETA DE ESTADO (CÓDIGO INSERTADO) --- */}
          <div className="p-6 rounded-3xl text-center shadow-xl border-4 transition-all duration-500 bg-white border-gray-200">
            <h3 className="text-gray-500 font-bold uppercase text-sm tracking-widest">ESTADO DE ACTIVIDAD</h3>
            <div
              className={`text-5xl font-black my-4 transition-colors duration-500 ${getCardStyle()}`}
            >
              {loading ? 'Cargando...' : estadoCola || 'SIN DATOS'}
            </div>
            <p className="text-base font-medium mt-2 text-gray-600">
              {loading ? 'Cargando estado de la cola...' : getMessage()}
            </p>
          </div>
          {/* ------------------------------------------- */}

          {/* DATOS GIROSCOPIO */}
          <div className="bg-white p-6 rounded-3xl shadow-xl">
            <h4 className="font-extrabold text-lg text-gray-700 mb-4 border-b pb-2">Rotación (°/s)</h4>
            <div className="grid grid-cols-3 text-center gap-3">
              <div className={`p-3 rounded-xl border-2 ${Math.abs(gyro.x) > 250 ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
                <div className="text-xs text-gray-500 font-medium">Eje X</div>
                <div className="font-mono text-xl font-bold text-gray-800">{hasData ? gyro.x.toFixed(0) : '--'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border-2 border-gray-200">
                <div className="text-xs text-gray-500 font-medium">Eje Y</div>
                <div className="font-mono text-xl font-bold text-gray-800">{hasData ? gyro.y.toFixed(0) : '--'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border-2 border-gray-200">
                <div className="text-xs text-gray-500 font-medium">Eje Z</div>
                <div className="font-mono text-xl font-bold text-gray-800">{hasData ? gyro.z.toFixed(0) : '--'}</div>
              </div>
            </div>
          </div>

          {/* DATOS ACELERÓMETRO */}
          <div className="bg-white p-6 rounded-3xl shadow-xl">
            <h4 className="font-extrabold text-lg text-gray-700 mb-4 border-b pb-2">Aceleración (G)</h4>
            <div className="grid grid-cols-3 text-center gap-3">
              <div className="bg-gray-50 p-3 rounded-xl border-2 border-gray-200">
                <div className="text-xs text-gray-500 font-medium">Eje X</div>
                <div className="font-mono text-xl font-bold text-gray-800">{hasData ? accel.x.toFixed(2) : '--'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border-2 border-gray-200">
                <div className="text-xs text-gray-500 font-medium">Eje Y</div>
                <div className="font-mono text-xl font-bold text-gray-800">{hasData ? accel.y.toFixed(2) : '--'}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border-2 border-gray-200">
                <div className="text-xs text-gray-500 font-medium">Eje Z</div>
                <div className="font-mono text-xl font-bold text-gray-800">{hasData ? accel.z.toFixed(2) : '--'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (GRÁFICA) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-xl h-[600px] flex flex-col">
          <h4 className="font-extrabold text-lg text-gray-700 mb-2">Historial de Movimiento 3D</h4>
          <div className="flex-grow">
            <Plot
              data={[
                {
                  type: 'scatter3d',
                  mode: 'lines',
                  x: historyX, y: historyY, z: historyZ,
                  name: 'Historial',
                  line: { width: 4, color: '#4CAF50', opacity: 0.6 },
                },
                {
                  type: 'scatter3d',
                  mode: 'markers',
                  x: [gyro.x], y: [gyro.y], z: [gyro.z],
                  name: 'Actual',
                  marker: { size: 8, color: alertImmediate ? '#E53E3E' : '#FFD700' },
                },
              ]}
              layout={{
                autosize: true,
                scene: {
                  xaxis: { title: 'X', backgroundcolor: '#f7f7f7' },
                  yaxis: { title: 'Y', backgroundcolor: '#f7f7f7' },
                  zaxis: { title: 'Z', backgroundcolor: '#f7f7f7' },
                  aspectmode: 'cube',
                },
                margin: { l: 0, r: 0, b: 0, t: 0 },
                showlegend: true,
                legend: { orientation: 'h', y: 1.05 },
              }}
              useResizeHandler={true}
              style={{ width: '100%', height: '100%' }}
              config={{ displayModeBar: false }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}