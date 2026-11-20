"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// ============================================
// SUBESQUEMAS
// ============================================
const medicamentoRecetadoSchema = new mongoose_1.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del medicamento es obligatorio'],
        trim: true,
    },
    dosis: {
        type: String,
        required: [true, 'La dosis del medicamento es obligatoria'],
        trim: true,
    },
    frecuencia: {
        type: String,
        required: [true, 'La frecuencia del medicamento es obligatoria'],
        trim: true,
    },
    duracion: {
        type: String,
        trim: true,
    },
    indicaciones: {
        type: String,
        trim: true,
    },
}, { _id: false });
// ============================================
// ESQUEMA PRINCIPAL
// ============================================
const historiaClinicaSchema = new mongoose_1.Schema({
    paciente: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Paciente',
        required: [true, 'El paciente es obligatorio'],
    },
    medico: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Medico',
        required: [true, 'El médico es obligatorio'],
    },
    fechaAtencion: {
        type: Date,
        required: [true, 'La fecha de atención es obligatoria'],
        default: Date.now,
    },
    observaciones: {
        type: String,
        required: [true, 'Las observaciones son obligatorias'],
        trim: true,
        maxlength: [
            2000,
            'Las observaciones no pueden superar los 2000 caracteres',
        ],
    },
    recetario: {
        type: [medicamentoRecetadoSchema],
        default: [],
    },
}, {
    timestamps: true,
});
// Índices: historial de un paciente ordenado por fecha y listado general.
historiaClinicaSchema.index({ paciente: 1, fechaAtencion: -1 });
historiaClinicaSchema.index({ fechaAtencion: -1 });
// ============================================
// TRANSFORMACIÓN toJSON
// ============================================
historiaClinicaSchema.set('toJSON', {
    transform: (_documento, historiaRetorno) => {
        historiaRetorno.id = historiaRetorno._id;
        delete historiaRetorno._id;
        delete historiaRetorno.__v;
    },
});
// ============================================
// MODELO
// ============================================
const HistoriaClinica = (0, mongoose_1.model)('HistoriaClinica', historiaClinicaSchema);
exports.default = HistoriaClinica;
