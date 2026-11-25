
import { Router } from 'express';

import autorizarRoles from '../../../middlewares/autorizarRoles.middleware';

import { consultarChatbot } from '../controllers/chatbot.controller';

const router = Router();

// Consulta del chatbot: exclusiva para pacientes autenticados.
router.post(
    '/consultar',
    autorizarRoles('paciente'),
    consultarChatbot
);

export default router;
