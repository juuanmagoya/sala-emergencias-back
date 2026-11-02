import { Router } from 'express';

import autorizarRoles from '../../../middlewares/autorizarRoles.middleware';

import { registrarIngreso } from '../controllers/recepcion.controller';

const router = Router();

// Registrar ingreso de un paciente nuevo por recepción
// (crea el paciente y su turno dentro de una transacción).
// Solo recepción y administración.
router.post(
    '/',
    autorizarRoles('admin', 'recepcionista'),
    registrarIngreso
);

export default router;
