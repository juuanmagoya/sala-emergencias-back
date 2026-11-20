"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateHistoriaClinica = exports.createHistoriaClinica = exports.getHistoriaClinicaById = exports.getMiHistorial = exports.getHistorialPaciente = exports.getHistoriasClinicas = void 0;
const respuestaEstandar_1 = __importDefault(require("../../../utils/respuestaEstandar"));
const historiaclinica_service_1 = __importDefault(require("../services/historiaclinica.service"));
// ============================================================
// MAPEO DE ERRORES
// ============================================================
const MENSAJES_VALIDACION = [
    'El ID del paciente no es válido',
    'El ID del médico no es válido',
    'El ID de la historia clínica no es válido',
    'El paciente indicado no existe',
    'El médico indicado no existe',
    'Las observaciones son obligatorias',
    'Las observaciones no pueden superar los 2000 caracteres',
    'La fecha de atención no es válida',
    'El recetario debe ser un arreglo de medicamentos',
];
const PREFIJOS_VALIDACION_MEDICAMENTO = [
    'El medicamento en la posición',
    'El nombre del medicamento en la posición',
    'La dosis del medicamento en la posición',
    'La frecuencia del medicamento en la posición',
    'La duración del medicamento en la posición',
    'Las indicaciones del medicamento en la posición',
];
const MENSAJES_NO_ENCONTRADO = [
    'Historia clínica no encontrada',
    'Paciente no encontrado',
];
const esErrorDeValidacion = (mensaje) => {
    if (typeof mensaje !== 'string') {
        return false;
    }
    return (MENSAJES_VALIDACION.includes(mensaje) ||
        PREFIJOS_VALIDACION_MEDICAMENTO.some((prefijo) => mensaje.startsWith(prefijo)));
};
const responderError = (res, error, mensajeGeneral) => {
    if (error.name === 'ValidationError') {
        const errores = Object.values(error.errors).map((err) => err.message);
        return (0, respuestaEstandar_1.default)(res, 400, false, 'Error de validación', errores);
    }
    if (error.name === 'CastError') {
        return (0, respuestaEstandar_1.default)(res, 400, false, 'Identificador inválido');
    }
    if (esErrorDeValidacion(error.message)) {
        return (0, respuestaEstandar_1.default)(res, 400, false, error.message);
    }
    if (MENSAJES_NO_ENCONTRADO.includes(error.message)) {
        return (0, respuestaEstandar_1.default)(res, 404, false, error.message);
    }
    return (0, respuestaEstandar_1.default)(res, 500, false, mensajeGeneral, error.message);
};
// ============================================================
// OBTENER HISTORIAS CLÍNICAS
// ============================================================
const getHistoriasClinicas = async (req, res) => {
    try {
        const historias = await historiaclinica_service_1.default.getHistoriasClinicas(req.query);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Historias clínicas obtenidas exitosamente', historias);
    }
    catch (error) {
        console.error('🔴 Error al obtener historias clínicas:', error);
        return responderError(res, error, 'Error al obtener las historias clínicas');
    }
};
exports.getHistoriasClinicas = getHistoriasClinicas;
// ============================================================
// OBTENER HISTORIAL CLÍNICO DE UN PACIENTE
// ============================================================
const getHistorialPaciente = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const historial = await historiaclinica_service_1.default.getHistorialPaciente(pacienteId);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Historial clínico obtenido exitosamente', historial);
    }
    catch (error) {
        console.error('🔴 Error al obtener el historial clínico del paciente:', error);
        return responderError(res, error, 'Error al obtener el historial clínico del paciente');
    }
};
exports.getHistorialPaciente = getHistorialPaciente;
// ============================================================
// OBTENER EL HISTORIAL DEL PACIENTE AUTENTICADO
// ============================================================
const getMiHistorial = async (req, res) => {
    // El historial clínico no debe quedar en cachés compartidas.
    res.set('Cache-Control', 'no-store');
    try {
        const identidad = req.usuario;
        // La ruta ya exige rol `paciente`; se revalida el tipo para no
        // depender únicamente de la autorización por rol.
        if (!identidad || identidad.tipo !== 'paciente') {
            return (0, respuestaEstandar_1.default)(res, 401, false, 'No autenticado');
        }
        // El ID sale exclusivamente del JWT: no se acepta `pacienteId`
        // desde params, query ni body.
        const historial = await historiaclinica_service_1.default.getMiHistorial(identidad.id);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Historial clínico obtenido exitosamente', historial);
    }
    catch (error) {
        console.error('🔴 Error al obtener el historial clínico del paciente:', error);
        return responderError(res, error, 'Error al obtener el historial clínico del paciente');
    }
};
exports.getMiHistorial = getMiHistorial;
// ============================================================
// OBTENER HISTORIA CLÍNICA POR ID
// ============================================================
const getHistoriaClinicaById = async (req, res) => {
    try {
        const { id } = req.params;
        const historia = await historiaclinica_service_1.default.getHistoriaClinicaById(id);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Historia clínica obtenida exitosamente', historia);
    }
    catch (error) {
        console.error('🔴 Error al obtener la historia clínica:', error);
        return responderError(res, error, 'Error al obtener la historia clínica');
    }
};
exports.getHistoriaClinicaById = getHistoriaClinicaById;
// ============================================================
// CREAR HISTORIA CLÍNICA
// ============================================================
const createHistoriaClinica = async (req, res) => {
    try {
        const historiaCompleta = await historiaclinica_service_1.default.createHistoriaClinica(req.body);
        return (0, respuestaEstandar_1.default)(res, 201, true, 'Historia clínica creada exitosamente', historiaCompleta);
    }
    catch (error) {
        console.error('🔴 Error al crear la historia clínica:', error);
        return responderError(res, error, 'Error al crear la historia clínica');
    }
};
exports.createHistoriaClinica = createHistoriaClinica;
// ============================================================
// ACTUALIZAR HISTORIA CLÍNICA
// ============================================================
const updateHistoriaClinica = async (req, res) => {
    try {
        const { id } = req.params;
        const historiaActualizada = await historiaclinica_service_1.default.updateHistoriaClinica(id, req.body);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Historia clínica actualizada exitosamente', historiaActualizada);
    }
    catch (error) {
        console.error('🔴 Error al actualizar la historia clínica:', error);
        return responderError(res, error, 'Error al actualizar la historia clínica');
    }
};
exports.updateHistoriaClinica = updateHistoriaClinica;
