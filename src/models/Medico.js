// src/models/Medico.js
const mongoose = require('mongoose');

const medicoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del médico es obligatorio'],
        uppercase: true,
        trim: true
    },
    apellido: {
        type: String,
        required: [true, 'El apellido del médico es obligatorio'],
        uppercase: true,
        trim: true
    },
    matricula: {
        type: String,
        required: [true, 'La matrícula del médico es obligatoria'],
        unique: [true, 'La matrícula debe ser única'],
        match: [/^[0-9]{6,8}$/, 'La matrícula debe tener entre 6 y 8 dígitos']
    },
    // 🔥 CAMBIO: ahora es ObjectId referenciando a Especialidad
    especialidad: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Especialidad',
        required: [true, 'La especialidad es obligatoria']
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: [true, 'El email debe ser único'],
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'El email no es válido']
    },
    telefono: {
        tipo: {
            type: String,
            enum: ['CELULAR', 'FIJO', 'TRABAJO'],
            default: 'CELULAR'
        },
        codigoArea: {
            type: String,
            required: [true, 'El código de área es obligatorio'],
            match: [/^[0-9]{2,5}$/, 'El código de área no es válido']
        },
        numero: {
            type: String,
            required: [true, 'El número de teléfono es obligatorio'],
            match: [/^[0-9]{7,10}$/, 'El número de teléfono no es válido']
        }
    },
    consultorios: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Consultorio'
    }],
    horarioAtencion: {
        dia: {
            type: String,
            enum: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO']
        },
        horaInicio: {
            type: String,
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
        },
        horaFin: {
            type: String,
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
        }
    },
    activo: {
        type: Boolean,
        default: true,
        select: false
    }
}, {
    timestamps: true
});

// Índices
medicoSchema.index({ especialidad: 1 });
medicoSchema.index({ apellido: 1, nombre: 1 });

medicoSchema.set('toJSON', {
    transform: (documento, medicoRetorno) => {
        medicoRetorno.id = medicoRetorno._id;
        delete medicoRetorno._id;
        delete medicoRetorno.__v;
        delete medicoRetorno.activo;
    }
});

module.exports = mongoose.model('Medico', medicoSchema);