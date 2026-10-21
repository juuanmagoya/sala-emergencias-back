import { Router } from 'express';

import { registrarIngreso } from '../controllers/recepcion.controller';

const router = Router();

// Registrar ingreso de un paciente nuevo por recepción
// (crea el paciente y su turno dentro de una transacción)
router.post('/', registrarIngreso);

export default router;
