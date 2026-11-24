
import { Router } from 'express';

import {
    login,
    loginPaciente,
    verificarCodigoPaciente,
} from '../controllers/auth.controller.js';

import limitadorLogin from '../middlewares/limitadorLogin.middleware.js';

import {
    limitadorSolicitarOtp,
    limitadorVerificarOtp,
} from '../middlewares/limitadorOtp.middleware.js';

const router = Router();

// Login interno: conserva su limitador original.
router.post('/login', limitadorLogin, login);

// Pacientes: solicitar código OTP.
router.post(
    '/paciente/login',
    limitadorSolicitarOtp,
    loginPaciente
);

// Pacientes: verificar código OTP.
router.post(
    '/paciente/verificar',
    limitadorVerificarOtp,
    verificarCodigoPaciente
);

export default router;
