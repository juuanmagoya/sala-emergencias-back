import { Router } from 'express';

import autorizarRoles from '../../../middlewares/autorizarRoles.middleware';

import {
    getMedicos,
    createMedico,
    updateMedico,
    toggleActivoMedico,
    deleteMedicoPermanente,
} from '../controllers/medico.controller';

const router = Router();

// Lectura: directorio interno de profesionales (sin datos clínicos).
// Recepción lo necesita para orientar turnos; el personal médico, para consultar
// el plantel. La administración conserva el acceso completo.
router.get(
    '/',
    autorizarRoles('admin', 'medico', 'recepcionista'),
    getMedicos
);

// Alta y modificaciones del plantel: solo administración.
router.post('/', autorizarRoles('admin'), createMedico);

router.put('/:id', autorizarRoles('admin'), updateMedico);

router.patch(
    '/:id/toggle-estado',
    autorizarRoles('admin'),
    toggleActivoMedico
);

router.delete(
    '/:id/permanente',
    autorizarRoles('admin'),
    deleteMedicoPermanente
);

export default router;
