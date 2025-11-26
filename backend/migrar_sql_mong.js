const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// --- CONFIGURACIÓN ---
// Si usas MongoDB Atlas, pon tu URI aquí. Si es local: 'mongodb://localhost:27017'
const MONGO_URI = 'mongodb+srv://admin:12345@cluster0.zeax1ea.mongodb.net/?appName=Cluster0'; 
const DB_NAME = 'smigo';

// Archivo SQL a leer
const SQL_FILE = path.join(__dirname, 'proyecto3.sql');

async function main() {
    const client = new MongoClient(MONGO_URI);

    try {
        // 1. Conectar a MongoDB
        await client.connect();
        console.log("✅ Conectado a MongoDB");
        const db = client.db(DB_NAME);

        // 2. Leer el archivo SQL
        console.log("📖 Leyendo archivo SQL...");
        const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');

        // --- MIGRAR USUARIOS ---
        console.log("🔄 Migrando Usuarios...");
        const usuarios = parseInsertValues(sqlContent, 'usuarios');
        if (usuarios.length > 0) {
            const colUsuarios = db.collection('usuarios');
            
            // Mapear datos de SQL a formato JSON de Mongo
            const docsUsuarios = usuarios.map(row => ({
                mysql_id: parseInt(row[0]), // Guardamos el ID original por si acaso
                email: cleanString(row[1]),
                password: cleanString(row[2]),
                nombre: cleanString(row[3])
            }));

            // Insertar (usamos insertMany para rapidez)
            await colUsuarios.deleteMany({}); // Opcional: Limpiar colección antes
            const result = await colUsuarios.insertMany(docsUsuarios);
            console.log(`   ✨ Insertados ${result.insertedCount} documentos en 'usuario'`);
        } else {
            console.log("   ⚠️ No se encontraron datos para 'usuarios'");
        }

        // --- MIGRAR DATOS VACA ---
        console.log("🔄 Migrando Datos Vaca...");
        const datosVaca = parseInsertValues(sqlContent, 'datos_vaca');
        if (datosVaca.length > 0) {
            const colDatosVaca = db.collection('datos_vaca');
            
            const docsVaca = datosVaca.map(row => ({
                mysql_id: parseInt(row[0]),
                giro_x: parseInt(row[1]),
                giro_y: parseInt(row[2]),
                giro_z: parseInt(row[3]),
                aceleracion_x: parseInt(row[4]),
                aceleracion_y: parseInt(row[5]),
                aceleracion_z: parseInt(row[6]),
                temperatura: parseFloat(row[7]),
                humedad: parseFloat(row[8]),
                // Convertir fecha SQL 'YYYY-MM-DD HH:MM:SS' a Objeto Date de Mongo
                fecha_registro: new Date(cleanString(row[9]))
            }));

            // Insertar en lotes grandes para no saturar memoria si son muchos
            await colDatosVaca.deleteMany({}); // Opcional: Limpiar colección antes
            const resultVaca = await colDatosVaca.insertMany(docsVaca);
            console.log(`   ✨ Insertados ${resultVaca.insertedCount} documentos en 'datos_vaca'`);
        } else {
            console.log("   ⚠️ No se encontraron datos para 'datos_vaca'");
        }

    } catch (err) {
        console.error("❌ Error en la migración:", err);
    } finally {
        await client.close();
        console.log("🔒 Conexión cerrada");
    }
}

// --- UTILIDADES PARA PARSEAR SQL ---

// Función simple para extraer valores de INSERT INTO `tabla` VALUES (...), (...);
function parseInsertValues(sql, tableName) {
    // Busca la línea que empieza con INSERT INTO `tableName`
    const regex = new RegExp(`INSERT INTO \`${tableName}\` .*? VALUES\\s*([\\s\\S]*?);`, 'gmi');
    const match = regex.exec(sql);
    
    if (!match) return [];

    let valuesString = match[1];
    
    // Truco sucio pero efectivo para dumps simples:
    // 1. Reemplazar "),(" por un separador único
    // 2. Quitar paréntesis inicial y final
    // 3. Dividir
    
    // Limpiamos saltos de línea dentro de la sentencia
    valuesString = valuesString.replace(/\r\n|\n|\r/gm, "");
    
    // Separamos los grupos de valores: ),( -> )|<|( 
    // (Esto asume que no hay texto con ),( dentro de los campos, lo cual es seguro para tus datos numéricos)
    const rows = valuesString.split(/\)\s*,\s*\(/);

    return rows.map(row => {
        // Limpiar paréntesis residuales al inicio del primero y fin del último
        let cleanRow = row.replace(/^\(/, '').replace(/\)$/, '');
        
        // Dividir por comas, respetando comillas simples si es posible
        // Para este caso simple, split por coma funciona bien
        return cleanRow.split(',').map(val => val.trim());
    });
}

function cleanString(str) {
    if (!str) return null;
    // Quitar comillas simples al principio y final ('texto' -> texto)
    return str.replace(/^'|'$/g, '');
}

main();