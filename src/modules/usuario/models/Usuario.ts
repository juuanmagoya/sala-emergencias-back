import { Schema, model } from 'mongoose';

import type { IUsuario } from '../interfaces/Usuario.interface';

const usuarioSchema = new Schema<IUsuario>(
    {
        nombre: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
        },

        rol: {
            type: String,
            enum: ['admin'],
            default: 'admin',
        },
    },
    {
        timestamps: true,
    }
);

export default model<IUsuario>(
    'Usuario',
    usuarioSchema
);