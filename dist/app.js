"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// ==========================================
// MIDDLEWARES
// ==========================================
const auditoria_middleware_js_1 = __importDefault(require("./middlewares/auditoria.middleware.js"));
const auth_middleware_js_1 = __importDefault(require("./middlewares/auth.middleware.js"));
const errorHandler_middleware_js_1 = __importDefault(require("./middlewares/errorHandler.middleware.js"));
// ==========================================
// RUTAS
// ==========================================
// Auth migrado a TypeScript
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
// Módulos migrados a TypeScript
const especialidad_routes_js_1 = __importDefault(require("./modules/especialidad/routes/especialidad.routes.js"));
const medico_routes_js_1 = __importDefault(require("./modules/medico/routes/medico.routes.js"));
const usuario_routes_js_1 = __importDefault(require("./modules/usuario/routes/usuario.routes.js"));
const paciente_routes_js_1 = __importDefault(require("./modules/pacientes/routes/paciente.routes.js"));
const consultorio_routes_js_1 = __importDefault(require("./modules/consultorio/routes/consultorio.routes.js"));
const turno_routes_js_1 = __importDefault(require("./modules/turnos/routes/turno.routes.js"));
const recepcion_routes_js_1 = __importDefault(require("./modules/recepcion/routes/recepcion.routes.js"));
const historiaclinica_routes_js_1 = __importDefault(require("./modules/historiaclinica/routes/historiaclinica.routes.js"));
const app = (0, express_1.default)();
// ==========================================
// CONFIGURACIÓN CORS
// ==========================================
const origenesPermitidos = [
    'http://localhost:5173',
    'https://sala-emergencias-front.vercel.app',
];
app.use((0, cors_1.default)({
    origin: origenesPermitidos,
}));
app.use(express_1.default.json());
// ==========================================
// AUDITORÍA
// ==========================================
app.use(auditoria_middleware_js_1.default);
// ==========================================
// RUTAS PÚBLICAS
// ==========================================
app.use('/api/v1/auth', auth_routes_js_1.default);
// ==========================================
// AUTENTICACIÓN
// ==========================================
app.use(auth_middleware_js_1.default);
// ==========================================
// RUTAS PROTEGIDAS
// ==========================================
// Módulos migrados
app.use('/api/v1/medicos', medico_routes_js_1.default);
app.use('/api/v1/usuarios', usuario_routes_js_1.default);
app.use('/api/v1/especialidades', especialidad_routes_js_1.default);
app.use('/api/v1/pacientes', paciente_routes_js_1.default);
app.use('/api/v1/consultorios', consultorio_routes_js_1.default);
app.use('/api/v1/turnos', turno_routes_js_1.default);
app.use('/api/v1/recepcion', recepcion_routes_js_1.default);
app.use('/api/v1/historias-clinicas', historiaclinica_routes_js_1.default);
// ==========================================
// RUTA NO ENCONTRADA
// ==========================================
app.use(errorHandler_middleware_js_1.default);
exports.default = app;
