
import 'dotenv/config';

import express from 'express';
import cors from 'cors';

// ==========================================
// MIDDLEWARES
// ==========================================

import auditoriaMunicipal from './middlewares/auditoria.middleware.js';
import authMiddleware from './middlewares/auth.middleware.js';
import rutaNoEncontrada from './middlewares/errorHandler.middleware.js';

// ==========================================
// RUTAS
// ==========================================

// Auth migrado a TypeScript
import authRoutes from './routes/auth.routes.js';

// Módulos migrados a TypeScript
import especialidadRoutes from './modules/especialidad/routes/especialidad.routes.js';
import medicoRoutes from './modules/medico/routes/medico.routes.js';
import usuarioRoutes from './modules/usuario/routes/usuario.routes.js';
import pacientesRoutes from './modules/pacientes/routes/paciente.routes.js';
import consultorioRoutes from './modules/consultorio/routes/consultorio.routes.js';
import turnoRoutes from './modules/turnos/routes/turno.routes.js';
import recepcionRoutes from './modules/recepcion/routes/recepcion.routes.js';
import historiaClinicaRoutes from './modules/historiaclinica/routes/historiaclinica.routes.js';
import chatbotRoutes from './modules/chatbot/routes/chatbot.routes.js';
import registroPacienteRoutes from './modules/registroPaciente/routes/registroPaciente.routes.js';

const app = express();

// ==========================================
// CONFIGURACIÓN CORS
// ==========================================

const origenesPermitidos = [
    'http://localhost:5173',
    'https://sala-emergencias-front.vercel.app',
];

app.use(
    cors({
        origin: origenesPermitidos,
    })
);

app.use(express.json());

// ==========================================
// AUDITORÍA
// ==========================================

app.use(auditoriaMunicipal);

// ==========================================
// RUTAS PÚBLICAS
// ==========================================

app.use('/api/v1/auth', authRoutes);

app.use('/api/v1/registro-paciente', registroPacienteRoutes);

// ==========================================
// AUTENTICACIÓN
// ==========================================

app.use(authMiddleware);

// ==========================================
// RUTAS PROTEGIDAS
// ==========================================

app.use('/api/v1/medicos', medicoRoutes);

app.use('/api/v1/usuarios', usuarioRoutes);

app.use('/api/v1/especialidades', especialidadRoutes);

app.use('/api/v1/pacientes', pacientesRoutes);

app.use('/api/v1/consultorios', consultorioRoutes);

app.use('/api/v1/turnos', turnoRoutes);

app.use('/api/v1/recepcion', recepcionRoutes);

app.use('/api/v1/historias-clinicas', historiaClinicaRoutes);

app.use('/api/v1/chatbot', chatbotRoutes);

// ==========================================
// RUTA NO ENCONTRADA
// ==========================================

app.use(rutaNoEncontrada);

export default app;
