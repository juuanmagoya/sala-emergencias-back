"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const consultorioSchema = new mongoose_1.Schema({
    nombre: {
        type: String,
        required: [
            true,
            'El nombre del consultorio es obligatorio',
        ],
        unique: [
            true,
            'El nombre del consultorio debe ser único',
        ],
        trim: true,
        uppercase: true,
    },
    numero: {
        type: String,
        required: [
            true,
            'El número de consultorio es obligatorio',
        ],
        unique: [
            true,
            'El número de consultorio debe ser único',
        ],
        trim: true,
    },
    piso: {
        type: String,
        required: [
            true,
            'El piso es obligatorio',
        ],
        trim: true,
    },
    ala: {
        type: String,
        enum: [
            'NORTE',
            'SUR',
            'ESTE',
            'OESTE',
            'CENTRAL',
        ],
        default: 'CENTRAL',
    },
    especialidades: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Especialidad',
        },
    ],
    equipamiento: [
        {
            type: String,
            enum: [
                'CAMILLA',
                'ELECTROCARDIOGRAFO',
                'NEBULIZADOR',
                'ECOGRAFO',
                'OTOSCOPIO',
                'OPHTALMOSCOPIO',
                'TENSIOMETRO',
                'BALANZA',
                'ESTETOSCOPIO',
            ],
        },
    ],
    capacidad: {
        type: Number,
        default: 1,
        min: [
            1,
            'La capacidad mínima es 1',
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
// Índices
consultorioSchema.index({ piso: 1 });
consultorioSchema.index({ especialidades: 1 });
// Transformación JSON
consultorioSchema.set('toJSON', {
    transform: (_documento, consultorioRetorno) => {
        consultorioRetorno.id = consultorioRetorno._id;
        delete consultorioRetorno._id;
        delete consultorioRetorno.__v;
        delete consultorioRetorno.activo;
    },
});
exports.default = (0, mongoose_1.model)('Consultorio', consultorioSchema);
