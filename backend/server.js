require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const mqtt = require('mqtt');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURACIÓN DE ENTORNOS ---
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'smigo';

if (!MONGO_URI) {
    console.error("❌ ERROR FATAL: MONGO_URI no está definida.");
    process.exit(1); 
}

// Configuración MQTT Web (Salida ÚNICA para el Front-end)
const MQTT_BROKER_WEB = process.env.MQTT_BROKER_WEB || 'mqtt://localhost:1883'; // O tu broker público

// Tópicos originales (se mantienen las definiciones, aunque solo se usará el DASHBOARD)
const MQTT_TOPIC_WEB_MPU = "PROY/MPU";
const MQTT_TOPIC_WEB_TEMP = "PROY/TEMP";
const MQTT_TOPIC_WEB_HUM = "PROY/HUM";
// NUEVO TÓPICO DEDICADO para el Dashboard de React (requiere todos los datos en un solo JSON)

// Configuración MQTT TTN (Entrada)
const TTN_BROKER = process.env.TTN_BROKER || "mqtts://au1.cloud.thethings.network";
const TTN_PORT = process.env.TTN_PORT || 8883;
const TTN_USER = process.env.TTN_USER || "vacatech@ttn";
// Se usa el TTN_PASS del usuario
const TTN_PASS = process.env.TTN_PASS || "NNSXS.RHLZFYF7EQYAKIOYIW7NAM3XQ4KRFXIECUFUKQQ.5GLTXSXIHUQWVNWBQJPKXM6RJR6KNE4KAMHAO2UFRYRJK2HHM7KQ";
const TTN_TOPIC = process.env.TTN_TOPIC || "v3/vacatech@ttn/devices/+/up";


// --- 1. CONEXIÓN A MONGODB ---
const client = new MongoClient(MONGO_URI);
let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db(DB_NAME);
        console.log("✅ Base de Datos: Conectada a MongoDB Atlas");
    } catch (error) {
        console.error("❌ Error fatal Mongo:", error);
    }
}
connectDB();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());


// ==========================================
// 2. PUENTE MQTT (TTN -> NODE -> WEB)
// ==========================================

// A) Cliente de SALIDA (Para la Web - Local o HiveMQ)
const clientWeb = mqtt.connect(MQTT_BROKER_WEB);

clientWeb.on('connect', () => {
    console.log(`✅ Puente Local iniciado en ${MQTT_BROKER_WEB}`);
});
clientWeb.on('error', (err) => {
    console.error(`❌ Error conectando al Broker WEB (${MQTT_BROKER_WEB}): ${err.message}`);
});

// B) Cliente de ENTRADA (TTN - The Things Network)
const clientTTN = mqtt.connect(TTN_BROKER, {
    port: TTN_PORT,
    username: TTN_USER,
    password: TTN_PASS,
    protocol: 'mqtts',
    rejectUnauthorized: false // A veces necesario para certificados
});

clientTTN.on('connect', () => {
    console.log("✅ Conectado a TTN (Nube)");
    clientTTN.subscribe(TTN_TOPIC, (err) => {
        if (err) console.error(`❌ Error conexión TTN: ${err.message}`);
    });
});

clientTTN.on('error', (err) => {
    console.error(`❌ Error cliente TTN: ${err.message}`);
});





// 1. Calcular ITH (Índice de Temperatura y Humedad) para Ganado
// Fórmula común: ITH = (1.8 * T + 32) - (0.55 - 0.0055 * HR) * (1.8 * T - 26)
function calcularITH(temp, hum) {
    return (1.8 * temp + 32) - (0.55 - 0.0055 * hum) * (1.8 * temp - 26);
}

// 2. Control de Spam (para no enviar 100 mensajes por minuto)
let ultimaAlertaEnviada = 0;
const INTERVALO_ALERTA = 15 * 60 * 1000; // 15 minutos entre alertas

