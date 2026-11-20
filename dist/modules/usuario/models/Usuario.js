"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const Medico_1 = __importDefault(require("../../medico/models/Medico"));
const usuario_types_1 = require("../types/usuario.types");
const usuarioSchema = new mongoose_1.Schema({
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
    // El rol es obligatorio y explícito: no existe un rol por defecto.
    // Así ninguna creación de usuario puede heredar privilegios por
    // omisión.
    rol: {
        type: String,
        enum: [...usuario_types_1.ROLES_USUARIO],
        required: true,
    },
    // Baja lógica de la cuenta. No elimina ni desactiva el perfil médico.
    activo: {
        type: Boolean,
        default: true,
    },
    // Referencia opcional al perfil médico. No se asume que Usuario._id y
    // Medico._id coincidan: la relación es explícita.
    medico: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Medico',
        validate: {
            validator: async (valor) => {
                if (valor === undefined || valor === null) {
                    return true;
                }
                const medicoExistente = await Medico_1.default.exists({ _id: valor });
                return Boolean(medicoExistente);
            },
            message: 'El médico indicado no existe',
        },
    },
}, {
    timestamps: true,
});
// Un perfil médico solo puede estar vinculado a un usuario. `sparse` permite
// que los documentos sin relación (la mayoría) no participen del índice.
usuarioSchema.index({ medico: 1 }, { unique: true, sparse: true });
// Un usuario con un perfil médico asociado debe tener rol `medico`.
// No se exige lo inverso: los usuarios médicos existentes pueden no estar
// vinculados todavía.
usuarioSchema.pre('validate', function () {
    if (this.medico && this.rol !== 'medico') {
        this.invalidate('medico', 'Solo un usuario con rol médico puede tener un perfil médico asociado');
    }
});
// La contraseña nunca forma parte de la representación pública del usuario.
usuarioSchema.set('toJSON', {
    transform: (_documento, usuarioRetorno) => {
        usuarioRetorno.id = usuarioRetorno._id;
        // Normaliza documentos heredados que todavía no tienen el campo.
        usuarioRetorno.activo = usuarioRetorno.activo !== false;
        delete usuarioRetorno._id;
        delete usuarioRetorno.__v;
        delete usuarioRetorno.password;
    },
});
exports.default = (0, mongoose_1.model)('Usuario', usuarioSchema);
