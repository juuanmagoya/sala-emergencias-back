import { Router } from 'express';

import { login, loginPaciente } from '../controllers/auth.controller.js';
import limitadorLogin from '../middlewares/limitadorLogin.middleware.js';

const router = Router();

// El login está limitado por cantidad de intentos fallidos por IP.
// No existe registro público: las cuentas internas las crea únicamente
// un administrador desde /api/v1/usuarios.
router.post('/login', limitadorLogin, login);

// Login de pacientes: DNI + teléfono contra la ficha Paciente. No crea
// documentos en Usuario.
router.post('/paciente/login', limitadorLogin, loginPaciente);

export default router;
