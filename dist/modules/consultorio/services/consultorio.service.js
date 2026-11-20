"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConsultorio = exports.updateConsultorio = exports.createConsultorio = exports.getConsultorios = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Consultorio_js_1 = __importDefault(require("../models/Consultorio.js"));
const Especialidad_js_1 = __importDefault(require("../../especialidad/models/Especialidad.js"));
const getConsultorios = async ({ id, numero, nombre, especialidad, }) => {
    const filtro = {
        activo: true,
    };
    if (id) {
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            throw new Error('ID de consultorio inválido');
        }
        filtro._id = id;
    }
    if (numero) {
        filtro.numero = numero;
    }
    if (nombre) {
        filtro.nombre = {
            $regex: nombre.toUpperCase(),
            $options: 'i',
        };
    }
    if (especialidad) {
        const especialidadDoc = await Especialidad_js_1.default.findOne({
            nombre: especialidad.toUpperCase(),
        });
        if (!especialidadDoc) {
            return [];
        }
        filtro.especialidades = {
            $in: [especialidadDoc._id],
        };
    }
    const consultorios = await Consultorio_js_1.default.find(filtro)
        .populate('especialidades');
    if (id && consultorios.length === 0) {
        throw new Error('Consultorio no encontrado');
    }
    return consultorios;
};
exports.getConsultorios = getConsultorios;
const createConsultorio = async (datos) => {
    const nuevoConsultorio = await Consultorio_js_1.default.create(datos);
    return Consultorio_js_1.default.findById(nuevoConsultorio._id)
        .populate('especialidades');
};
exports.createConsultorio = createConsultorio;
const updateConsultorio = async (id, datos) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new Error('ID de consultorio inválido');
    }
    const consultorioExistente = await Consultorio_js_1.default.findOne({
        _id: id,
        activo: true,
    });
    if (!consultorioExistente) {
        throw new Error('Consultorio no encontrado');
    }
    const { nombre, numero } = datos;
    if (nombre || numero) {
        const condiciones = [];
        if (nombre) {
            condiciones.push({ nombre });
        }
        if (numero) {
            condiciones.push({ numero });
        }
        const duplicado = await Consultorio_js_1.default.findOne({
            $or: condiciones,
            _id: { $ne: id },
        });
        if (duplicado) {
            if (duplicado.nombre === nombre) {
                throw new Error('Ya existe otro consultorio con ese nombre');
            }
            if (duplicado.numero === numero) {
                throw new Error('Ya existe otro consultorio con ese número');
            }
        }
    }
    return Consultorio_js_1.default.findByIdAndUpdate(id, datos, {
        new: true,
        runValidators: true,
    }).populate('especialidades');
};
exports.updateConsultorio = updateConsultorio;
const deleteConsultorio = async (id) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new Error('ID de consultorio inválido');
    }
    const consultorioEliminado = await Consultorio_js_1.default.findByIdAndUpdate(id, { activo: false }, { new: true });
    if (!consultorioEliminado) {
        throw new Error('Consultorio no encontrado');
    }
    return consultorioEliminado;
};
exports.deleteConsultorio = deleteConsultorio;