// 3. Función de envío (Simulada para que no falle sin credenciales reales)
async function enviarAlertaWhatsApp(ith, estado) {
    const now = Date.now();
    if (now - ultimaAlertaEnviada < INTERVALO_ALERTA) return; // Evitar spam

    const mensaje = `🚨 *ALERTA VACATECH* 🚨\n\nEstado: ${estado}\nITH detectado: ${ith.toFixed(2)}\n\n⚠️ La vaca presenta estrés calórico y comportamiento de parto.`;
    
    console.log("\n📲 [WHATSAPP] Enviando mensaje...");
    console.log(mensaje);

    try {
        // --- CÓDIGO TWILIO (Descomentar cuando tengas credenciales) ---
        
        await clientTwilio.messages.create({
            body: mensaje,
            from: 'whatsapp:+5917133', // Número Sandbox de Twilio
            to: 'whatsapp:+59171338567'    // TU NÚMERO REAL
        });
        
        console.log("✅ Mensaje enviado exitosamente (Simulado)");
        ultimaAlertaEnviada = now;
    } catch (error) {
        console.error("❌ Error enviando WhatsApp:", error);
    }
}





// --- PROCESAMIENTO DE MENSAJES TTN ---
clientTTN.on('message', async (topic, message) => {
    try {
        const msgString = message.toString();
        const mensajeJson = JSON.parse(msgString);

        // Verificar estructura de TTN
        if (mensajeJson.uplink_message && mensajeJson.uplink_message.decoded_payload) {
            
            const datos = mensajeJson.uplink_message.decoded_payload;
            const devId = mensajeJson.end_device_ids.device_id;

            // 1. Extraer variables (CORRECCIÓN CRÍTICA: usando parseFloat para MPU y preservar decimales)
            const ax = parseFloat(datos.aceleracion_x || 0.0);
            const ay = parseFloat(datos.aceleracion_y || 0.0);
            const az = parseFloat(datos.aceleracion_z || 0.0);
            const gx = parseFloat(datos.giro_x || 0.0);
            const gy = parseFloat(datos.giro_y || 0.0);
            const gz = parseFloat(datos.giro_z || 0.0);
            
            // 'temperatura' o 'temp', dependiendo de lo que llegue
            const temp = parseFloat(datos.temperatura || datos.temp || 0.0);
            const hum = parseFloat(datos.humedad || 0.0);

            // Objeto de registro unificado para MongoDB y el Dashboard
            const registroData = {
                dispositivo: devId,
                giro_x: gx, giro_y: gy, giro_z: gz,
                aceleracion_x: ax, aceleracion_y: ay, aceleracion_z: az,
                temperatura: temp,
                humedad: hum,
                fecha_registro: new Date()
            };

            // --- IMPRIMIR DATOS EN CONSOLA ---
            console.log(`\n📦 Dato recibido de: ${devId}`);
            console.log(`   🌡️  Ambiente: Temp: ${temp}°C | Hum: ${hum}%`);
            console.log(`   🚀 Movimiento: Acel[${ax}, ${ay}, ${az}] | Giro[${gx}, ${gy}, ${gz}]`);
            // ----------------------------------------

            // 2. Guardar en Base de Datos (MongoDB Atlas)
            if (db) {
                await db.collection('datos_vaca').insertOne(registroData);
                console.log("   💾 Guardado en BD");
            } else {
                console.log("   ⚠️ ¡OJO! No se guardó en BD porque no hay conexión.");
            }  
        }

    } catch (e) {
        console.error(`⚠️ Error procesando mensaje: ${e.message}`);
    }
});


const XLSX = require('xlsx');
const path = require('path');


