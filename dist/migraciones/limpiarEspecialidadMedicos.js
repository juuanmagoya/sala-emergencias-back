"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const Medico_1 = __importDefault(require("../modules/medico/models/Medico"));
// ============================================================
// LIMPIEZA: CAMPO HEREDADO `especialidad`
//
// Elimina de los documentos de médicos el campo escalar
// `especialidad` (relación 1:1 anterior), una vez que
// `especialidades` es la única fuente de verdad en servicios,
// respuestas y frontend.
//
// Reglas:
// - Solo elimina el campo cuando `especialidades` es un array no
//   vacío de ObjectIds. Si un documento no cumple, aborta la
//   aplicación completa para revisión manual.
// - No modifica `especialidades` ni ningún otro campo.
// - Es idempotente: una segunda ejecución no encuentra nada que
//   eliminar.
// - Elimina el índice heredado `especialidad_1` si todavía existe.
//   Conserva `{ especialidades: 1 }`.
//
// Por defecto se ejecuta en modo DRY-RUN. Para aplicar los cambios:
//   MIGRAR_APLICAR=true npx tsx src/migraciones/limpiarEspecialidadMedicos.ts
// ============================================================
const APLICAR_CAMBIOS = process.env.MIGRAR_APLICAR === 'true';
const esObjectId = (valor) => valor instanceof mongoose_1.default.Types.ObjectId;
const describirMedico = (documento) => `${String(documento._id)} (${documento.apellido ?? 'sin apellido'}, ${documento.nombre ?? 'sin nombre'} - matrícula ${documento.matricula ?? 'sin matrícula'})`;
const limpiar = async () => {
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
    console.log(`🧹 Modo: ${APLICAR_CAMBIOS ? 'APLICAR CAMBIOS' : 'DRY-RUN (sin escribir)'}`);
    const coleccion = Medico_1.default.collection;
    const total = await coleccion.countDocuments({});
    const cursor = coleccion.find({ especialidad: { $exists: true } }, {
        projection: {
            nombre: 1,
            apellido: 1,
            matricula: 1,
            especialidad: 1,
            especialidades: 1,
        },
    });
    let revisados = 0;
    let eliminables = 0;
    let bloqueados = 0;
    let conDuplicados = 0;
    let arraysConValoresInvalidos = 0;
    const pendientes = [];
    for await (const documentoCrudo of cursor) {
        const documento = documentoCrudo;
        revisados++;
        const array = documento.especialidades;
        const arrayValido = Array.isArray(array) &&
            array.length > 0 &&
            array.every(esObjectId);
        if (!arrayValido) {
            bloqueados++;
            if (Array.isArray(array) &&
                array.some((valor) => !esObjectId(valor))) {
                arraysConValoresInvalidos++;
            }
            console.warn(`⛔ Médico ${describirMedico(documento)}: conserva \`especialidad\` pero no tiene un \`especialidades\` válido y no vacío. No se elimina nada.`);
            continue;
        }
        const ids = array.map(String);
        if (new Set(ids).size !== ids.length) {
            conDuplicados++;
            console.warn(`⚠️ Médico ${describirMedico(documento)}: \`especialidades\` contiene referencias repetidas. Requiere revisión manual (no bloquea la limpieza del campo heredado).`);
        }
        eliminables++;
        pendientes.push({
            _id: documento._id,
            descripcion: describirMedico(documento),
        });
    }
    // ========================================================
    // ÍNDICES
    // ========================================================
    const indices = await coleccion.indexes();
    const indicesHeredados = indices.filter((indice) => {
        const claves = Object.keys(indice.key);
        return (claves.length === 1 &&
            indice.key.especialidad === 1);
    });
    const indiceEspecialidades = indices.filter((indice) => {
        const claves = Object.keys(indice.key);
        return (claves.length === 1 &&
            indice.key.especialidades === 1);
    });
    console.log('');
    console.log('📊 RESUMEN');
    console.log(`   Documentos de médicos totales: ${total}`);
    console.log(`   Documentos con \`especialidad\` heredado: ${revisados}`);
    console.log(`   ${APLICAR_CAMBIOS ? 'Eliminables' : 'Se eliminarían'}: ${eliminables}`);
    console.log(`   Bloqueados (requieren revisión): ${bloqueados}`);
    console.log(`   Arrays con valores inválidos: ${arraysConValoresInvalidos}`);
    console.log(`   Arrays con duplicados: ${conDuplicados}`);
    console.log(`   Índices heredados detectados: ${indicesHeredados.length > 0
        ? indicesHeredados
            .map((indice) => indice.name ?? '(sin nombre)')
            .join(', ')
        : 'ninguno'}`);
    console.log(`   Índice { especialidades: 1 } presente: ${indiceEspecialidades.length > 0 ? 'sí' : 'no'}`);
    if (bloqueados > 0) {
        console.error(`\n❌ Hay ${bloqueados} documento(s) con \`especialidad\` heredado y sin \`especialidades\` válido. No se aplica ningún cambio. Corregilos manualmente y volvé a ejecutar.`);
        await mongoose_1.default.disconnect();
        console.log('🔌 Conexión cerrada');
        process.exitCode = 1;
        return;
    }
    // ========================================================
    // APLICACIÓN
    // ========================================================
    let eliminados = 0;
    let indicesEliminados = 0;
    if (APLICAR_CAMBIOS) {
        for (const pendiente of pendientes) {
            const resultado = await coleccion.updateOne({
                _id: pendiente._id,
                especialidad: { $exists: true },
                // Guarda de idempotencia/concurrencia: el array
                // debe seguir siendo válido.
                especialidades: {
                    $exists: true,
                    $ne: [],
                },
            }, {
                $unset: { especialidad: '' },
            });
            if (resultado.modifiedCount > 0) {
                eliminados++;
            }
        }
        for (const indice of indicesHeredados) {
            if (!indice.name) {
                continue;
            }
            await coleccion.dropIndex(indice.name);
            indicesEliminados++;
            console.log(`🗑️ Índice eliminado: ${indice.name}`);
        }
        const restantes = await coleccion.countDocuments({
            especialidad: { $exists: true },
        });
        console.log('');
        console.log(`   Campos heredados eliminados: ${eliminados}`);
        console.log(`   Índices heredados eliminados: ${indicesEliminados}`);
        console.log(`   Documentos que aún conservan \`especialidad\`: ${restantes}`);
        if (restantes > 0) {
            process.exitCode = 1;
        }
    }
    else {
        console.log('');
        console.log(`ℹ️ Simulación: se eliminaría \`especialidad\` de ${eliminables} documento(s) y se borrarían ${indicesHeredados.length} índice(s) heredado(s).`);
        console.log('ℹ️ Para aplicar: MIGRAR_APLICAR=true npx tsx src/migraciones/limpiarEspecialidadMedicos.ts');
    }
    await mongoose_1.default.disconnect();
    console.log('🔌 Conexión cerrada');
};
limpiar().catch(async (error) => {
    console.error('❌ Error durante la limpieza:', error.message);
    await mongoose_1.default.disconnect().catch(() => undefined);
    process.exitCode = 1;
});
