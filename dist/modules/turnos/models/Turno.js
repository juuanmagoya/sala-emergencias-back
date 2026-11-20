"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// ============================================================
// SCHEMA
// ============================================================
const turnoSchema = new mongoose_1.Schema({
    paciente: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Paciente',
        required: [true, 'El ID del paciente es obligatorio'],
    },
    especialidad: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Especialidad',
        required: [true, 'La especialidad es obligatoria'],
    },
    // Obligatorio para turnos nuevos. Los turnos históricos sin médico
    // se conservan y se muestran con `medico: null`; no se reasignan.
    medico: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Medico',
        required: [true, 'El médico es obligatorio'],
    },
    fechaTurno: {
        type: Date,
        required: [
            true,
            'La fecha del turno es obligatoria',
        ],
        validate: {
            validator: function (value) {
                return value >= new Date();
            },
            message: 'La fecha del turno debe ser una fecha futura',
        },
    },
    // Se calcula en el servidor al reservar, con la duración del médico.
    // Guardarlo evita que la ocupación cambie si luego se modifica
    // `Medico.duracionTurno`.
    fechaFin: {
        type: Date,
        required: [
            true,
            'La fecha de fin del turno es obligatoria',
        ],
    },
    estado: {
        type: String,
        enum: {
            values: [
                'pendiente',
                'atendido',
                'cancelado',
            ],
            message: '{VALUE} no es un estado válido',
        },
        default: 'pendiente',
        required: true,
    },
    observaciones: {
        type: String,
        maxlength: [
            500,
            'Las observaciones no pueden superar los 500 caracteres',
        ],
    },
    activo: {
        type: Boolean,
        default: true,
        select: false,
    },
}, {
    timestamps: true,
});
// ============================================================
// ÍNDICES
//
// Los turnos nuevos se generan en una grilla alineada a la duración del
// médico. Bajo esa regla, dos turnos con la misma hora de inicio son
// incompatibles y el índice único impide que dos solicitudes simultáneas
// confirmen el mismo horario.
//
// El filtro parcial deja afuera los turnos cancelados para permitir
// volver a reservar ese horario. Los documentos históricos sin `estado`
// no participan del índice; el servicio igual los considera ocupados.
// ============================================================
turnoSchema.index({ medico: 1, fechaTurno: 1 }, { name: 'turnos_por_medico_fecha' });
turnoSchema.index({ medico: 1, fechaTurno: 1 }, {
    name: 'turnos_activos_unicos_por_medico_fecha',
    unique: true,
    partialFilterExpression: {
        $or: [
            { estado: 'pendiente' },
            { estado: 'atendido' },
        ],
    },
});
// Historial del paciente autenticado: la consulta filtra por `paciente`
// y ordena por `fechaTurno` descendente. El índice cubre ambos criterios
// y evita un recorrido completo de la colección.
turnoSchema.index({ paciente: 1, fechaTurno: -1 }, { name: 'turnos_por_paciente_fecha' });
// ============================================================
// TO JSON
// ============================================================
turnoSchema.set('toJSON', {
    transform: (_documento, turnoRetorno) => {
        turnoRetorno.id = turnoRetorno._id;
        delete turnoRetorno._id;
        delete turnoRetorno.__v;
    },
});
// ============================================================
// MODEL
// ============================================================
const TurnoModel = (0, mongoose_1.model)('Turno', turnoSchema);
exports.default = TurnoModel;
