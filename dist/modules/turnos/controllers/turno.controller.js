"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTurno = exports.actualizarEstadoTurno = exports.createTurno = exports.createMiTurno = exports.getMiHistorialTurnos = exports.getMisTurnos = exports.getMedicosDisponibles = exports.getDisponibilidad = exports.getTurnos = void 0;
const respuestaEstandar_1 = __importDefault(require("../../../utils/respuestaEstandar"));
const medico_service_1 = __importDefault(require("../../medico/services/medico.service"));
const turno_service_1 = __importDefault(require("../services/turno.service"));
const responderErrorTurno_1 = require("../utils/responderErrorTurno");
// ============================================================
// OBTENER TURNOS
// ============================================================
const getTurnos = async (_req, res) => {
    try {
        const turnos = await turno_service_1.default.getTurnos();
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Turnos obtenidos exitosamente', turnos);
    }
    catch (error) {
        return (0, responderErrorTurno_1.responderErrorTurno)(res, error, 'Error interno del servidor');
    }
};
exports.getTurnos = getTurnos;
// ============================================================
// CONSULTAR DISPONIBILIDAD
// ============================================================
const getDisponibilidad = async (req, res) => {
    try {
        const disponibilidad = await turno_service_1.default.getDisponibilidad(req.query.medicoId ?? '', req.query.fecha ?? '', {
            // El portal de pacientes solo consulta médicos cuya
            // especialidad siga activa. Los roles internos
            // conservan el comportamiento actual.
            validarEspecialidadActiva: req.usuario?.rol === 'paciente',
            ...(req.query.especialidad
                ? {
                    especialidadId: req.query.especialidad,
                }
                : {}),
        });
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Disponibilidad obtenida exitosamente', disponibilidad);
    }
    catch (error) {
        return (0, responderErrorTurno_1.responderErrorTurno)(res, error, 'Error al consultar la disponibilidad');
    }
};
exports.getDisponibilidad = getDisponibilidad;
// ============================================================
// MÉDICOS DISPONIBLES POR ESPECIALIDAD (PORTAL DE PACIENTES)
// ============================================================
const getMedicosDisponibles = async (req, res) => {
    try {
        const medicos = await medico_service_1.default.getMedicosDisponibles(req.query.especialidad ?? '');
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Médicos disponibles obtenidos exitosamente', medicos);
    }
    catch (error) {
        return (0, responderErrorTurno_1.responderErrorTurno)(res, error, 'Error al obtener los médicos disponibles');
    }
};
exports.getMedicosDisponibles = getMedicosDisponibles;
// ============================================================
// TURNOS DEL MÉDICO AUTENTICADO
// ============================================================
const getMisTurnos = async (req, res) => {
    try {
        if (!req.usuario) {
            return (0, respuestaEstandar_1.default)(res, 401, false, 'No autenticado');
        }
        const turnos = await turno_service_1.default.getTurnosDelMedico(req.usuario.id);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Turnos del médico obtenidos exitosamente', turnos);
    }
    catch (error) {
        return (0, responderErrorTurno_1.responderErrorTurno)(res, error, 'Error al obtener los turnos del médico');
    }
};
exports.getMisTurnos = getMisTurnos;
// ============================================================
// HISTORIAL DE TURNOS DEL PACIENTE AUTENTICADO
// ============================================================
const getMiHistorialTurnos = async (req, res) => {
    // Datos personales: no deben quedar en cachés compartidas.
    res.set('Cache-Control', 'no-store');
    try {
        const identidad = req.usuario;
        // La ruta ya exige rol `paciente`; se revalida el tipo para no
        // depender únicamente de la autorización por rol.
        if (!identidad || identidad.tipo !== 'paciente') {
            return (0, respuestaEstandar_1.default)(res, 401, false, 'No autenticado');
        }
        // El ID sale exclusivamente del JWT. No se lee `pacienteId`
        // desde params, query ni body.
        const turnos = await turno_service_1.default.getHistorialDelPaciente(identidad.id);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Historial de turnos obtenido exitosamente', turnos);
    }
    catch (error) {
        return (0, responderErrorTurno_1.responderErrorTurno)(res, error, 'Error al obtener el historial de turnos');
    }
};
exports.getMiHistorialTurnos = getMiHistorialTurnos;
// ============================================================
// CREAR TURNO DEL PACIENTE AUTENTICADO
// ============================================================
const createMiTurno = async (req, res) => {
    try {
        const identidad = req.usuario;
        // La ruta ya exige rol `paciente`; se revalida el tipo para no
        // depender únicamente de la autorización por rol.
        if (!identidad || identidad.tipo !== 'paciente') {
            return (0, respuestaEstandar_1.default)(res, 401, false, 'No autenticado');
        }
        // El ID del paciente sale exclusivamente del JWT. No se lee
        // ningún `paciente` enviado por el cliente.
        const turno = await turno_service_1.default.createTurnoParaPaciente(identidad.id, req.body);
        return (0, respuestaEstandar_1.default)(res, 201, true, 'Turno registrado exitosamente', turno);
    }
    catch (error) {
        return (0, responderErrorTurno_1.responderErrorTurno)(res, error, 'Error al registrar el turno');
    }
};
exports.createMiTurno = createMiTurno;
// ============================================================
// CREAR TURNO
// ============================================================
const createTurno = async (req, res) => {
    try {
        const origenPeticion = req.headers['x-origen'];
        console.log('🌎 Peticion realizada desde:', origenPeticion);
        // El estado inicial, la duración y la fecha de fin se derivan
        // en el servidor. El cliente no puede imponerlos.
        const turnoCompleto = await turno_service_1.default.createTurno(req.body);
        return (0, respuestaEstandar_1.default)(res, 201, true, 'Turno creado exitosamente', turnoCompleto);
    }
    catch (error) {
        return (0, responderErrorTurno_1.responderErrorTurno)(res, error, 'Error interno del servidor');
    }
};
exports.createTurno = createTurno;
// ============================================================
// ACTUALIZAR ESTADO
// ============================================================
const actualizarEstadoTurno = async (req, res) => {
    try {
        const { id } = req.params;
        const turnoActualizado = await turno_service_1.default.actualizarEstadoTurno(id, req.body);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Estado del turno actualizado exitosamente', turnoActualizado);
    }
    catch (error) {
        return (0, responderErrorTurno_1.responderErrorTurno)(res, error, 'Error al actualizar el estado del turno');
    }
};
exports.actualizarEstadoTurno = actualizarEstadoTurno;
// ============================================================
// ELIMINAR TURNO
// ============================================================
const deleteTurno = async (req, res) => {
    try {
        const { id } = req.params;
        const turnoBorrado = await turno_service_1.default.deleteTurno(id);
        return (0, respuestaEstandar_1.default)(res, 200, true, 'Turno eliminado exitosamente', turnoBorrado);
    }
    catch (error) {
        return (0, responderErrorTurno_1.responderErrorTurno)(res, error, 'Error al eliminar el turno');
    }
};
exports.deleteTurno = deleteTurno;
