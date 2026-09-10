require('dotenv').config();

const express = require('express');
const cors = require('cors');

const connectDB = require('./src/config/database');

const app = express();

connectDB();

const auditMiddleware = require('./src/middlewares/auditoria.middleware');
const errorHandlerMiddleware = require('./src/middlewares/errorHandler.middleware');
const authMiddleware = require('./src/middlewares/auth.middleware');

const turnosRoutes = require('./src/routes/turnos.routes');
const pacientesRoutes = require('./src/routes/paciente.routes');
const recepcionRoutes = require('./src/routes/recepcion.routes');
const medicoRoutes = require('./src/routes/medico.routes');
const consultorioRoutes = require('./src/routes/consultorio.routes');
const historiaClinicaRoutes = require('./src/routes/historiaclinica.routes');
const especialidadRoutes = require('./src/routes/especialidad.routes');
const authRoutes = require('./src/routes/auth.routes');

app.use(cors({
    origin: 'http://localhost:5173',
}));

app.use(express.json());

app.use(auditMiddleware);

// ==========================================
// RUTAS PÚBLICAS
// ==========================================

app.use('/api/v1/auth', authRoutes);

// ==========================================
// AUTENTICACIÓN
// ==========================================

app.use(authMiddleware);

// ==========================================
// RUTAS PROTEGIDAS
// ==========================================

app.use('/api/v1/turnos', turnosRoutes);
app.use('/api/v1/pacientes', pacientesRoutes);
app.use('/api/v1/recepcion', recepcionRoutes);
app.use('/api/v1/medicos', medicoRoutes);
app.use('/api/v1/consultorios', consultorioRoutes);
app.use('/api/v1/historias-clinicas', historiaClinicaRoutes);
app.use('/api/v1/especialidades', especialidadRoutes);

// ==========================================
// MANEJO DE ERRORES
// ==========================================

app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`============SERVIDOR MUNICIPAL ACTIVO==========`);
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(`Entorno: ${process.env.ENTORNO || 'Local'} `);
    console.log(`===============================================`);
});