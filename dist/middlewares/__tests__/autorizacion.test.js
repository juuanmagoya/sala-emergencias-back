"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_middleware_1 = __importDefault(require("../auth.middleware"));
const autorizarRoles_middleware_1 = __importDefault(require("../autorizarRoles.middleware"));
const Paciente_1 = __importDefault(require("../../modules/pacientes/models/Paciente"));
// ============================================================
// SERVIDOR DE PRUEBA
// ============================================================
const JWT_SECRET_PRUEBA = 'secreto-de-prueba-autorizacion';
process.env.JWT_SECRET = JWT_SECRET_PRUEBA;
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Ruta de prueba: solo administración.
app.get('/solo-admin', auth_middleware_1.default, (0, autorizarRoles_middleware_1.default)('admin'), (_req, res) => res.status(200).json({ success: true }));
// Ruta de prueba: personal médico (la administración también accede).
app.get('/clinico', auth_middleware_1.default, (0, autorizarRoles_middleware_1.default)('medico', 'admin'), (_req, res) => res.status(200).json({ success: true }));
// Ruta de prueba: exclusiva de pacientes autenticados.
app.get('/solo-paciente', auth_middleware_1.default, (0, autorizarRoles_middleware_1.default)('paciente'), (_req, res) => res.status(200).json({ success: true }));
// Autorización montada sin autenticación previa.
app.get('/sin-autenticacion', (0, autorizarRoles_middleware_1.default)('admin'), (_req, res) => res.status(200).json({ success: true }));
const servidor = app.listen(0);
const { port } = servidor.address();
const urlBase = `http://127.0.0.1:${port}`;
(0, node_test_1.after)(() => {
    servidor.close();
});
// ============================================================
// HELPERS
// ============================================================
const crearToken = (rol, secreto = JWT_SECRET_PRUEBA) => jsonwebtoken_1.default.sign({
    id: '507f1f77bcf86cd799439011',
    email: 'prueba@sala.com',
    rol,
}, secreto, { expiresIn: '1h' });
const crearTokenInternoConTipo = (rol) => jsonwebtoken_1.default.sign({
    tipo: 'usuario',
    id: '507f1f77bcf86cd799439011',
    email: 'prueba@sala.com',
    rol,
}, JWT_SECRET_PRUEBA, { expiresIn: '1h' });
const crearTokenPaciente = (rol = 'paciente', id = '507f1f77bcf86cd799439012') => jsonwebtoken_1.default.sign({
    tipo: 'paciente',
    id,
    rol,
}, JWT_SECRET_PRUEBA, { expiresIn: '1h' });
const modeloPaciente = Paciente_1.default;
const existsOriginal = modeloPaciente.exists;
(0, node_test_1.afterEach)(() => {
    modeloPaciente.exists = existsOriginal;
});
const habilitarPacienteExistente = () => {
    modeloPaciente.exists = async () => ({
        _id: '507f1f77bcf86cd799439012',
    });
};
const solicitar = (ruta, token) => fetch(`${urlBase}${ruta}`, {
    headers: token
        ? { authorization: `Bearer ${token}` }
        : {},
});
const verificarFormatoEstandar = (cuerpo) => {
    strict_1.default.equal(typeof cuerpo.success, 'boolean');
    strict_1.default.equal(typeof cuerpo.timestamp, 'string');
    strict_1.default.equal(typeof cuerpo.message, 'string');
    strict_1.default.ok('total' in cuerpo);
    strict_1.default.ok('data' in cuerpo);
};
// ============================================================
// AUTENTICACIÓN
// ============================================================
(0, node_test_1.test)('rechaza con 401 una ruta protegida sin token', async () => {
    const respuesta = await solicitar('/solo-admin');
    const cuerpo = await respuesta.json();
    strict_1.default.equal(respuesta.status, 401);
    strict_1.default.equal(cuerpo.success, false);
    strict_1.default.equal(cuerpo.data, null);
    verificarFormatoEstandar(cuerpo);
});
(0, node_test_1.test)('rechaza con 401 un token inválido', async () => {
    const respuesta = await solicitar('/solo-admin', 'token-invalido');
    const cuerpo = await respuesta.json();
    strict_1.default.equal(respuesta.status, 401);
    strict_1.default.equal(cuerpo.success, false);
    verificarFormatoEstandar(cuerpo);
});
(0, node_test_1.test)('rechaza con 401 un token firmado con otro secreto', async () => {
    const tokenFalso = crearToken('admin', 'otro-secreto');
    const respuesta = await solicitar('/solo-admin', tokenFalso);
    strict_1.default.equal(respuesta.status, 401);
});
(0, node_test_1.test)('rechaza con 401 un token sin rol en el payload', async () => {
    const tokenSinRol = jsonwebtoken_1.default.sign({
        id: '507f1f77bcf86cd799439011',
        email: 'prueba@sala.com',
    }, JWT_SECRET_PRUEBA, { expiresIn: '1h' });
    const respuesta = await solicitar('/solo-admin', tokenSinRol);
    strict_1.default.equal(respuesta.status, 401);
});
// ============================================================
// AUTORIZACIÓN
// ============================================================
(0, node_test_1.test)('permite el acceso a un usuario con el rol autorizado', async () => {
    const respuesta = await solicitar('/solo-admin', crearToken('admin'));
    strict_1.default.equal(respuesta.status, 200);
});
(0, node_test_1.test)('rechaza con 403 a un usuario autenticado sin el rol requerido', async () => {
    const respuesta = await solicitar('/solo-admin', crearToken('recepcionista'));
    const cuerpo = await respuesta.json();
    strict_1.default.equal(respuesta.status, 403);
    strict_1.default.equal(cuerpo.success, false);
    strict_1.default.equal(cuerpo.data, null);
    verificarFormatoEstandar(cuerpo);
});
(0, node_test_1.test)('admite varios roles permitidos en una misma ruta', async () => {
    const respuestaMedico = await solicitar('/clinico', crearToken('medico'));
    const respuestaAdmin = await solicitar('/clinico', crearToken('admin'));
    const respuestaRecepcion = await solicitar('/clinico', crearToken('recepcionista'));
    strict_1.default.equal(respuestaMedico.status, 200);
    strict_1.default.equal(respuestaAdmin.status, 200);
    strict_1.default.equal(respuestaRecepcion.status, 403);
});
(0, node_test_1.test)('responde 401 si la autorización corre sin autenticación previa', async () => {
    const respuesta = await solicitar('/sin-autenticacion', crearToken('admin'));
    strict_1.default.equal(respuesta.status, 401);
});
// ============================================================
// IDENTIDAD DE PACIENTE
// ============================================================
(0, node_test_1.test)('permite el acceso a un paciente autenticado', async () => {
    habilitarPacienteExistente();
    const respuesta = await solicitar('/solo-paciente', crearTokenPaciente());
    strict_1.default.equal(respuesta.status, 200);
});
(0, node_test_1.test)('rechaza a un paciente si el documento ya no existe', async () => {
    modeloPaciente.exists = async () => null;
    const respuesta = await solicitar('/solo-paciente', crearTokenPaciente());
    strict_1.default.equal(respuesta.status, 401);
});
(0, node_test_1.test)('rechaza a un paciente en una ruta de administración', async () => {
    habilitarPacienteExistente();
    const respuesta = await solicitar('/solo-admin', crearTokenPaciente());
    strict_1.default.equal(respuesta.status, 403);
});
(0, node_test_1.test)('rechaza a un usuario interno en una ruta de paciente', async () => {
    const respuesta = await solicitar('/solo-paciente', crearToken('admin'));
    strict_1.default.equal(respuesta.status, 403);
});
(0, node_test_1.test)('rechaza un token de paciente con un rol elevado', async () => {
    habilitarPacienteExistente();
    const respuesta = await solicitar('/solo-admin', crearTokenPaciente('admin'));
    strict_1.default.equal(respuesta.status, 401);
});
(0, node_test_1.test)('rechaza un token interno que se declara paciente', async () => {
    const token = jsonwebtoken_1.default.sign({
        tipo: 'usuario',
        id: '507f1f77bcf86cd799439011',
        email: 'prueba@sala.com',
        rol: 'paciente',
    }, JWT_SECRET_PRUEBA, { expiresIn: '1h' });
    const respuesta = await solicitar('/solo-paciente', token);
    strict_1.default.equal(respuesta.status, 401);
});
(0, node_test_1.test)('sigue aceptando tokens internos nuevos con tipo usuario', async () => {
    const respuesta = await solicitar('/solo-admin', crearTokenInternoConTipo('admin'));
    strict_1.default.equal(respuesta.status, 200);
});
