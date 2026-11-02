import { Router } from 'express';

import autorizarRoles from '../../../middlewares/autorizarRoles.middleware';

import {
    getConsultorios,
    createConsultorio,
    updateConsultorio,
    deleteConsultorio,
} from '../controllers/consultorio.controller.js';

const router = Router();

// Consulta de consultorios: información operativa necesaria para recepción
// y para el personal médico.
router.get(
    '/',
    autorizarRoles('admin', 'medico', 'recepcionista'),
    getConsultorios
);

// Altas, cambios y bajas de consultorios: solo administración.
router.post('/', autorizarRoles('admin'), createConsultorio);

router.put('/:id', autorizarRoles('admin'), updateConsultorio);

router.delete('/:id', autorizarRoles('admin'), deleteConsultorio);

export default router;
