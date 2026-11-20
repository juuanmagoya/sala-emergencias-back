"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = __importDefault(require("../../app"));
const historiaclinica_service_1 = __importDefault(require("../../modules/historiaclinica/services/historiaclinica.service"));
const recepcion_service_1 = __importDefault(require("../../modules/recepcion/services/recepcion.service"));
const turno_service_1 = __importDefault(require("../../modules/turnos/services/turno.service"));
// ============================================================
// SERVIDOR REAL CON TODAS LAS RUTAS MONTADAS
// ============================================================
const JWT_SECRET_PRUEBA = 'secreto-de-prueba-permisos';
// auth.middleware lee el secreto en cada request, por lo que alcanza con
// definirlo después de importar la app.
process.env.JWT_SECRET = JWT_SECRET_PRUEBA;
const servidor = app_1.default.listen(0);
const { port } = servidor.address();
const urlBase = `http://127.0.0.1:${port}`;
(0, node_test_1.after)(() => {
    servidor.close();
});
// ============================================================
// HELPERS
// ============================================================
const crearToken = (rol) => jsonwebtoken_1.default.sign({
    id: '507f1f77bcf86cd799439011',
    email: 'prueba@sala.com',
    rol,
}, JWT_SECRET_PRUEBA, { expiresIn: '1h' });
const solicitar = (metodo, ruta, opciones = {}) => {
    const headers = {};
    if (opciones.token) {
        headers.authorization = `Bearer ${opciones.token}`;
    }
    if (opciones.encabezadoAuthorization) {
        headers.authorization = opciones.encabezadoAuthorization;
    }
    if (opciones.cuerpo !== undefined) {
        headers['content-type'] = 'application/json';
    }
    return fetch(`${urlBase}${ruta}`, {
        method: metodo,
        headers,
        body: opciones.cuerpo === undefined
            ? undefined
            : JSON.stringify(opciones.cuerpo),
    });
};
const leerCuerpo = async (respuesta) => (await respuesta.json());
const verificarFormatoEstandar = (cuerpo) => {
    strict_1.default.equal(typeof cuerpo.success, 'boolean');
    strict_1.default.equal(typeof cuerpo.timestamp, 'string');
    strict_1.default.equal(typeof cuerpo.message, 'string');
    strict_1.default.ok('total' in cuerpo);
    strict_1.default.ok('data' in cuerpo);
};
const turnos = turno_service_1.default;
const recepcion = recepcion_service_1.default;
const historias = historiaclinica_service_1.default;
const turnosOriginal = {
    createTurno: turnos.createTurno,
    deleteTurno: turnos.deleteTurno,
    getDisponibilidad: turnos.getDisponibilidad,
    getTurnosDelMedico: turnos.getTurnosDelMedico,
};
const recepcionOriginal = {
    registrarIngreso: recepcion.registrarIngreso,
};
const historiasOriginal = {
    getHistoriasClinicas: historias.getHistoriasClinicas,
};
(0, node_test_1.afterEach)(() => {
    turnos.createTurno = turnosOriginal.createTurno;
    turnos.deleteTurno = turnosOriginal.deleteTurno;
    turnos.getDisponibilidad = turnosOriginal.getDisponibilidad;
    turnos.getTurnosDelMedico = turnosOriginal.getTurnosDelMedico;
    recepcion.registrarIngreso = recepcionOriginal.registrarIngreso;
    historias.getHistoriasClinicas =
        historiasOriginal.getHistoriasClinicas;
});
// ============================================================
// AUTENTICACIÓN Y RUTAS PÚBLICAS
// ============================================================
(0, node_test_1.test)('una ruta protegida rechaza solicitudes sin token', async () => {
    const respuesta = await solicitar('GET', '/api/v1/medicos');
    const cuerpo = await leerCuerpo(respuesta);
    strict_1.default.equal(respuesta.status, 401);
    strict_1.default.equal(cuerpo.success, false);
    verificarFormatoEstandar(cuerpo);
});
(0, node_test_1.test)('una ruta protegida rechaza un JWT inválido', async () => {
    const respuesta = await solicitar('GET', '/api/v1/medicos', {
        token: 'token-invalido',
    });
    strict_1.default.equal(respuesta.status, 401);
});
(0, node_test_1.test)('el login público sigue funcionando y el registro público no existe', async () => {
    const loginSinPassword = await solicitar('POST', '/api/v1/auth/login', {
        cuerpo: { email: 'prueba@sala.com' },
    });
    const registroAnonimo = await solicitar('POST', '/api/v1/auth/register', { cuerpo: {} });
    const registroConAdmin = await solicitar('POST', '/api/v1/auth/register', { token: crearToken('admin'), cuerpo: {} });
    // El login llega al controller (400 de validación), no al middleware de auth.
    strict_1.default.equal(loginSinPassword.status, 400);
    // Sin token, el middleware global bloquea la solicitud (401).
    // Con un token válido, la ruta inexistente responde 404.
    // En ningún caso se crea una cuenta.
    strict_1.default.equal(registroAnonimo.status, 401);
    strict_1.default.equal(registroConAdmin.status, 404);
    verificarFormatoEstandar(await leerCuerpo(loginSinPassword));
});
// ============================================================
// RUTAS ADMINISTRATIVAS
// ============================================================
(0, node_test_1.test)('una ruta administrativa rechaza a médicos y recepcionistas', async () => {
    const respuestaMedico = await solicitar('POST', '/api/v1/medicos', { token: crearToken('medico'), cuerpo: {} });
    const respuestaRecepcion = await solicitar('POST', '/api/v1/medicos', { token: crearToken('recepcionista'), cuerpo: {} });
    strict_1.default.equal(respuestaMedico.status, 403);
    strict_1.default.equal(respuestaRecepcion.status, 403);
    const cuerpo = await leerCuerpo(respuestaMedico);
    strict_1.default.equal(cuerpo.success, false);
    strict_1.default.equal(cuerpo.data, null);
    verificarFormatoEstandar(cuerpo);
});
// ============================================================
// RECEPCIÓN
// ============================================================
(0, node_test_1.test)('las operaciones de recepción aplican los permisos definidos', async () => {
    let ingresos = 0;
    recepcion.registrarIngreso = async () => {
        ingresos += 1;
        return { id: 'turno-de-prueba' };
    };
    const respuestaRecepcion = await solicitar('POST', '/api/v1/recepcion', { token: crearToken('recepcionista'), cuerpo: {} });
    const respuestaAdmin = await solicitar('POST', '/api/v1/recepcion', { token: crearToken('admin'), cuerpo: {} });
    const respuestaMedico = await solicitar('POST', '/api/v1/recepcion', { token: crearToken('medico'), cuerpo: {} });
    strict_1.default.equal(respuestaRecepcion.status, 201);
    strict_1.default.equal(respuestaAdmin.status, 201);
    strict_1.default.equal(respuestaMedico.status, 403);
    strict_1.default.equal(ingresos, 2);
});
// ============================================================
// HISTORIAS CLÍNICAS
// ============================================================
(0, node_test_1.test)('las historias clínicas no son accesibles para recepción', async () => {
    historias.getHistoriasClinicas = async () => [];
    const respuestaRecepcion = await solicitar('GET', '/api/v1/historias-clinicas', { token: crearToken('recepcionista') });
    const respuestaMedico = await solicitar('GET', '/api/v1/historias-clinicas', { token: crearToken('medico') });
    strict_1.default.equal(respuestaRecepcion.status, 403);
    strict_1.default.equal(respuestaMedico.status, 200);
});
// ============================================================
// TURNOS Y MECANISMO HEREDADO token123
// ============================================================
(0, node_test_1.test)('la credencial heredada token123 no permite eludir la autorización', async () => {
    const respuesta = await solicitar('POST', '/api/v1/turnos', {
        encabezadoAuthorization: 'token123',
        cuerpo: {},
    });
    strict_1.default.equal(respuesta.status, 401);
    const cuerpo = await leerCuerpo(respuesta);
    strict_1.default.equal(cuerpo.success, false);
    verificarFormatoEstandar(cuerpo);
});
(0, node_test_1.test)('crear turnos exige JWT y el rol de recepción o administración', async () => {
    let turnosCreados = 0;
    turnos.createTurno = async () => {
        turnosCreados += 1;
        return { id: 'turno-de-prueba' };
    };
    const respuestaMedico = await solicitar('POST', '/api/v1/turnos', { token: crearToken('medico'), cuerpo: {} });
    const respuestaRecepcion = await solicitar('POST', '/api/v1/turnos', { token: crearToken('recepcionista'), cuerpo: {} });
    const respuestaAdmin = await solicitar('POST', '/api/v1/turnos', { token: crearToken('admin'), cuerpo: {} });
    strict_1.default.equal(respuestaMedico.status, 403);
    strict_1.default.equal(respuestaRecepcion.status, 201);
    strict_1.default.equal(respuestaAdmin.status, 201);
    strict_1.default.equal(turnosCreados, 2);
});
(0, node_test_1.test)('cancelar turnos está reservado a recepción y administración', async () => {
    turnos.deleteTurno = async (id) => ({ id });
    const ruta = '/api/v1/turnos/507f1f77bcf86cd799439011';
    const respuestaMedico = await solicitar('DELETE', ruta, {
        token: crearToken('medico'),
    });
    const respuestaRecepcion = await solicitar('DELETE', ruta, {
        token: crearToken('recepcionista'),
    });
    strict_1.default.equal(respuestaMedico.status, 403);
    strict_1.default.equal(respuestaRecepcion.status, 200);
});
(0, node_test_1.test)('la consulta de disponibilidad está disponible para los roles asistenciales', async () => {
    let consultas = 0;
    turnos.getDisponibilidad = async () => {
        consultas += 1;
        return { horarios: [] };
    };
    const ruta = '/api/v1/turnos/disponibilidad?medicoId=507f1f77bcf86cd799439013&fecha=2026-11-02';
    for (const rol of [
        'admin',
        'medico',
        'recepcionista',
    ]) {
        const respuesta = await solicitar('GET', ruta, {
            token: crearToken(rol),
        });
        strict_1.default.equal(respuesta.status, 200);
    }
    strict_1.default.equal(consultas, 3);
});
(0, node_test_1.test)('mis-turnos solo permite el rol médico y resuelve el perfil del token', async () => {
    let consultas = 0;
    turnos.getTurnosDelMedico = async (idUsuario) => {
        consultas += 1;
        strict_1.default.equal(idUsuario, '507f1f77bcf86cd799439011');
        return [];
    };
    const respuestaRecepcion = await solicitar('GET', '/api/v1/turnos/mis-turnos', { token: crearToken('recepcionista') });
    const respuestaAdmin = await solicitar('GET', '/api/v1/turnos/mis-turnos', { token: crearToken('admin') });
    const respuestaMedico = await solicitar('GET', '/api/v1/turnos/mis-turnos', { token: crearToken('medico') });
    strict_1.default.equal(respuestaRecepcion.status, 403);
    strict_1.default.equal(respuestaAdmin.status, 403);
    strict_1.default.equal(respuestaMedico.status, 200);
    strict_1.default.equal(consultas, 1);
});
