import { Router } from 'express';

import autorizarRoles from '../../../middlewares/autorizarRoles.middleware';

import {
    getEspecialidades,
    createEspecialidad,
    updateEspecialidad,
    toggleActivoEspecialidad,
    deleteEspecialidadPermanente,
} from '../controllers/especialidad.controller';

const router = Router();

// Catálogo de especialidades: lectura para todo el personal autenticado
// (recepción asigna turnos por especialidad).
router.get(
    '/',
    autorizarRoles('admin', 'medico', 'recepcionista'),
    getEspecialidades
);

// Mantenimiento del catálogo: solo administración.
router.post('/', autorizarRoles('admin'), createEspecialidad);

router.put('/:id', autorizarRoles('admin'), updateEspecialidad);

router.patch(
    '/:id/toggle-estado',
    autorizarRoles('admin'),
    toggleActivoEspecialidad
);

router.delete(
    '/:id/permanente',
    autorizarRoles('admin'),
    deleteEspecialidadPermanente
);

export default router;
