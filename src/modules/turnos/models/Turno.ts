import { Schema, model, Document } from 'mongoose';

import type { ITurno } from '../interfaces/Turno.interface';


// ============================================================
// SCHEMA
// ============================================================

const turnoSchema = new Schema<ITurno>(
    {
        paciente: {
            type: Schema.Types.ObjectId,
            ref: 'Paciente',
            required: [true, 'El ID del paciente es obligatorio'],
        },

        especialidad: {
            type: Schema.Types.ObjectId,
            ref: 'Especialidad',
            required: [true, 'La especialidad es obligatoria'],
        },

        fechaTurno: {
            type: Date,
            required: [
                true,
                'La fecha del turno es obligatoria',
            ],
            validate: {
                validator: function (value: Date) {
                    return value >= new Date();
                },
                message: 'La fecha del turno debe ser una fecha futura',
            },
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
    },
    {
        timestamps: true,
    }
);


// ============================================================
// TO JSON
// ============================================================

turnoSchema.set('toJSON', {
    transform: (
        _documento: Document,
        turnoRetorno: Record<string, any>
    ) => {
        turnoRetorno.id = turnoRetorno._id;

        delete turnoRetorno._id;
        delete turnoRetorno.__v;
    },
});


// ============================================================
// MODEL
// ============================================================

const TurnoModel = model<ITurno>(
    'Turno',
    turnoSchema
);

export default TurnoModel;