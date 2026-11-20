"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEspecialidadPermanente = exports.toggleActivoEspecialidad = exports.updateEspecialidad = exports.createEspecialidad = exports.getEspecialidadesDisponibles = exports.getEspecialidades = void 0;
const respuestaEstandar_1 = __importDefault(require("../../../utils/respuestaEstandar"));
const especialidad_service_1 = __importDefault(require("../services/especialidad.service"));
// ============================================================
// OBTENER ESPECIALIDADES
// ============================================================
const getEspecialidades = async (req, res) => {
    try {
        const especialidades = await especialidad_service_1.default.getEspecialidades(req.query);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Especialidades obtenidas exitosamente', especialidades);
    }
    catch (error) {
        console.error('🔴 Error al obtener especialidades:', error);
        if (error.message === 'El ID de la especialidad no es válido') {
            return (0, respuestaEstandar_1.default)(res, 400, false, 'ID de especialidad inválido');
        }
        if (error.message === 'Especialidad no encontrada') {
            return (0, respuestaEstandar_1.default)(res, 404, false, 'Especialidad no encontrada');
        }
        return (0, respuestaEstandar_1.default)(res, 500, false, 'Error al obtener las especialidades', error.message);
    }
};
exports.getEspecialidades = getEspecialidades;
// ============================================================
// OBTENER ESPECIALIDADES DISPONIBLES PARA PACIENTES
// ============================================================
const getEspecialidadesDisponibles = async (_req, res) => {
    try {
        const especialidades = await especialidad_service_1.default.getEspecialidadesDisponibles();
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Especialidades disponibles obtenidas exitosamente', especialidades);
    }
    catch (error) {
        console.error('🔴 Error al obtener especialidades disponibles:', error);
        return (0, respuestaEstandar_1.default)(res, 500, false, 'Error al obtener las especialidades disponibles');
    }
};
exports.getEspecialidadesDisponibles = getEspecialidadesDisponibles;
// ============================================================
// CREAR ESPECIALIDAD
// ============================================================
const createEspecialidad = async (req, res) => {
    try {
        console.log('🟡 BODY RECIBIDO:', req.body);
        const nuevaEspecialidad = await especialidad_service_1.default.createEspecialidad(req.body);
        console.log('🟢 ESPECIALIDAD CREADA:', nuevaEspecialidad);
        return (0, respuestaEstandar_1.default)(res, 201, true, 'Especialidad creada exitosamente', nuevaEspecialidad);
    }
    catch (error) {
        console.error('🔴 ERROR AL CREAR ESPECIALIDAD:', error);
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors)
                .map((err) => err.message);
            return (0, respuestaEstandar_1.default)(res, 400, false, 'Error de validación', errores);
        }
        if (error.code === 11000) {
            const campo = Object.keys(error.keyPattern)[0];
            return (0, respuestaEstandar_1.default)(res, 400, false, `El ${campo} ya está registrado en el sistema`);
        }
        return (0, respuestaEstandar_1.default)(res, 500, false, 'Error al crear la especialidad', error.message);
    }
};
exports.createEspecialidad = createEspecialidad;
// ============================================================
// ACTUALIZAR ESPECIALIDAD
// ============================================================
const updateEspecialidad = async (req, res) => {
    try {
        const { id } = req.params;
        const especialidadActualizada = await especialidad_service_1.default.updateEspecialidad(id, req.body);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Especialidad actualizada exitosamente', especialidadActualizada);
    }
    catch (error) {
        console.error('🔴 Error al actualizar especialidad:', error);
        if (error.message ===
            'El ID de la especialidad no es válido') {
            return (0, respuestaEstandar_1.default)(res, 400, false, 'ID de especialidad inválido');
        }
        if (error.message ===
            'Especialidad no encontrada o está inactiva') {
            return (0, respuestaEstandar_1.default)(res, 404, false, 'Especialidad no encontrada');
        }
        if (error.message ===
            'Ya existe una especialidad con ese nombre') {
            return (0, respuestaEstandar_1.default)(res, 400, false, 'Ya existe otra especialidad con ese nombre');
        }
        if (error.message ===
            'Ya existe una especialidad con ese código') {
            return (0, respuestaEstandar_1.default)(res, 400, false, 'Ya existe otra especialidad con ese código');
        }
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors)
                .map((err) => err.message);
            return (0, respuestaEstandar_1.default)(res, 400, false, 'Error de validación', errores);
        }
        if (error.code === 11000) {
            const campo = Object.keys(error.keyPattern)[0];
            return (0, respuestaEstandar_1.default)(res, 400, false, `El ${campo} ya está registrado en el sistema`);
        }
        return (0, respuestaEstandar_1.default)(res, 500, false, 'Error al actualizar la especialidad', error.message);
    }
};
exports.updateEspecialidad = updateEspecialidad;
// ============================================================
// CAMBIAR ESTADO
// ============================================================
const toggleActivoEspecialidad = async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await especialidad_service_1.default.toggleActivoEspecialidad(id);
        return (0, respuestaEstandar_1.default)(res, 200, true, resultado.mensaje, resultado.especialidad);
    }
    catch (error) {
        console.error('🔴 Error al cambiar estado de especialidad:', error);
        if (error.message ===
            'El ID de la especialidad no es válido') {
            return (0, respuestaEstandar_1.default)(res, 400, false, 'ID de especialidad inválido');
        }
        if (error.message ===
            'Especialidad no encontrada') {
            return (0, respuestaEstandar_1.default)(res, 404, false, 'Especialidad no encontrada');
        }
        if (error.message.includes('No se puede desactivar la especialidad')) {
            return (0, respuestaEstandar_1.default)(res, 400, false, error.message);
        }
        return (0, respuestaEstandar_1.default)(res, 500, false, 'Error al cambiar el estado de la especialidad', error.message);
    }
};
exports.toggleActivoEspecialidad = toggleActivoEspecialidad;
// ============================================================
// ELIMINAR PERMANENTEMENTE
// ============================================================
const deleteEspecialidadPermanente = async (req, res) => {
    try {
        const { id } = req.params;
        await especialidad_service_1.default.deleteEspecialidadPermanente(id);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Especialidad eliminada permanentemente');
    }
    catch (error) {
        console.error('🔴 Error al eliminar especialidad:', error);
        if (error.message ===
            'El ID de la especialidad no es válido') {
            return (0, respuestaEstandar_1.default)(res, 400, false, 'ID de especialidad inválido');
        }
        if (error.message ===
            'Especialidad no encontrada') {
            return (0, respuestaEstandar_1.default)(res, 404, false, 'Especialidad no encontrada');
        }
        if (error.message.includes('No se puede eliminar la especialidad')) {
            return (0, respuestaEstandar_1.default)(res, 400, false, error.message);
        }
        return (0, respuestaEstandar_1.default)(res, 500, false, 'Error al eliminar permanentemente la especialidad', error.message);
    }
};
exports.deleteEspecialidadPermanente = deleteEspecialidadPermanente;
