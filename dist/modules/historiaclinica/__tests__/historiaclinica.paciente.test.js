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
const historiaclinica_service_1 = __importDefault(require("../services/historiaclinica.service"));
const HistoriaClinica_1 = __importDefault(require("../models/HistoriaClinica"));
const Paciente_1 = __importDefault(require("../../pacientes/models/Paciente"));
// ============================================================
// SERVIDOR DE PRUEBA
// ============================================================
const JWT_SECRET_PRUEBA = 'secreto-de-prueba-mi-historial';
process.env.JWT_SECRET = JWT_SECRET_PRUEBA;
const servidor = app_1.default.listen(0);
const { port } = servidor.address();
const urlBase = `http://127.0.0.1:${port}`;
(0, node_test_1.after)(() => {
    servidor.close();
});
const crearConsulta = (documentos, registro) => {
    const consulta = Promise.resolve(documentos);
    consulta.populate = (ruta, campos) => {
        registro.populates.push({ ruta, campos });
        return consulta;
    };
    consulta.sort = (orden) => {
        registro.orden = orden;
        return consulta;
    };
    consulta.select = (campos) => {
        registro.seleccion = campos;
        return consulta;
    };
    return consulta;
};
let idPaciente;
let pacienteExiste;
let registro;
let historias;
(0, node_test_1.beforeEach)(() => {
    idPaciente = new mongoose_1.default.Types.ObjectId().toString();
    pacienteExiste = { _id: idPaciente };
    registro = { populates: [] };
    historias = [];
    node_test_1.mock.method(Paciente_1.default, 'exists', async () => pacienteExiste);
    node_test_1.mock.method(HistoriaClinica_1.default, 'find', (filtro) => {
        registro.filtro = filtro;
        return crearConsulta(historias, registro);
    });
});
(0, node_test_1.afterEach)(() => {
    node_test_1.mock.restoreAll();
});
const crearTokenPaciente = (id) => jsonwebtoken_1.default.sign({ tipo: 'paciente', id, rol: 'paciente' }, JWT_SECRET_PRUEBA, { expiresIn: '1h' });
const crearTokenInterno = (rol) => jsonwebtoken_1.default.sign({
    tipo: 'usuario',
    id: new mongoose_1.default.Types.ObjectId().toString(),
    email: 'prueba@sala.com',
    rol,
}, JWT_SECRET_PRUEBA, { expiresIn: '1h' });
const solicitar = (metodo, ruta, token) => {
    const headers = {};
    if (token) {
        headers.authorization = `Bearer ${token}`;
    }
    return fetch(`${urlBase}${ruta}`, { method: metodo, headers });
};
const leerCuerpo = async (respuesta) => (await respuesta.json());
const crearHistoriaSimulada = () => ({
    id: 'historia-1',
    fechaAtencion: '2026-11-01T13:30:00.000Z',
    observaciones: 'Control de presión arterial',
    recetario: [
        {
            nombre: 'Enalapril',
            dosis: '10 mg',
            frecuencia: 'Cada 12 horas',
        },
    ],
    medico: {
        id: 'medico-1',
        nombre: 'ANA',
        apellido: 'PEREZ',
        matricula: '123456',
    },
});
// ============================================================
// SERVICIO: CONSULTA COMPARTIDA Y PROYECCIÓN
// ============================================================
(0, node_test_1.test)('getMiHistorial usa la consulta compartida y limita los campos', async () => {
    await historiaclinica_service_1.default.getMiHistorial(idPaciente);
    strict_1.default.deepEqual(registro.filtro, { paciente: idPaciente });
    strict_1.default.deepEqual(registro.populates, [
        { ruta: 'medico', campos: 'nombre apellido matricula' },
    ]);
    strict_1.default.deepEqual(registro.orden, { fechaAtencion: -1 });
    strict_1.default.equal(registro.seleccion, 'fechaAtencion observaciones recetario medico');
});
(0, node_test_1.test)('getMiHistorial no popula el documento del paciente', async () => {
    await historiaclinica_service_1.default.getMiHistorial(idPaciente);
    strict_1.default.equal(registro.populates.some((populate) => populate.ruta === 'paciente'), false);
});
(0, node_test_1.test)('getHistorialPaciente conserva su proyección administrativa', async () => {
    await historiaclinica_service_1.default.getHistorialPaciente(idPaciente);
    strict_1.default.deepEqual(registro.populates, [
        { ruta: 'medico', campos: 'nombre apellido matricula' },
        { ruta: 'paciente', campos: 'nombre dni' },
    ]);
    strict_1.default.equal(registro.seleccion, undefined);
});
(0, node_test_1.test)('getMiHistorial rechaza un ID de paciente inválido', async () => {
    await strict_1.default.rejects(historiaclinica_service_1.default.getMiHistorial('id-invalido'), /El ID del paciente no es válido/);
});
(0, node_test_1.test)('getMiHistorial rechaza un paciente inexistente', async () => {
    pacienteExiste = null;
    await strict_1.default.rejects(historiaclinica_service_1.default.getMiHistorial(idPaciente), /Paciente no encontrado/);
});
// ============================================================
// ENDPOINT: PACIENTE AUTENTICADO
// ============================================================
(0, node_test_1.test)('un paciente autenticado consulta su propio historial', async () => {
    const historia = crearHistoriaSimulada();
    historias = [historia];
    const respuesta = await solicitar('GET', '/api/v1/historias-clinicas/mi-historial', crearTokenPaciente(idPaciente));
    const cuerpo = await leerCuerpo(respuesta);
    const datos = cuerpo.data;
    strict_1.default.equal(respuesta.status, 200);
    strict_1.default.equal(cuerpo.success, true);
    strict_1.default.equal(cuerpo.message, 'Historial clínico obtenido exitosamente');
    strict_1.default.equal(cuerpo.total, 1);
    strict_1.default.equal(datos.length, 1);
    const devuelta = datos[0];
    strict_1.default.deepEqual(Object.keys(devuelta).sort(), [
        'fechaAtencion',
        'id',
        'medico',
        'observaciones',
        'recetario',
    ].sort());
    strict_1.default.equal(devuelta.id, historia.id);
    strict_1.default.equal(devuelta.fechaAtencion, historia.fechaAtencion);
    strict_1.default.equal(devuelta.observaciones, historia.observaciones);
    strict_1.default.deepEqual(devuelta.recetario, historia.recetario);
    strict_1.default.deepEqual(devuelta.medico, historia.medico);
    strict_1.default.equal('paciente' in devuelta, false);
    strict_1.default.equal('dni' in devuelta, false);
    strict_1.default.equal('telefono' in devuelta, false);
    strict_1.default.equal('email' in devuelta, false);
    strict_1.default.equal('createdAt' in devuelta, false);
    strict_1.default.equal('updatedAt' in devuelta, false);
    strict_1.default.equal('__v' in devuelta, false);
    // La consulta se resuelve con el ID del token y la proyección segura.
    strict_1.default.deepEqual(registro.filtro, { paciente: idPaciente });
    strict_1.default.deepEqual(registro.populates, [
        { ruta: 'medico', campos: 'nombre apellido matricula' },
    ]);
    strict_1.default.deepEqual(registro.orden, { fechaAtencion: -1 });
    strict_1.default.equal(registro.seleccion, 'fechaAtencion observaciones recetario medico');
});
(0, node_test_1.test)('el paciente no puede elegir otro paciente desde query', async () => {
    const otroPaciente = new mongoose_1.default.Types.ObjectId().toString();
    const respuesta = await solicitar('GET', `/api/v1/historias-clinicas/mi-historial?pacienteId=${otroPaciente}&paciente=${otroPaciente}`, crearTokenPaciente(idPaciente));
    strict_1.default.equal(respuesta.status, 200);
    strict_1.default.deepEqual(registro.filtro, { paciente: idPaciente });
});
(0, node_test_1.test)('una solicitud sin token no accede al historial', async () => {
    const respuesta = await solicitar('GET', '/api/v1/historias-clinicas/mi-historial');
    strict_1.default.equal(respuesta.status, 401);
});
(0, node_test_1.test)('los roles internos no acceden al historial del paciente', async () => {
    for (const rol of ['admin', 'medico', 'recepcionista']) {
        const respuesta = await solicitar('GET', '/api/v1/historias-clinicas/mi-historial', crearTokenInterno(rol));
        strict_1.default.equal(respuesta.status, 403, `Rol inesperado: ${rol}`);
    }
});
(0, node_test_1.test)('devuelve una colección vacía si el paciente no tiene historias', async () => {
    historias = [];
    const respuesta = await solicitar('GET', '/api/v1/historias-clinicas/mi-historial', crearTokenPaciente(idPaciente));
    const cuerpo = await leerCuerpo(respuesta);
    strict_1.default.equal(respuesta.status, 200);
    strict_1.default.equal(cuerpo.success, true);
    strict_1.default.equal(cuerpo.total, 0);
    strict_1.default.deepEqual(cuerpo.data, []);
});
(0, node_test_1.test)('la ruta estática no es capturada por GET /:id', async () => {
    const respuestaPaciente = await solicitar('GET', '/api/v1/historias-clinicas/mi-historial', crearTokenPaciente(idPaciente));
    const respuestaDinamica = await solicitar('GET', `/api/v1/historias-clinicas/${new mongoose_1.default.Types.ObjectId().toString()}`, crearTokenPaciente(idPaciente));
    strict_1.default.equal(respuestaPaciente.status, 200);
    strict_1.default.equal(respuestaDinamica.status, 403);
});
(0, node_test_1.test)('el paciente no accede a las rutas clínicas administrativas', async () => {
    const token = crearTokenPaciente(idPaciente);
    const otroPaciente = new mongoose_1.default.Types.ObjectId().toString();
    const historiaId = new mongoose_1.default.Types.ObjectId().toString();
    const rutas = [
        '/api/v1/historias-clinicas',
        `/api/v1/historias-clinicas/paciente/${otroPaciente}`,
        `/api/v1/historias-clinicas/${historiaId}`,
    ];
    for (const ruta of rutas) {
        const respuesta = await solicitar('GET', ruta, token);
        strict_1.default.equal(respuesta.status, 403, `Ruta inesperada: ${ruta}`);
    }
});
(0, node_test_1.test)('el paciente no puede crear ni modificar historias clínicas', async () => {
    const token = crearTokenPaciente(idPaciente);
    const headers = {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
    };
    const respuestaPost = await fetch(`${urlBase}/api/v1/historias-clinicas`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
    });
    const respuestaPut = await fetch(`${urlBase}/api/v1/historias-clinicas/${new mongoose_1.default.Types.ObjectId().toString()}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({}),
    });
    strict_1.default.equal(respuestaPost.status, 403);
    strict_1.default.equal(respuestaPut.status, 403);
});
// ============================================================
// REGRESIONES
// ============================================================
(0, node_test_1.test)('las rutas existentes de lectura siguen disponibles para admin y médico', async () => {
    const respuestaAdmin = await solicitar('GET', '/api/v1/historias-clinicas', crearTokenInterno('admin'));
    const respuestaMedico = await solicitar('GET', '/api/v1/historias-clinicas', crearTokenInterno('medico'));
    const respuestaRecepcion = await solicitar('GET', '/api/v1/historias-clinicas', crearTokenInterno('recepcionista'));
    strict_1.default.equal(respuestaAdmin.status, 200);
    strict_1.default.equal(respuestaMedico.status, 200);
    strict_1.default.equal(respuestaRecepcion.status, 403);
});
