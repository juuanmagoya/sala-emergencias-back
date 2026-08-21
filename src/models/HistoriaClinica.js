const mongoose = require('mongoose');

const historiaClinicaSchema = new mongoose.Schema({
    // 1. RELACIÓN CON PACIENTE (obligatorio)
    paciente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paciente',
        required: [true, 'El paciente es obligatorio']
    },

    // 2. DATOS DE LA ATENCIÓN
    tipoAtencion: {
        type: String,
        enum: ['URGENCIA', 'CONSULTA_GENERAL', 'CONTROL', 'EMERGENCIA'],
        required: [true, 'El tipo de atención es obligatorio'],
        default: 'CONSULTA_GENERAL'
    },
    fechaAtencion: {
        type: Date,
        required: [true, 'La fecha de atención es obligatoria'],
        default: Date.now
    },

    // 3. MOTIVO DE CONSULTA
    motivoConsulta: {
        type: String,
        required: [true, 'El motivo de consulta es obligatorio'],
        trim: true,
        maxlength: [500, 'El motivo no puede superar los 500 caracteres']
    },
    sintomas: [{
        type: String,
        enum: ['FIEBRE', 'DOLOR_CABEZA', 'DOLOR_ABDOMINAL', 'DOLOR_PECHO', 'NAUSEAS', 
               'VOMITOS', 'DIARREA', 'FATIGA', 'MAREO', 'DESMAYO', 'TRAUMA', 
               'DIFICULTAD_RESPIRATORIA', 'TOS', 'CONGESTION_NASAL', 'DOLOR_GARGANTA', 
               'ERUPCION_CUTANEA', 'OTRO']
    }],

    // 4. SIGNOS VITALES (opcionales pero útiles)
    signosVitales: {
        presionArterial: {
            sistolica: {
                type: Number,
                min: [60, 'La presión sistólica no puede ser menor a 60'],
                max: [250, 'La presión sistólica no puede ser mayor a 250']
            },
            diastolica: {
                type: Number,
                min: [30, 'La presión diastólica no puede ser menor a 30'],
                max: [160, 'La presión diastólica no puede ser mayor a 160']
            }
        },
        frecuenciaCardiaca: {
            type: Number,
            min: [20, 'La frecuencia cardíaca no puede ser menor a 20'],
            max: [250, 'La frecuencia cardíaca no puede ser mayor a 250']
        },
        frecuenciaRespiratoria: {
            type: Number,
            min: [4, 'La frecuencia respiratoria no puede ser menor a 4'],
            max: [60, 'La frecuencia respiratoria no puede ser mayor a 60']
        },
        temperatura: {
            type: Number,
            min: [32, 'La temperatura no puede ser menor a 32°C'],
            max: [42, 'La temperatura no puede ser mayor a 42°C']
        },
        saturacionOxigeno: {
            type: Number,
            min: [60, 'La saturación no puede ser menor a 60%'],
            max: [100, 'La saturación no puede ser mayor a 100%']
        },
        glucemia: {
            type: Number,
            min: [20, 'La glucemia no puede ser menor a 20 mg/dL'],
            max: [600, 'La glucemia no puede ser mayor a 600 mg/dL']
        }
    },

    // 5. EXAMEN FÍSICO (igual que lo que pediste)
    examenFisico: {
        hallazgos: {
            type: String,
            trim: true,
            maxlength: [1000, 'Los hallazgos no pueden superar los 1000 caracteres']
        },
        examenesSolicitados: [{
            type: String,
            enum: ['LABORATORIO', 'RADIOGRAFIA', 'ECOGRAFIA', 'ELECTROCARDIOGRAMA', 
                   'TOMOGRAFIA', 'RESONANCIA', 'OTRO']
        }],
        resultadosExamenes: {
            type: String,
            trim: true
        }
    },

    // 6. DIAGNÓSTICO
    diagnostico: {
        impresionDiagnostica: {
            type: String,
            trim: true,
            maxlength: [500, 'La impresión diagnóstica no puede superar los 500 caracteres']
        },
        diagnosticoDefinitivo: {
            type: String,
            trim: true,
            maxlength: [500, 'El diagnóstico definitivo no puede superar los 500 caracteres']
        },
        // Opcional: código CIE-10 si lo usan
        codigoCIE10: {
            type: String,
            match: [/^[A-Z][0-9]{2}\.[0-9]$/, 'Formato de CIE-10 inválido (ej: A04.5)']
        }
    },

    // 7. TRATAMIENTO (más detallado que en paciente)
    tratamiento: {
        indicaciones: {
            type: String,
            trim: true,
            maxlength: [1000, 'Las indicaciones no pueden superar los 1000 caracteres']
        },
        medicamentos: [{
            nombre: {
                type: String,
                required: true,
                trim: true
            },
            dosis: {
                type: String,
                required: true,
                trim: true
            },
            via: {
                type: String,
                enum: ['ORAL', 'INTRAVENOSA', 'INTRAMUSCULAR', 'SUBCUTANEA', 'TOPICA', 'INHALATORIA'],
                required: true
            },
            frecuencia: {
                type: String,
                trim: true
            }
        }],
        procedimientos: [{
            type: String,
            enum: ['SUTURA', 'INMOVILIZACION', 'VENOPUNCION', 'COLOCACION_SONDA', 
                   'DRENAJE', 'LIMPIEZA_HERIDA', 'CURACION', 'OTRO']
        }]
    },

    // 8. PERSONAL INTERVINIENTE
    medico: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medico',
        required: [true, 'El médico es obligatorio']
    },
    // Enfermero: lo dejamos opcional por si después lo agregas
    enfermero: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },

    // 9. ESTADO Y SEGUIMIENTO
    estado: {
        type: String,
        enum: ['EN_ATENCION', 'FINALIZADA', 'OBSERVACION'],
        default: 'EN_ATENCION'
    },
    fechaAlta: {
        type: Date
    },
    recomendaciones: {
        type: String,
        trim: true,
        maxlength: [1000, 'Las recomendaciones no pueden superar los 1000 caracteres']
    },

    // 10. CONTROL DE VERSIÓN (para saber si la historia fue editada)
    version: {
        type: Number,
        default: 1
    },

    activo: {
        type: Boolean,
        default: true,
        select: false
    }
}, {
    timestamps: true
});

// Índices para búsquedas rápidas
historiaClinicaSchema.index({ paciente: 1 });
historiaClinicaSchema.index({ medico: 1 });
historiaClinicaSchema.index({ fechaAtencion: -1 });
historiaClinicaSchema.index({ estado: 1 });
historiaClinicaSchema.index({ 'diagnostico.codigoCIE10': 1 });

historiaClinicaSchema.set('toJSON', {
    transform: (documento, historiaRetorno) => {
        historiaRetorno.id = historiaRetorno._id;
        delete historiaRetorno._id;
        delete historiaRetorno.__v;
        delete historiaRetorno.activo;
    }
});

module.exports = mongoose.model('HistoriaClinica', historiaClinicaSchema);