"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMedicoPermanente = exports.toggleActivoMedico = exports.updateMedico = exports.createMedico = exports.getMedicos = void 0;
const respuestaEstandar_1 = __importDefault(require("../../../utils/respuestaEstandar"));
const medico_service_1 = __importDefault(require("../services/medico.service"));
// ============================================================
// OBTENER MÉDICOS
// ============================================================
const getMedicos = async (req, res) => {
    try {
        const medicos = await medico_service_1.default.getMedicos(req.query);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Médicos obtenidos exitosamente', medicos);
    }
    catch (error) {
        console.error('Error al obtener médicos:', error);
        return (0, respuestaEstandar_1.default)(res, error.statusCode || 500, false, error.message || 'Error al obtener los médicos');
    }
};
exports.getMedicos = getMedicos;
// ============================================================
// CREAR MÉDICO
// ============================================================
const createMedico = async (req, res) => {
    try {
        const medico = await medico_service_1.default.createMedico(req.body);
        return (0, respuestaEstandar_1.default)(res, 201, true, 'Médico creado exitosamente', medico);
    }
    catch (error) {
        console.error('Error al crear médico:', error);
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err) => err.message);
            return (0, respuestaEstandar_1.default)(res, 400, false, 'Error de validación', errores);
        }
        if (error.code === 11000) {
            const campo = Object.keys(error.keyPattern)[0];
            return (0, respuestaEstandar_1.default)(res, 400, false, `El ${campo} ya está registrado en el sistema`);
        }
        return (0, respuestaEstandar_1.default)(res, error.statusCode || 500, false, error.message || 'Error al crear el médico');
    }
};
exports.createMedico = createMedico;
// ============================================================
// ACTUALIZAR MÉDICO
// ============================================================
const updateMedico = async (req, res) => {
    try {
        const medico = await medico_service_1.default.updateMedico(req.params.id, req.body);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Médico actualizado exitosamente', medico);
    }
    catch (error) {
        console.error('Error al actualizar médico:', error);
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map((err) => err.message);
            return (0, respuestaEstandar_1.default)(res, 400, false, 'Error de validación', errores);
        }
        if (error.code === 11000) {
            const campo = Object.keys(error.keyPattern)[0];
            return (0, respuestaEstandar_1.default)(res, 400, false, `El ${campo} ya está registrado en el sistema`);
        }
        return (0, respuestaEstandar_1.default)(res, error.statusCode || 500, false, error.message || 'Error al actualizar el médico');
    }
};
exports.updateMedico = updateMedico;
// ============================================================
// ACTIVAR / DESACTIVAR
// ============================================================
const toggleActivoMedico = async (req, res) => {
    try {
        const medico = await medico_service_1.default.toggleActivoMedico(req.params.id);
        const mensaje = medico.activo
            ? 'Médico activado exitosamente'
            : 'Médico desactivado exitosamente';
        return (0, respuestaEstandar_1.default)(res, 200, true, mensaje, medico);
    }
    catch (error) {
        console.error('Error al cambiar estado del médico:', error);
        return (0, respuestaEstandar_1.default)(res, error.statusCode || 500, false, error.message ||
            'Error al cambiar el estado del médico');
    }
};
exports.toggleActivoMedico = toggleActivoMedico;
// ============================================================
// ELIMINAR
// ============================================================
const deleteMedicoPermanente = async (req, res) => {
    try {
        await medico_service_1.default.deleteMedicoPermanente(req.params.id);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Médico eliminado permanentemente');
    }
    catch (error) {
        console.error('Error al eliminar médico:', error);
        return (0, respuestaEstandar_1.default)(res, error.statusCode || 500, false, error.message ||
            'Error al eliminar permanentemente el médico');
    }
};
exports.deleteMedicoPermanente = deleteMedicoPermanente;