function cargarRangosExcel() {
    // Asegúrate de que el archivo se llame correctamente
    const archivo = XLSX.readFile(path.join(__dirname, 'tabla_cola.xlsx')); 
    const hoja = archivo.Sheets[archivo.SheetNames[0]]; // Usamos la primera hoja dinámicamente

    const rangos = XLSX.utils.sheet_to_json(hoja, { header: 1 });

    // Función auxiliar para parsear a número por si Excel lo lee como texto
    const p = (val) => parseFloat(val);

    const extraerRangos = (inicio) => {
        return {
            giro_x: { min: p(rangos[inicio + 1][1]), max: p(rangos[inicio + 2][1]) },
            giro_y: { min: p(rangos[inicio + 1][2]), max: p(rangos[inicio + 2][2]) },
            giro_z: { min: p(rangos[inicio + 1][3]), max: p(rangos[inicio + 2][3]) }
        };
    };

    // ÍNDICES CORREGIDOS según tu estructura de archivo:
    // 0: Header Normal -> Datos en 1 y 2
    // 3: Fila vacía
    // 4: Header Cola -> Datos en 5 y 6
    // 7: Fila vacía
    // 8: Header Vaca -> Datos en 9 y 10
    
    const datosNormal = extraerRangos(0);
    const datosColaLevantada = extraerRangos(4); // Cambiado de 3 a 4
    const datosVacaHechada = extraerRangos(8);   // Cambiado de 7 a 8

    return {
        datosNormal,
        datosColaLevantada,
        datosVacaHechada
    };
}


function evaluarEstadoCola(datos, rangos) {
    // Contadores para determinar la tendencia
    let conteo = {
        "Normal": 0,
        "Cola levantada": 0,
        "Vaca hechada": 0,
        "Desconocido": 0
    };

    const normal = rangos.datosNormal;
    const alerta = rangos.datosColaLevantada;
    const hechada = rangos.datosVacaHechada;

    const dentro = (r, d) => 
        d.giro_x >= r.giro_x.min && d.giro_x <= r.giro_x.max &&
        d.giro_y >= r.giro_y.min && d.giro_y <= r.giro_y.max &&
        d.giro_z >= r.giro_z.min && d.giro_z <= r.giro_z.max;

    datos.forEach((registro) => {
        if (dentro(hechada, registro)) {
            conteo["Vaca hechada"]++;
        } else if (dentro(alerta, registro)) {
            conteo["Cola levantada"]++;
        } else if (dentro(normal, registro)) {
            conteo["Normal"]++;
        } else {
            conteo["Desconocido"]++;
        }
    });

    console.log("📊 Análisis de los últimos 3 min:", conteo);

    // LÓGICA DE DECISIÓN:
    // Priorizamos alertas si aparecen en más del 20% de los registros, 
    // de lo contrario, gana la mayoría.
    
    const total = datos.length;
    const umbralAlerta = total * 0.2; // 20% de los datos

    if (conteo["Vaca hechada"] > umbralAlerta) return "Vaca hechada";
    if (conteo["Cola levantada"] > umbralAlerta) return "Cola levantada";
    if (conteo["Normal"] > 0) return "Normal";
    
    return "Desconocido";
}

