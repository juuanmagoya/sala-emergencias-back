"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConsultorio = exports.updateConsultorio = exports.createConsultorio = exports.getConsultorios = void 0;
const respuestaEstandar_js_1 = __importDefault(require("../../../utils/respuestaEstandar.js"));
const consultorio_service_js_1 = require("../services/consultorio.service.js");
const getConsultorios = async (req, res) => {
    try {
        const consultorios = await (0, consultorio_service_js_1.getConsultorios)(req.query);
        return (0, respuestaEstandar_js_1.default)(res, 200, true, 'Consultorios obtenidos exitosamente', consultorios);
    }
    catch (error) {
        const mensaje = error instanceof Error
            ? error.message
            : 'Error al obtener los consultorios';
        if (mensaje === 'ID de consultorio inválido') {
            return (0, respuestaEstandar_js_1.default)(res, 400, false, mensaje);
        }
        if (mensaje === 'Consultorio no encontrado') {
            return (0, respuestaEstandar_js_1.default)(res, 404, false, mensaje);
        }
        return (0, respuestaEstandar_js_1.default)(res, 500, false, 'Error al obtener los consultorios', mensaje);
    }
};
exports.getConsultorios = getConsultorios;
const createConsultorio = async (req, res) => {
    try {
        const consultorio = await (0, consultorio_service_js_1.createConsultorio)(req.body);
        return (0, respuestaEstandar_js_1.default)(res, 201, true, 'Consultorio creado exitosamente', consultorio);
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err) => err.message);
            return (0, respuestaEstandar_js_1.default)(res, 400, false, 'Error de validación', errores);
        }
        if (error.code === 11000) {
            const campo = Object.keys(error.keyPattern)[0];
            return (0, respuestaEstandar_js_1.default)(res, 400, false, `El ${campo} ya está registrado en el sistema`);
        }
        return (0, respuestaEstandar_js_1.default)(res, 500, false, 'Error al crear el consultorio', error.message);
    }
};
exports.createConsultorio = createConsultorio;
const updateConsultorio = async (req, res) => {
    try {
        const consultorio = await (0, consultorio_service_js_1.updateConsultorio)(req.params.id, req.body);
        return (0, respuestaEstandar_js_1.default)(res, 200, true, 'Consultorio actualizado exitosamente', consultorio);
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err) => err.message);
            return (0, respuestaEstandar_js_1.default)(res, 400, false, 'Error de validación', errores);
        }
        if (error.message ===
            'ID de consultorio inválido') {
            return (0, respuestaEstandar_js_1.default)(res, 400, false, error.message);
        }
        if (error.message ===
            'Consultorio no encontrado') {
            return (0, respuestaEstandar_js_1.default)(res, 404, false, error.message);
        }
        if (error.message ===
            'Ya existe otro consultorio con ese nombre') {
            return (0, respuestaEstandar_js_1.default)(res, 400, false, error.message);
        }
        if (error.message ===
            'Ya existe otro consultorio con ese número') {
            return (0, respuestaEstandar_js_1.default)(res, 400, false, error.message);
        }
        if (error.name === 'CastError') {
            return (0, respuestaEstandar_js_1.default)(res, 400, false, 'ID de consultorio inválido');
        }
        return (0, respuestaEstandar_js_1.default)(res, 500, false, 'Error al actualizar el consultorio', error.message);
    }
};
exports.updateConsultorio = updateConsultorio;
const deleteConsultorio = async (req, res) => {
    try {
        const consultorio = await (0, consultorio_service_js_1.deleteConsultorio)(req.params.id);
        return (0, respuestaEstandar_js_1.default)(res, 200, true, 'Consultorio eliminado exitosamente', consultorio);
    }
    catch (error) {
        if (error.message ===
            'ID de consultorio inválido') {
            return (0, respuestaEstandar_js_1.default)(res, 400, false, error.message);
        }
        if (error.message ===
            'Consultorio no encontrado') {
            return (0, respuestaEstandar_js_1.default)(res, 404, false, error.message);
        }
        if (error.name === 'CastError') {
            return (0, respuestaEstandar_js_1.default)(res, 400, false, 'ID con formato inválido');
        }
        return (0, respuestaEstandar_js_1.default)(res, 500, false, 'Error al eliminar el consultorio', error.message);
    }
};
exports.deleteConsultorio = deleteConsultorio;
