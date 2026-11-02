import { Router } from 'express';

import autorizarRoles from '../../../middlewares/autorizarRoles.middleware';

import {
    getHistoriasClinicas,
    getHistorialPaciente,
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