app.get('/analisis_cola', async (req, res) => {
    try {
        const now = new Date();
        const threeMinutesAgo = new Date(now.getTime() - 3 * 60000);

        const datosRecientes = await db.collection('datos_vaca')
            .find({ fecha_registro: { $gte: threeMinutesAgo } })
            .project({ giro_x: 1, giro_y: 1, giro_z: 1, _id: 0 }) // Solo traemos lo necesario
            .toArray();

        // Si no hay datos, retornamos estado "Sin datos" (código 200 para que React no falle)
        if (datosRecientes.length === 0) {
            return res.json({ estado: "Sin datos", mensaje: "Esperando conexión del dispositivo..." });
        }

        const rangos = cargarRangosExcel();
        const estado = evaluarEstadoCola(datosRecientes, rangos);

        // Respuestas según el estado detectado
        let respuesta = { estado: "Desconocido", mensaje: "Analizando patrones de movimiento..." };

        if (estado === "Normal") {
            respuesta = { estado: "Normal", mensaje: "La cola está en posición normal." };
        } else if (estado === "Cola levantada") {
            respuesta = { estado: "Cola levantada", mensaje: "¡Alerta! La cola está levantada." };
        } else if (estado === "Vaca hechada") {
            respuesta = { estado: "Vaca hechada", mensaje: "¡Advertencia! La vaca está echada." };
        } else if (estado === "Desconocido") {
            // Manejamos el desconocido amigablemente
            respuesta = { 
                estado: "Normal", // Fallback a Normal visualmente
                mensaje: "Lecturas fuera de rango, asumiendo normalidad." 
            };
        }

        // Enviamos siempre un 200 OK con el JSON
        res.json(respuesta);

    } catch (error) {
        console.error("Error al procesar el análisis:", error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});


app.get('/ultimo_dato', async (req, res) => {
    if (!db) return res.status(500).json({ error: "Error de conexión con la base de datos" });

    try {
        const ultimoDato = await db.collection('datos_vaca')
            .find({})
            .sort({ fecha_registro: -1 })
            .limit(1)
            .toArray();

        if (ultimoDato.length > 0) {
            res.json(ultimoDato[0]);
        } else {
            res.status(404).json({ mensaje: "No hay datos registrados" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error al obtener los datos" });
    }
});



// ---- API REST: Obtener el último dato ----
app.get('/datos_vaca/ultimo', async (req, res) => {
    if (!db) return res.status(500).json({ error: "Error de conexión con la base de datos" });

    try {
        const ultimoDato = await db.collection('datos_vaca')
            .find({})
            .sort({ fecha_registro: -1 })
            .limit(1)
            .toArray();

        if (ultimoDato.length > 0) {
            res.json(ultimoDato[0]); // Retorna el último registro
        } else {
            res.status(404).json({ mensaje: "No hay datos registrados" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error al obtener los datos" });
    }
});



// ==========================================
// 3. API REST (LOGIN Y REGISTRO - Extra)
// ==========================================

app.post('/registro', async (req, res) => {
    const { email, password, nombre } = req.body;
    
    if (!db) return res.status(500).json({ status: 'error', mensaje: 'Error de conexión con Base de Datos' });
    if (!email || !password || !nombre) return res.status(400).json({ status: 'error', mensaje: 'Faltan datos' });

    try {
        const collection = db.collection('usuario'); 
        
        const existe = await collection.findOne({ email });
        if (existe) {
            return res.status(400).json({ status: 'error', mensaje: 'El correo ya está registrado' });
        }

        const nuevoUsuario = {
            nombre,
            email,
            password,
            fecha_creacion: new Date()
        };

        const result = await collection.insertOne(nuevoUsuario);
        res.json({ status: 'ok', mensaje: 'Usuario registrado con éxito', id: result.insertedId });
        
    } catch (e) {
        console.error(e);
        res.status(500).json({ status: 'error', mensaje: 'Error interno al registrar' });
    }
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!db) return res.status(500).json({ status: 'error', mensaje: 'Error de conexión con Base de Datos' });
    if (!email || !password) return res.status(400).json({ status: 'error', mensaje: 'Faltan credenciales' });

    try {
        const collection = db.collection('usuario');
        
        const user = await collection.findOne({ email, password });

        if (user) {
            console.log(`✅ Login exitoso: ${user.nombre}`);
            res.json({ 
                status: 'ok', 
                mensaje: 'Login exitoso', 
                nombre: user.nombre, 
                id: user._id 
            });
        } else {
            console.log(`❌ Fallo de login para: ${email}`);
            res.status(401).json({ status: 'error', mensaje: 'Correo o contraseña incorrectos' });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ status: 'error', mensaje: 'Error interno al iniciar sesión' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor Node.js corriendo en puerto ${PORT}`);
    console.log("   (Esperando datos de TTN...)");
});