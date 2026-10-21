import { Schema, model } from 'mongoose';

import type {
    IConsultorio,
    AlaConsultorio,
    EquipamientoConsultorio,
} from '../interfaces/Consultorio.interface.js';

const consultorioSchema = new Schema<IConsultorio>(
    {
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
            ] satisfies AlaConsultorio[],
            default: 'CENTRAL',
        },

        especialidades: [
            {
                type: Schema.Types.ObjectId,
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
                ] satisfies EquipamientoConsultorio[],
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
    },
    {
        timestamps: true,
    }
);

// Índices
consultorioSchema.index({ piso: 1 });
consultorioSchema.index({ especialidades: 1 });

// Transformación JSON
consultorioSchema.set('toJSON', {
    transform: (
        _documento,
        consultorioRetorno: Record<string, any>
    ) => {
        consultorioRetorno.id = consultorioRetorno._id;

        delete consultorioRetorno._id;
        delete consultorioRetorno.__v;
        delete consultorioRetorno.activo;
    },
});

export default model<IConsultorio>(
    'Consultorio',
    consultorioSchema
);