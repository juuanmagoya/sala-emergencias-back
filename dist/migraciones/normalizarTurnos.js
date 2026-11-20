"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const Turno_1 = __importDefault(require("../modules/turnos/models/Turno"));
// ============================================================
// DIAGNÓSTICO DE TURNOS LEGACY
//
// No borra documentos ni asigna médicos de forma arbitraria.
//
// - Informa turnos sin médico, sin estado y sin fecha de fin.
// - Opcionalmente normaliza `estado: 'pendiente'` en los documentos
//   que no lo tienen. Esto permite que el índice único parcial cubra
//   también los turnos históricos activos.
//
// Por defecto se ejecuta en modo DRY-RUN. Para aplicar únicamente la
// normalización de `estado`:
//   MIGRAR_APLICAR=true npx tsx src/migraciones/normalizarTurnos.ts
// ============================================================
const APLICAR_CAMBIOS = process.env.MIGRAR_APLICAR === 'true';
const SIN_MEDICO = {
    $or: [
        { medico: { $exists: false } },
        { medico: null },
    ],
};
const SIN_ESTADO = {
    $or: [
        { estado: { $exists: false } },
        { estado: null },
    ],
};
const SIN_FECHA_FIN = {
    $or: [
        { fechaFin: { $exists: false } },
        { fechaFin: null },
    ],
};
const diagnosticar = async () => {
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
    console.log(`🔄 Modo: ${APLICAR_CAMBIOS ? 'APLICAR NORMALIZACIÓN DE ESTADO' : 'DRY-RUN (sin escribir)'}`);
    const coleccion = Turno_1.default.collection;
    const [total, sinMedico, sinEstado, sinFechaFin, futurosSinMedico, cancelados,] = await Promise.all([
        coleccion.countDocuments({}),
        coleccion.countDocuments(SIN_MEDICO),
        coleccion.countDocuments(SIN_ESTADO),
        coleccion.countDocuments(SIN_FECHA_FIN),
        coleccion.countDocuments({
            fechaTurno: { $gte: new Date() },
            ...SIN_MEDICO,
        }),
        coleccion.countDocuments({ estado: 'cancelado' }),
    ]);
    console.log(`📄 Turnos totales: ${total}`);
    console.log(`🩺 Turnos sin médico: ${sinMedico}`);
    console.log(`📌 Turnos sin estado: ${sinEstado}`);
    console.log(`⏱️ Turnos sin fecha de fin: ${sinFechaFin}`);
    console.log(`📅 Turnos futuros sin médico: ${futurosSinMedico}`);
    console.log(`🚫 Turnos cancelados: ${cancelados}`);
    if (sinMedico > 0) {
        console.warn('⚠️ Los turnos sin médico se conservan sin reasignación automática. ' +
            'Los nuevos turnos exigen médico; revisá los históricos manualmente si corresponde.');
    }
    if (futurosSinMedico > 0) {
        console.warn('⚠️ Hay turnos futuros sin médico: la agenda nueva no los bloqueará para ningún profesional. ' +
            'Definí manualmente su tratamiento antes de operar la agenda.');
    }
    if (sinFechaFin > 0) {
        console.warn('⚠️ Los turnos sin fecha de fin se consideran ocupados usando la duración actual del médico. ' +
            'Si la duración cambió, revisá esos registros.');
    }
    if (sinEstado > 0) {
        if (APLICAR_CAMBIOS) {
            const resultado = await coleccion.updateMany(SIN_ESTADO, { $set: { estado: 'pendiente' } });
            console.log(`✅ Turnos normalizados a estado pendiente: ${resultado.modifiedCount}`);
        }
        else {
            console.log(`ℹ️ Se normalizarían a estado pendiente: ${sinEstado}`);
        }
    }
    await mongoose_1.default.disconnect();
    console.log('🔌 Conexión cerrada');
};
diagnosticar().catch(async (error) => {
    console.error('❌ Error durante el diagnóstico de turnos:', error.message);
    await mongoose_1.default.disconnect().catch(() => undefined);
    process.exitCode = 1;
});
