
import { Router } from 'express';

import { registrarPaciente } from '../controllers/registroPaciente.controller.js';
import limitadorRegistro from '../middlewares/limitadorRegistro.middleware.js';

const router = Router();

router.post('/', limitadorRegistro, registrarPaciente);

export default router;
