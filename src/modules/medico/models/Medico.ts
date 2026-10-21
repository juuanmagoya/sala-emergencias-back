import { Schema, model, Document } from 'mongoose';

import type { IMedico } from '../interfaces/Medico.interface';


// ============================================================
// SCHEMA
// ============================================================

const medicoSchema = new Schema<IMedico>(
    {
        nombre: {
            type: String,
            required: [true, 'El nombre del médico es obligatorio'],
            uppercase: true,
            trim: true,
        },

        apellido: {
            type: String,
            required: [true, 'El apellido del médico es obligatorio'],
            uppercase: true,
            trim: true,
        },

        matricula: {
            type: String,
            required: [true, 'La matrícula del médico es obligatoria'],
            unique: [true, 'La matrícula debe ser única'],
            match: [
                /^[0-9]{6,8}$/,
                'La matrícula debe tener entre 6 y 8 dígitos',
            ],
        },

        especialidad: {
            type: Schema.Types.ObjectId,
            ref: 'Especialidad',
            required: [true, 'La especialidad es obligatoria'],
        },

        email: {
            type: String,
            required: [true, 'El email es obligatorio'],
            unique: [true, 'El email debe ser único'],
            match: [
                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                'El email no es válido',
            ],
        },

        telefono: {
            tipo: {
                type: String,
                enum: ['CELULAR', 'FIJO', 'TRABAJO'],
                default: 'CELULAR',
            },

            codigoArea: {
                type: String,
                required: [
                    true,
                    'El código de área es obligatorio',
                ],
                match: [
                    /^[0-9]{2,5}$/,
                    'El código de área no es válido',
                ],
            },

            numero: {
                type: String,
                required: [
                    true,
                    'El número de teléfono es obligatorio',
                ],
                match: [
                    /^[0-9]{7,10}$/,
                    'El número de teléfono no es válido',
                ],
            },
        },

        consultorios: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Consultorio',
            },
        ],

        // ====================================================
        // HORARIOS DE ATENCIÓN
        // ====================================================

        horariosAtencion: [
            {
                dia: {
                    type: String,
                    required: [true, 'El día es obligatorio'],
                    enum: [
                        'LUNES',
                        'MARTES',
                        'MIERCOLES',
                        'JUEVES',
                        'VIERNES',
                        'SABADO',
                    ],
                },

                horaInicio: {
                    type: String,
                    required: [
                        true,
                        'La hora de inicio es obligatoria',
                    ],
                    match: [
                        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                        'Formato de hora inválido (HH:MM)',
                    ],
                },

                horaFin: {
                    type: String,
                    required: [
                        true,
                        'La hora de fin es obligatoria',
                    ],
                    match: [
                        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                        'Formato de hora inválido (HH:MM)',
                    ],
                },
            },
        ],

        // ====================================================
        // DURACIÓN DE LOS TURNOS
        // ====================================================

        duracionTurno: {
            type: Number,
            required: [
                true,
                'La duración del turno es obligatoria',
            ],
            min: [
                5,
                'La duración mínima del turno es de 5 minutos',
            ],
            max: [
                240,
                'La duración máxima del turno es de 240 minutos',
            ],
            validate: {
                validator: Number.isInteger,
                message:
                    'La duración del turno debe ser un número entero',
            },
        },

        activo: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);


// ============================================================
// ÍNDICES
// ============================================================

medicoSchema.index({ especialidad: 1 });

medicoSchema.index({
    apellido: 1,
    nombre: 1,
});


// ============================================================
// TO JSON
// ============================================================

medicoSchema.set('toJSON', {
    transform: (
        _documento: Document,
        medicoRetorno: Record<string, any>
    ) => {
        medicoRetorno.id = medicoRetorno._id;

        delete medicoRetorno._id;
        delete medicoRetorno.__v;
    },
});


// ============================================================
// MODEL
// ============================================================

const MedicoModel = model<IMedico>(
    'Medico',
    medicoSchema
);

export default MedicoModel;