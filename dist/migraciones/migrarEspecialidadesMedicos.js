"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const Medico_1 = __importDefault(require("../modules/medico/models/Medico"));
const Especialidad_1 = __importDefault(require("../modules/especialidad/models/Especialidad"));
// ============================================================
// MIGRACIÓN: ESPECIALIDAD ÚNICA → ESPECIALIDADES MÚLTIPLES
//
// Convierte el campo heredado `especialidad` (relación 1:1) en
// `especialidades: [especialidad]`, que pasa a ser la única fuente
// de verdad.
//
// Reglas:
// - No elimina el campo heredado `especialidad`.
// - No sobrescribe arrays existentes (ni siquiera vacíos).
// - Es idempotente: una segunda ejecución no modifica documentos.
// - Reporta referencias nulas, inválidas, huérfanas, inconsistentes y
//   duplicadas para revisión manual; no inventa datos.
//
// Por defecto se ejecuta en modo DRY-RUN. Para aplicar los cambios:
//   MIGRAR_APLICAR=true npx tsx src/migraciones/migrarEspecialidadesMedicos.ts
// ============================================================
const APLICAR_CAMBIOS = process.env.MIGRAR_APLICAR === 'true';
const esObjectId = (valor) => valor instanceof mongoose_1.default.Types.ObjectId;
const describirMedico = (documento) => `${String(documento._id)} (${documento.apellido ?? 'sin apellido'}, ${documento.nombre ?? 'sin nombre'} - matrícula ${documento.matricula ?? 'sin matrícula'})`;
const migrar = async () => {
    const url = process.env.DATABASE_URL_ATLAS;
    if (!url) {
        console.error('❌ Falta la variable DATABASE_URL_ATLAS');
        process.exitCode = 1;
        return;
    }
    await mongoose_1.default.connect(url, {
        autoIndex: false,
        serverSelectionTimeoutMS: 10000,
    });
    console.log(`🔄 Modo: ${APLICAR_CAMBIOS ? 'APLICAR CAMBIOS' : 'DRY-RUN (sin escribir)'}`);
    const coleccion = Medico_1.default.collection;
    // Referencias vigentes del catálogo, para detectar huérfanas e
    // inactivas sin una consulta por documento.
    const especialidadesCatalogo = await Especialidad_1.default.collection
        .find({}, { projection: { _id: 1, activo: 1 } })
        .toArray();
    const existentes = new Set(especialidadesCatalogo.map((especialidad) => String(especialidad._id)));
    const inactivas = new Set(especialidadesCatalogo
        .filter((especialidad) => especialidad.activo === false)
        .map((especialidad) => String(especialidad._id)));
    const cursor = coleccion.find({}, {
        projection: {
            nombre: 1,
            apellido: 1,
            matricula: 1,
            especialidad: 1,
            especialidades: 1,
        },
    });
    let total = 0;
    let yaMigrados = 0;
    let convertidos = 0;
    let convertirian = 0;
    let sinEspecialidad = 0;
    let escalaresInvalidos = 0;
    let arraysVacios = 0;
    let arraysConValoresInvalidos = 0;
    let inconsistentes = 0;
    let conDuplicados = 0;
    let referenciasHuerfanas = 0;
    let referenciasInactivas = 0;
    const reportar = (mensaje) => console.warn(mensaje);
    for await (const documentoCrudo of cursor) {
        const documento = documentoCrudo;
        total++;
        const array = documento.especialidades;
        const tieneArray = Array.isArray(array) && array.length > 0;
        const arrayVacio = Array.isArray(array) && array.length === 0;
        const escalarPresente = documento.especialidad !== undefined &&
            documento.especialidad !== null;
        const escalarValido = esObjectId(documento.especialidad);
        if (escalarPresente && !escalarValido) {
            escalaresInvalidos++;
            reportar(`⚠️ Médico ${describirMedico(documento)}: \`especialidad\` no es un ObjectId. Requiere revisión manual.`);
        }
        if (!escalarPresente && !Array.isArray(array)) {
            sinEspecialidad++;
            reportar(`⚠️ Médico ${describirMedico(documento)}: no tiene especialidad ni especialidades. Requiere asignación manual.`);
        }
        if (Array.isArray(array) && array.length > 0) {
            yaMigrados++;
            const idsDelArray = [];
            for (const valor of array) {
                if (!esObjectId(valor)) {
                    arraysConValoresInvalidos++;
                    reportar(`⚠️ Médico ${describirMedico(documento)}: \`especialidades\` contiene un valor que no es un ObjectId. Requiere revisión manual.`);
                    continue;
                }
                idsDelArray.push(String(valor));
            }
            if (new Set(idsDelArray).size !== idsDelArray.length) {
                conDuplicados++;
                reportar(`⚠️ Médico ${describirMedico(documento)}: \`especialidades\` contiene referencias repetidas. Requiere revisión manual.`);
            }
            for (const id of idsDelArray) {
                if (!existentes.has(id)) {
                    referenciasHuerfanas++;
                    reportar(`⚠️ Médico ${describirMedico(documento)}: la especialidad ${id} no existe en el catálogo.`);
                }
                else if (inactivas.has(id)) {
                    referenciasInactivas++;
                    reportar(`⚠️ Médico ${describirMedico(documento)}: la especialidad ${id} está inactiva.`);
                }
            }
            if (escalarValido) {
                const escalar = String(documento.especialidad);
                if (escalar !== String(array[0])) {
                    inconsistentes++;
                    reportar(`⚠️ Médico ${describirMedico(documento)}: \`especialidad\` (${escalar}) no coincide con \`especialidades[0]\` (${String(array[0])}). No se modifica; requiere revisión manual.`);
                }
            }
            // Nunca se sobrescribe un array existente.
            continue;
        }
        if (arrayVacio) {
            arraysVacios++;
            reportar(`⚠️ Médico ${describirMedico(documento)}: \`especialidades\` existe pero está vacío. No se sobrescribe; requiere revisión manual.`);
            continue;
        }
        if (!escalarValido) {
            // Ya reportado arriba (nulo, ausente o tipo inválido).
            continue;
        }
        const heredada = String(documento.especialidad);
        if (!existentes.has(heredada)) {
            referenciasHuerfanas++;
            reportar(`⚠️ Médico ${describirMedico(documento)}: la especialidad heredada ${heredada} no existe en el catálogo. Se copia igual para no perder el dato.`);
        }
        else if (inactivas.has(heredada)) {
            referenciasInactivas++;
            reportar(`⚠️ Médico ${describirMedico(documento)}: la especialidad heredada ${heredada} está inactiva. Se copia igual para no perder el dato.`);
        }
        convertirian++;
        if (APLICAR_CAMBIOS) {
            const resultado = await coleccion.updateOne({
                _id: documento._id,
                // Guarda de idempotencia/concurrencia: solo se
                // escribe si nadie creó el array mientras tanto.
                especialidades: { $exists: false },
            }, {
                $set: {
                    especialidades: [documento.especialidad],
                },
            });
            if (resultado.modifiedCount > 0) {
                convertidos++;
            }
        }
    }
    console.log('');
    console.log('📊 RESUMEN');
    console.log(`   Documentos de médicos revisados: ${total}`);
    console.log(`   Ya migrados (array con datos): ${yaMigrados}`);
    console.log(`   ${APLICAR_CAMBIOS ? 'Convertidos' : 'Se convertirían'}: ${APLICAR_CAMBIOS ? convertidos : convertirian}`);
    console.log(`   Sin especialidad asignada: ${sinEspecialidad}`);
    console.log(`   Escalares inválidos: ${escalaresInvalidos}`);
    console.log(`   Arrays vacíos (no se sobrescriben): ${arraysVacios}`);
    console.log(`   Arrays con valores que no son ObjectId: ${arraysConValoresInvalidos}`);
    console.log(`   Escalar inconsistente con el array: ${inconsistentes}`);
    console.log(`   Arrays con duplicados: ${conDuplicados}`);
    console.log(`   Referencias huérfanas: ${referenciasHuerfanas}`);
    console.log(`   Referencias a especialidades inactivas: ${referenciasInactivas}`);
    const pendientesDeRevision = sinEspecialidad +
        escalaresInvalidos +
        arraysVacios +
        arraysConValoresInvalidos +
        inconsistentes +
        conDuplicados;
    if (pendientesDeRevision > 0) {
        console.warn(`\n⚠️ Documentos que requieren revisión manual antes de eliminar el campo heredado: ${pendientesDeRevision}`);
    }
    console.log('\nℹ️ El campo heredado `especialidad` no se elimina en esta etapa.');
    await mongoose_1.default.disconnect();
    console.log('🔌 Conexión cerrada');
};
migrar().catch(async (error) => {
    console.error('❌ Error durante la migración:', error.message);
    await mongoose_1.default.disconnect().catch(() => undefined);
    process.exitCode = 1;
});
