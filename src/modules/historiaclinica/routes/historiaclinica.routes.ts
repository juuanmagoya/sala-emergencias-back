import { Router } from 'express';

import autorizarRoles from '../../../middlewares/autorizarRoles.middleware';

import {
    getHistoriasClinicas,
    getHistorialPaciente,
    getMiHistorial,
    getHistoriaClinicaById,
    createHistoriaClinica,
    updateHistoriaClinica,
} from '../controllers/historiaclinica.controller';

const router = Router();

// Lectura de historias clínicas: información sensible. Solo personal médico
// (autor del registro) y administración con fines de supervisión.
router.get(
    '/',
    autorizarRoles('admin', 'medico'),
    getHistoriasClinicas
);

// Historial propio del paciente autenticado: solo lectura y resuelto
// exclusivamente desde la identidad del JWT. Debe declararse antes de
// `/:id` para que la ruta estática no sea capturada como identificador.
router.get(
    '/mi-historial',
    autorizarRoles('paciente'),
    getMiHistorial
);

router.get(
    '/paciente/:pacienteId',
    autorizarRoles('admin', 'medico'),
    getHistorialPaciente
);

router.get(
    '/:id',
    autorizarRoles('admin', 'medico'),
    getHistoriaClinicaById
);

// Escritura clínica: personal médico y administración (superusuario).
// Recepción no accede a registros clínicos. La autoría clínica por perfil
// médico se resolverá en la etapa de atención médica.
router.post(
    '/',
    autorizarRoles('admin', 'medico'),
    createHistoriaClinica
);

router.put(
    '/:id',
    autorizarRoles('admin', 'medico'),
    updateHistoriaClinica
);

// No se expone DELETE: los registros clínicos no se eliminan.

export default router;
