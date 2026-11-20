"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const autorizarRoles_middleware_1 = __importDefault(require("../../../middlewares/autorizarRoles.middleware"));
const turno_controller_1 = require("../controllers/turno.controller");
const router = (0, express_1.Router)();
// Consulta de la cola de turnos: la usan recepción, el personal médico
// (para ver la demanda) y la administración.
router.get('/', (0, autorizarRoles_middleware_1.default)('admin', 'medico', 'recepcionista'), turno_controller_1.getTurnos);
// Horarios libres de un médico para una fecha local (YYYY-MM-DD).
// La duración siempre surge del perfil del médico. El portal de pacientes
// reutiliza exactamente la misma consulta.
router.get('/disponibilidad', (0, autorizarRoles_middleware_1.default)('admin', 'medico', 'recepcionista', 'paciente'), turno_controller_1.getDisponibilidad);
// Catálogo de médicos activos de una especialidad activa para el portal
// de pacientes. La proyección excluye datos de contacto y administrativos.
router.get('/medicos-disponibles', (0, autorizarRoles_middleware_1.default)('paciente'), turno_controller_1.getMedicosDisponibles);
// Agenda del médico autenticado. El perfil se resuelve desde la relación
// explícita Usuario.medico; no se acepta un médico por parámetro.
router.get('/mis-turnos', (0, autorizarRoles_middleware_1.default)('medico'), turno_controller_1.getMisTurnos);
// Historial completo de turnos del paciente autenticado: pendientes,
// atendidos y cancelados. La identidad se resuelve exclusivamente desde
// el JWT; no se acepta un paciente por parámetro.
router.get('/mi-historial', (0, autorizarRoles_middleware_1.default)('paciente'), turno_controller_1.getMiHistorialTurnos);
// Alta del turno del paciente autenticado. El paciente se resuelve
// exclusivamente desde el JWT; el body no admite `paciente`.
router.post('/mi-turno', (0, autorizarRoles_middleware_1.default)('paciente'), turno_controller_1.createMiTurno);
// Alta de turnos: operación de recepción/administración.
// Ya no se usa la credencial estática `token123`: la autorización es por JWT.
router.post('/', (0, autorizarRoles_middleware_1.default)('admin', 'recepcionista'), turno_controller_1.createTurno);
// Cambio de estado del turno: lo usa el personal que gestiona la cola
// (recepción/administración) y el médico al marcar la atención.
router.patch('/:id/estado', (0, autorizarRoles_middleware_1.default)('admin', 'medico', 'recepcionista'), turno_controller_1.actualizarEstadoTurno);
// Cancelación (borrado lógico): operación de recepción/administración.
router.delete('/:id', (0, autorizarRoles_middleware_1.default)('admin', 'recepcionista'), turno_controller_1.deleteTurno);
exports.default = router;
