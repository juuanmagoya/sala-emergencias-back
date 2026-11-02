import { Router } from 'express';

import {
    registrar,
    login,
} from '../controllers/auth.controller.js';
import limitadorLogin from '../middlewares/limitadorLogin.middleware.js';

const router = Router();

// Registro público: siempre crea una cuenta de recepción.
router.post('/register', registrar);

// El login está limitado por cantidad de intentos fallidos por IP.
router.post('/login', limitadorLogin, login);

export default router;
