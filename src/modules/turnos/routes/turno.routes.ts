import { Router } from 'express';

import autorizarRoles from '../../../middlewares/autorizarRoles.middleware';

import {
    getTurnos,
    getDisponibilidad,
    getMedicosDisponibles,
    getMisTurnos,
    getMiHistorialTurnos,
    createMiTurno,
    createTurno,
    actualizarEstadoTurno,
    deleteTurno,
} from '../controllers/turno.controller';

const router = Router();

// Consulta de la cola de turnos: la usan recepción, el personal médico
// (para ver la demanda) y la administración.
router.get(
    '/',
    autorizarRoles('admin', 'medico', 'recepcionista'),
    getTurnos
);

// Horarios libres de un médico para una fecha local (YYYY-MM-DD).
// La duración siempre surge del perfil del médico. El portal de pacientes
// reutiliza exactamente la misma consulta.
router.get(
    '/disponibilidad',
    autorizarRoles('admin', 'medico', 'recepcionista', 'paciente'),
    getDisponibilidad
);

// Catálogo de médicos activos de una especialidad activa para el portal
// de pacientes. La proyección excluye datos de contacto y administrativos.
router.get(
    '/medicos-disponibles',
    autorizarRoles('paciente'),
    getMedicosDisponibles
);

// Agenda del médico autenticado. El perfil se resuelve desde la relación
// explícita Usuario.medico; no se acepta un médico por parámetro.
router.get(
    '/mis-turnos',
    autorizarRoles('medico'),
    getMisTurnos
);

// Historial completo de turnos del paciente autenticado: pendientes,
// atendidos y cancelados. La identidad se resuelve exclusivamente desde
// el JWT; no se acepta un paciente por parámetro.
router.get(
    '/mi-historial',
    autorizarRoles('paciente'),
    getMiHistorialTurnos
);

// Alta del turno del paciente autenticado. El paciente se resuelve
// exclusivamente desde el JWT; el body no admite `paciente`.
router.post(
    '/mi-turno',
    autorizarRoles('paciente'),
    createMiTurno
);

// Alta de turnos: operación de recepción/administración.
// Ya no se usa la credencial estática `token123`: la autorización es por JWT.
router.post('/', autorizarRoles('admin', 'recepcionista'), createTurno);

// Cambio de estado del turno: lo usa el personal que gestiona la cola
// (recepción/administración) y el médico al marcar la atención.
router.patch(
    '/:id/estado',
    autorizarRoles('admin', 'medico', 'recepcionista'),
    actualizarEstadoTurno
);

// Cancelación (borrado lógico): operación de recepción/administración.
router.delete('/:id', autorizarRoles('admin', 'recepcionista'), deleteTurno);

export default router;
