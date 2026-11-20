"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app_1 = __importDefault(require("../../../app"));
const usuario_service_1 = __importDefault(require("../services/usuario.service"));
// ============================================================
// SERVIDOR DE PRUEBA
// ============================================================
const JWT_SECRET_PRUEBA = 'secreto-de-prueba-usuarios';
process.env.JWT_SECRET = JWT_SECRET_PRUEBA;
const servidor = app_1.default.listen(0);
const { port } = servidor.address();
const urlBase = `http://127.0.0.1:${port}`;
(0, node_test_1.after)(() => {
    servidor.close();
});
(0, node_test_1.afterEach)(() => {
    node_test_1.mock.restoreAll();
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
// ============================================================
// AUTENTICACIÓN Y AUTORIZACIÓN
// ============================================================
(0, node_test_1.test)('el CRUD de usuarios exige autenticación', async () => {
    const respuesta = await solicitar('GET', '/api/v1/usuarios');
    strict_1.default.equal(respuesta.status, 401);
});
(0, node_test_1.test)('el CRUD de usuarios está reservado a administración', async () => {
    const respuestaMedico = await solicitar('POST', '/api/v1/usuarios', {
        token: crearToken('medico'),
        cuerpo: {},
    });
    const respuestaRecepcion = await solicitar('GET', '/api/v1/usuarios', { token: crearToken('recepcionista') });
    strict_1.default.equal(respuestaMedico.status, 403);
    strict_1.default.equal(respuestaRecepcion.status, 403);
});
// ============================================================
// OPERACIONES ADMINISTRATIVAS
// ============================================================
(0, node_test_1.test)('un administrador puede crear y listar usuarios', async () => {
    const crearUsuarioMock = node_test_1.mock.method(usuario_service_1.default, 'createUsuario', async () => ({ id: 'usuario-de-prueba' }));
    node_test_1.mock.method(usuario_service_1.default, 'getUsuarios', async () => []);
    const respuestaCreacion = await solicitar('POST', '/api/v1/usuarios', {
        token: crearToken('admin'),
        cuerpo: {
            nombre: 'Recepción',
            email: 'recepcion@prueba.com',
            password: 'secreto123',
            rol: 'recepcionista',
        },
    });
    const respuestaListado = await solicitar('GET', '/api/v1/usuarios', { token: crearToken('admin') });
    strict_1.default.equal(respuestaCreacion.status, 201);
    strict_1.default.equal(respuestaListado.status, 200);
    strict_1.default.equal(crearUsuarioMock.mock.callCount(), 1);
});
(0, node_test_1.test)('un administrador puede consultar y desactivar un usuario', async () => {
    const id = '507f1f77bcf86cd799439012';
    let idConsultado;
    let idDesactivado;
    node_test_1.mock.method(usuario_service_1.default, 'getUsuarioById', async (usuarioId) => {
        idConsultado = usuarioId;
        return { id: usuarioId };
    });
    node_test_1.mock.method(usuario_service_1.default, 'desactivarUsuario', async (usuarioId) => {
        idDesactivado = usuarioId;
        return { id: usuarioId, activo: false };
    });
    const respuestaConsulta = await solicitar('GET', `/api/v1/usuarios/${id}`, { token: crearToken('admin') });
    const respuestaBaja = await solicitar('DELETE', `/api/v1/usuarios/${id}`, { token: crearToken('admin') });
    strict_1.default.equal(respuestaConsulta.status, 200);
    strict_1.default.equal(respuestaBaja.status, 200);
    strict_1.default.equal(idConsultado, id);
    strict_1.default.equal(idDesactivado, id);
});
