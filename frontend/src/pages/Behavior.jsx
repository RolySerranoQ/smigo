import { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';

const HISTORY_SIZE = 50;
const API_URL_ULTIMO = 'http://localhost:3000/datos_vaca/ultimo';
//const API_URL_ESTADO = 'http://localhost:3000/analisis_cola';  // Asegúrate de que este sea el endpoint correcto

export default function Behavior() {
  const [gyro, setGyro] = useState({ x: 0, y: 0, z: 0 });
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 });
  const [gyroHistory, setGyroHistory] = useState([]);
  const [alert, setAlert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasData, setHasData] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // ---- POLLING AL BACKEND CADA 10 SEGUNDOS ----
  useEffect(() => {
    const fetchUltimoDato = async () => {
      try {
        const resp = await axios.get(API_URL_ULTIMO);
        console.log('Datos recibidos:', resp.data); // Verifica la respuesta aquí

        // Aquí extraemos los valores del objeto JSON recibido
        const { giro_x, giro_y, giro_z, aceleracion_x, aceleracion_y, aceleracion_z, temperatura, humedad, fecha_registro } = resp.data;

        setGyro({ x: giro_x, y: giro_y, z: giro_z });
        setAccel({ x: aceleracion_x, y: aceleracion_y, z: aceleracion_z });

        setGyroHistory((prev) => {
          const newPoint = {
            x: giro_x,
            y: giro_y,
            z: giro_z,
            timestamp: fecha_registro || Date.now(),
          };
          const updated = [...prev, newPoint];
          if (updated.length > HISTORY_SIZE) updated.shift();
          return updated;
        });

        // Lógica de alerta
        if (Math.abs(giro_x) > 250) setAlert(true);
        else setAlert(false);

        setHasData(true);
        setError(null);
        setLoading(false);
        setLastUpdate(fecha_registro || new Date().toISOString());
      } catch (err) {
        console.error('Error obteniendo datos:', err);
        setError('No se pudo obtener datos del servidor');
        setLoading(false);
      }
    };

    fetchUltimoDato();
    const intervalId = setInterval(fetchUltimoDato, 10000);

    return () => clearInterval(intervalId);
  }, []);


  // ---- POLLING AL ESTADO DE LA COLA CADA 3 MINUTOS ----
  useEffect(() => {
    const fetchEstadoCola = async () => {
      try {
        const resp = await axios.get(API_URL_ESTADO);
        console.log('Estado de la cola:', resp.data);

        // Aquí tomamos el estado desde la respuesta del backend
        const estado = resp.data.estado; // Asumimos que el backend devuelve un objeto con 'estado'
        setEstadoCola(estado);  // Actualizamos el estado de la cola

      } catch (err) {
        console.error('Error obteniendo el estado de la cola:', err);
        setError('No se pudo obtener el estado de la cola');
      }
    };

    fetchEstadoCola();  // Llamamos inmediatamente
    const intervalId = setInterval(fetchEstadoCola, 3 * 60000);  // 3 minutos

    return () => clearInterval(intervalId);
  }, []);

  // Preparar datos para el gráfico 3D
  const historyX = gyroHistory.map((d) => d.x);
  const historyY = gyroHistory.map((d) => d.y);
  const historyZ = gyroHistory.map((d) => d.z);
  const axisRange = 700;

  const formattedLastUpdate = lastUpdate ? new Date(lastUpdate).toLocaleString() : '—';

  return (
    <div className="container mx-auto p-4 pb-20 bg-gray-50 min-h-screen font-sans">
      <h2 className="text-4xl font-extrabold text-gray-800 mb-2 tracking-tight">
        🐄 Monitor de Comportamiento (Parto)
      </h2>

      <p className="text-sm text-gray-500 mb-6">
        {loading && !hasData && 'Cargando último dato desde el servidor...'}
        {!loading && hasData && (
          <>
            Último dato recibido:{' '}
            <span className="font-semibold text-gray-700">{formattedLastUpdate}</span>
          </>
        )}
        {error && <span className="text-red-600 font-medium"> · {error}</span>}
      </p>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Panel Izquierdo: Estado y Datos */}
        <div className="lg:col-span-1 space-y-8">
           {/* Tarjeta Estado */}
             {/* Tarjeta Estado */}
            <div
              className={`p-6 rounded-3xl text-center shadow-xl border-4 transition-all duration-500 ${
                alert ? 'bg-red-100 border-red-600' : 'bg-white border-[#4CAF50]'
              }`}
            >
              <h3 className="text-gray-500 font-bold uppercase text-sm tracking-widest">ESTADO DE ACTIVIDAD</h3>
              <div
                className={`text-5xl font-black my-4 transition-colors duration-500 ${
                  alert ? 'text-red-700 animate-pulse' : 'text-[#2E7D32]'
                }`}
              >
                {!hasData ? 'SIN DATOS' : alert ? '¡ALERTA MÁXIMA!' : estadoCola === "Normal" ? 'REPOSO / PASEO' : '¡ALERTA!'}
              </div>
              <p className="text-base font-medium mt-2 text-gray-600">
                {!hasData
                  ? 'Esperando el primer dato desde el dispositivo...'
                  : alert
                  ? 'Detectado movimiento extremo (>250 deg/s). Posible indicio de inicio de parto. ¡Revisión urgente!'
                  : estadoCola === "Normal"
                  ? 'Nivel de actividad normal. Giroscopio estable.'
                  : 'Estado de la cola indica posible movimiento irregular.'}
              </p>
            </div>

          {/* Datos Crudos - Giroscopio */}
          <div className="bg-white p-6 rounded-3xl shadow-xl">
            <h4 className="font-extrabold text-lg text-gray-700 mb-4 border-b pb-2">
              Rotación (Giroscopio °/s)
            </h4>
            <div className="grid grid-cols-3 text-center gap-3">
              <div
                className={`p-3 rounded-xl border-2 ${
                  Math.abs(gyro.x) > 250 ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'
                }`}
              >
                <div className="text-xs text-gray-500 font-medium">Eje X</div>
                <div className="font-mono text-xl font-bold text-gray-800">
                  {hasData ? gyro.x.toFixed(0) : '--'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border-2 border-gray-200">
                <div className="text-xs text-gray-500 font-medium">Eje Y</div>
                <div className="font-mono text-xl font-bold text-gray-800">
                  {hasData ? gyro.y.toFixed(0) : '--'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border-2 border-gray-200">
                <div className="text-xs text-gray-500 font-medium">Eje Z</div>
                <div className="font-mono text-xl font-bold text-gray-800">
                  {hasData ? gyro.z.toFixed(0) : '--'}
                </div>
              </div>
            </div>
          </div>

          {/* Datos Crudos - Acelerómetro */}
          <div className="bg-white p-6 rounded-3xl shadow-xl">
            <h4 className="font-extrabold text-lg text-gray-700 mb-4 border-b pb-2">
              Movimiento (Acelerómetro G)
            </h4>
            <div className="grid grid-cols-3 text-center gap-3">
              <div className="bg-gray-50 p-3 rounded-xl border-2 border-gray-200">
                <div className="text-xs text-gray-500 font-medium">Eje X</div>
                <div className="font-mono text-xl font-bold text-gray-800">
                  {hasData ? accel.x.toFixed(2) : '--'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border-2 border-gray-200">
                <div className="text-xs text-gray-500 font-medium">Eje Y</div>
                <div className="font-mono text-xl font-bold text-gray-800">
                  {hasData ? accel.y.toFixed(2) : '--'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border-2 border-gray-200">
                <div className="text-xs text-gray-500 font-medium">Eje Z</div>
                <div className="font-mono text-xl font-bold text-gray-800">
                  {hasData ? accel.z.toFixed(2) : '--'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Gráfica 3D */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-xl h-[550px] flex flex-col">
          <h4 className="font-extrabold text-lg text-gray-700 mb-2">
            Visualización 3D de Rotación
          </h4>
          <p className="text-sm text-gray-500 mb-4">
            El rastro muestra los últimos {HISTORY_SIZE} puntos de movimiento (Giros X, Y, Z).
          </p>
          <div className="flex-grow">
            <Plot
              data={[
                {
                  type: 'scatter3d',
                  mode: 'lines',
                  x: historyX,
                  y: historyY,
                  z: historyZ,
                  name: 'Historial de Movimiento',
                  line: {
                    width: 4,
                    color: '#4CAF50',
                    opacity: 0.6,
                  },
                },
                {
                  type: 'scatter3d',
                  mode: 'markers',
                  x: [gyro.x],
                  y: [gyro.y],
                  z: [gyro.z],
                  name: 'Punto Actual',
                  marker: {
                    size: 8,
                    color: alert ? '#E53E3E' : '#FFD700',
                    symbol: 'circle',
                    line: { width: 2, color: '#000' },
                  },
                },
                {
                  type: 'scatter3d',
                  mode: 'lines',
                  x: [0, gyro.x],
                  y: [0, gyro.y],
                  z: [0, gyro.z],
                  name: 'Vector Actual',
                  line: {
                    width: 1,
                    color: '#2E7D32',
                    dash: 'dot',
                  },
                  showlegend: false,
                },
              ]}
              layout={{
                autosize: true,
                scene: {
                  xaxis: {
                    range: [-axisRange, axisRange],
                    title: 'Giro X (Parto)',
                    backgroundcolor: '#f7f7f7',
                  },
                  yaxis: {
                    range: [-axisRange, axisRange],
                    title: 'Giro Y',
                    backgroundcolor: '#f7f7f7',
                  },
                  zaxis: {
                    range: [-axisRange, axisRange],
                    title: 'Giro Z',
                    backgroundcolor: '#f7f7f7',
                  },
                  aspectmode: 'cube',
                  camera: {
                    up: { x: 0, y: 0, z: 1 },
                    center: { x: 0, y: 0, z: 0 },
                    eye: { x: 1.25, y: 1.25, z: 1.25 },
                  },
                },
                hovermode: 'closest',
                margin: { l: 0, r: 0, b: 0, t: 0 },
                legend: { orientation: 'h', y: 1.05 },
              }}
              config={{ displayModeBar: false }}
              useResizeHandler={true}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
