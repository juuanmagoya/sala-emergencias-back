"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const especialidadSchema = new mongoose_1.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre de la especialidad es obligatorio'],
        unique: [true, 'El nombre de la especialidad debe ser único'],
        uppercase: true,
        trim: true,
    },
    descripcion: {
        type: String,
        trim: true,
        maxlength: [
            500,
            'La descripción no puede superar los 500 caracteres',
        ],
    },
    codigo: {
        type: String,
        unique: [true, 'El código de especialidad debe ser único'],
        trim: true,
        uppercase: true,
        match: [
            /^[A-Z]{2,5}$/,
            'El código debe tener entre 2 y 5 letras mayúsculas',
        ],
    },
    activo: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
especialidadSchema.set('toJSON', {
    transform: (_documento, especialidadRetorno) => {
        especialidadRetorno.id = especialidadRetorno._id;
        delete especialidadRetorno._id;
        delete especialidadRetorno.__v;
    },
});
const EspecialidadModel = (0, mongoose_1.model)('Especialidad', especialidadSchema);
exports.default = EspecialidadModel;
