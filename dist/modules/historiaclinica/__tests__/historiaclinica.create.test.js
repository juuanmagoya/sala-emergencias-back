"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("../../../app"));
const HistoriaClinica_1 = __importDefault(require("../models/HistoriaClinica"));
const Medico_1 = __importDefault(require("../../medico/models/Medico"));
const Paciente_1 = __importDefault(require("../../pacientes/models/Paciente"));
// ============================================================
// SERVIDOR DE PRUEBA
// ============================================================
const JWT_SECRET_PRUEBA = 'secreto-de-prueba-historias-clinicas';
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
const pacienteId = new mongoose_1.default.Types.ObjectId().toString();
const medicoId = new mongoose_1.default.Types.ObjectId().toString();
const crearToken = () => jsonwebtoken_1.default.sign({
    id: new mongoose_1.default.Types.ObjectId().toString(),
    email: 'medico@prueba.com',
    rol: 'medico',
}, JWT_SECRET_PRUEBA, { expiresIn: '1h' });
const solicitarCreacion = (cuerpo) => fetch(`${urlBase}/api/v1/historias-clinicas`, {
    method: 'POST',
    headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${crearToken()}`,
    },
    body: JSON.stringify(cuerpo),
});
const crearConsulta = (resultado) => {
    const consulta = Promise.resolve(resultado);
    consulta.populate = () => consulta;
    return consulta;
};
let datosCreados;
(0, node_test_1.beforeEach)(() => {
    datosCreados = undefined;
    node_test_1.mock.method(Paciente_1.default, 'exists', async () => ({ _id: pacienteId }));
    node_test_1.mock.method(Medico_1.default, 'exists', async () => ({ _id: medicoId }));
    node_test_1.mock.method(HistoriaClinica_1.default, 'create', async (datos) => {
        datosCreados = datos;
        return { _id: new mongoose_1.default.Types.ObjectId() };
    });
    node_test_1.mock.method(HistoriaClinica_1.default, 'findById', () => crearConsulta({
        ...datosCreados,
        paciente: { id: pacienteId, nombre: 'Paciente' },
        medico: { id: medicoId, nombre: 'Medico' },
    }));
});
// ============================================================
// CREACIÓN CON RECETARIO
// ============================================================
(0, node_test_1.test)('guarda un medicamento con todos sus campos en el recetario', async () => {
    const recetario = [
        {
            nombre: 'Ibuprofeno',
            dosis: '400 mg',
            frecuencia: 'Cada 8 horas',
            duracion: '5 días',
            indicaciones: 'Tomar después de las comidas',
        },
    ];
    const respuesta = await solicitarCreacion({
        paciente: pacienteId,
        medico: medicoId,
        observaciones: 'Control médico',
        recetario,
    });
    const cuerpo = await respuesta.json();
    strict_1.default.equal(respuesta.status, 201);
    strict_1.default.ok(datosCreados);
    strict_1.default.deepEqual(datosCreados.recetario, recetario);
    strict_1.default.deepEqual(cuerpo.data.recetario, recetario);
});
(0, node_test_1.test)('conserva medicamentos sin duración ni indicaciones', async () => {
    const recetario = [
        {
            nombre: 'Paracetamol',
            dosis: '500 mg',
            frecuencia: 'Cada 6 horas',
        },
    ];
    const respuesta = await solicitarCreacion({
        paciente: pacienteId,
        medico: medicoId,
        observaciones: 'Control médico',
        recetario,
    });
    const cuerpo = await respuesta.json();
    strict_1.default.equal(respuesta.status, 201);
    strict_1.default.ok(datosCreados);
    strict_1.default.deepEqual(datosCreados.recetario, recetario);
    strict_1.default.equal(cuerpo.data.recetario[0].duracion, undefined);
    strict_1.default.equal(cuerpo.data.recetario[0].indicaciones, undefined);
});
(0, node_test_1.test)('permite crear una historia clínica con recetario vacío', async () => {
    const respuesta = await solicitarCreacion({
        paciente: pacienteId,
        medico: medicoId,
        observaciones: 'Control médico',
        recetario: [],
    });
    const cuerpo = await respuesta.json();
    strict_1.default.equal(respuesta.status, 201);
    strict_1.default.ok(datosCreados);
    strict_1.default.deepEqual(datosCreados.recetario, []);
    strict_1.default.deepEqual(cuerpo.data.recetario, []);
});
(0, node_test_1.test)('permite crear una historia clínica sin enviar recetario', async () => {
    const respuesta = await solicitarCreacion({
        paciente: pacienteId,
        medico: medicoId,
        observaciones: 'Control médico',
    });
    const cuerpo = await respuesta.json();
    strict_1.default.equal(respuesta.status, 201);
    strict_1.default.ok(datosCreados);
    strict_1.default.deepEqual(datosCreados.recetario, []);
    strict_1.default.deepEqual(cuerpo.data.recetario, []);
});
