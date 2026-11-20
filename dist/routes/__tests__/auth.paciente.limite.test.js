"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const Paciente_1 = __importDefault(require("../../modules/pacientes/models/Paciente"));
// ============================================================
// SERVIDOR REAL CON EL LIMITADOR DE LOGIN
// ============================================================
const JWT_SECRET_PRUEBA = 'secreto-de-prueba-paciente-limite';
process.env.JWT_SECRET = JWT_SECRET_PRUEBA;
process.env.LOGIN_RATE_LIMIT_MAX = '5';
process.env.LOGIN_RATE_LIMIT_WINDOW_MS = '60000';
// Importación diferida: el limitador lee el entorno al cargarse.
const app = require('../../app').default;
const servidor = app.listen(0);
const { port } = servidor.address();
const urlBase = `http://127.0.0.1:${port}`;
(0, node_test_1.after)(() => {
    servidor.close();
});
const crearConsulta = (resultado) => {
    const consulta = Promise.resolve(resultado);
    consulta.select = () => consulta;
    consulta.limit = () => consulta;
    return consulta;
};
const modeloPaciente = Paciente_1.default;
modeloPaciente.find = () => crearConsulta([]);
const intentarLoginPaciente = () => fetch(`${urlBase}/api/v1/auth/paciente/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
        dni: '30123456',
        telefono: '3777-1234567',
    }),
});
// ============================================================
// LÍMITE DE INTENTOS
// ============================================================
(0, node_test_1.test)('el login de pacientes aplica el limitador de intentos', async () => {
    const estados = [];
    for (let intento = 0; intento < 6; intento += 1) {
        const respuesta = await intentarLoginPaciente();
        estados.push(respuesta.status);
        if (intento === 5) {
            const cuerpo = (await respuesta.json());
            strict_1.default.equal(cuerpo.success, false);
            strict_1.default.equal(cuerpo.data, null);
            strict_1.default.equal(typeof cuerpo.timestamp, 'string');
            strict_1.default.match(String(cuerpo.message), /Demasiados intentos/);
        }
    }
    strict_1.default.deepEqual(estados, [401, 401, 401, 401, 401, 429]);
});
