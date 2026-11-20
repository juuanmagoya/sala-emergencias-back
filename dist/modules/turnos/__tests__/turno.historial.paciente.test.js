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
const Medico_1 = __importDefault(require("../../medico/models/Medico"));
const Paciente_1 = __importDefault(require("../../pacientes/models/Paciente"));
const Usuario_1 = __importDefault(require("../../usuario/models/Usuario"));
const Turno_1 = __importDefault(require("../models/Turno"));
const turno_service_1 = __importDefault(require("../services/turno.service"));
const turno_messages_1 = require("../constants/turno.messages");
// ============================================================
// CONFIGURACIÓN
// ============================================================
const JWT_SECRET_PRUEBA = 'secreto-de-prueba-historial-turnos';
const PACIENTE_ID = '507f1f77bcf86cd799439011';
const OTRO_PACIENTE_ID = '507f1f77bcf86cd799439099';
const ESPECIALIDAD_ID = '507f1f77bcf86cd799439012';
const MEDICO_ID = '507f1f77bcf86cd799439013';
const TURNO_ID = '507f1f77bcf86cd799439015';
const OTRO_TURNO_ID = '507f1f77bcf86cd799439016';
process.env.JWT_SECRET = JWT_SECRET_PRUEBA;
const servidor = app_1.default.listen(0);
const { port } = servidor.address();
const urlBase = `http://127.0.0.1:${port}`;
(0, node_test_1.after)(() => {
    servidor.close();
});
const proyectarDocumento = (documento, campos) => {
    const resultado = {};
    for (const campo of campos.split(/\s+/)) {
        if (campo === 'id') {
            continue;
        }
        // Una proyección por inclusión no agrega claves ausentes.
        if (campo in documento) {
            resultado[campo] = documento[campo];
        }
    }
    if ('id' in documento) {
        resultado.id = documento.id;
    }
    return resultado;
};
const crearConsulta = (documentos, registro) => {
    const resolver = () => documentos.map((documento) => {
        const resultado = {
            ...documento,
        };
        for (const populate of registro.populates) {
            const valor = resultado[populate.ruta];
            if (valor &&
                typeof valor === 'object' &&
                typeof populate.campos === 'string') {
                resultado[populate.ruta] = proyectarDocumento(valor, populate.campos);
            }
        }
        if (registro.seleccion) {
            return proyectarDocumento(resultado, registro.seleccion);
        }
        return resultado;
    });
    // La resolución ocurre en un microtask: para entonces el servicio
    // ya ejecutó select, populate y sort de forma sincrónica.
    const consulta = Promise.resolve().then(resolver);
    consulta.select = (campos) => {
        registro.seleccion = campos;
        return consulta;
    };
    consulta.sort = (orden) => {
        registro.orden = orden;
        return consulta;
    };
    consulta.populate = (ruta, campos) => {
        registro.populates.push({ ruta, campos });
        return consulta;
    };
    return consulta;
};
// ============================================================
// HELPERS DE DATOS
// ============================================================
let registro;
const prepararConsulta = (documentos) => {
    node_test_1.mock.method(Turno_1.default, 'find', (filtro) => {
        registro.filtro = filtro;
        return crearConsulta(documentos, registro);
    });
};
const crearTokenPaciente = (id) => jsonwebtoken_1.default.sign({ tipo: 'paciente', id, rol: 'paciente' }, JWT_SECRET_PRUEBA, { expiresIn: '1h' });
const crearTokenInterno = (rol) => jsonwebtoken_1.default.sign({
    tipo: 'usuario',
    id: new mongoose_1.default.Types.ObjectId().toString(),
    email: 'prueba@sala.com',
    rol,
}, JWT_SECRET_PRUEBA, { expiresIn: '1h' });
const solicitar = (metodo, ruta, opciones = {}) => {
    const headers = {};
    if (opciones.token) {
        headers.authorization = `Bearer ${opciones.token}`;
    }
    return fetch(`${urlBase}${ruta}`, { method: metodo, headers });
};
const leerCuerpo = async (respuesta) => (await respuesta.json());
const RUTA_HISTORIAL = '/api/v1/turnos/mi-historial';
(0, node_test_1.beforeEach)(() => {
    registro = { populates: [] };
    // El middleware de autenticación de pacientes valida que exista.
    node_test_1.mock.method(Paciente_1.default, 'exists', async () => ({
        _id: PACIENTE_ID,
    }));
});
(0, node_test_1.afterEach)(() => {
    node_test_1.mock.restoreAll();
});
// ============================================================
// SERVICIO: CONSULTA DEL HISTORIAL
// ============================================================
(0, node_test_1.test)('getHistorialDelPaciente filtra exclusivamente por el paciente autenticado', async () => {
    prepararConsulta([]);
    await turno_service_1.default.getHistorialDelPaciente(PACIENTE_ID);
    strict_1.default.deepEqual(registro.filtro, { paciente: PACIENTE_ID });
    strict_1.default.equal('activo' in registro.filtro, false);
    strict_1.default.equal('estado' in registro.filtro, false);
});
(0, node_test_1.test)('getHistorialDelPaciente ordena por fecha descendente y usa una proyección por lista blanca', async () => {
    prepararConsulta([]);
    await turno_service_1.default.getHistorialDelPaciente(PACIENTE_ID);
    strict_1.default.deepEqual(registro.orden, { fechaTurno: -1 });
    strict_1.default.equal(registro.seleccion, 'fechaTurno fechaFin estado observaciones especialidad medico');
});
(0, node_test_1.test)('getHistorialDelPaciente popula solo datos públicos de especialidad y médico', async () => {
    prepararConsulta([]);
    await turno_service_1.default.getHistorialDelPaciente(PACIENTE_ID);
    strict_1.default.deepEqual(registro.populates, [
        { ruta: 'especialidad', campos: 'nombre' },
        {
            ruta: 'medico',
            campos: 'nombre apellido matricula',
        },
    ]);
    strict_1.default.equal(registro.populates.some((populate) => populate.ruta === 'paciente'), false);
});
(0, node_test_1.test)('getHistorialDelPaciente devuelve pendientes, atendidos y cancelados', async () => {
    prepararConsulta([
        {
            id: TURNO_ID,
            fechaTurno: '2035-01-01T12:00:00.000Z',
            estado: 'pendiente',
        },
        {
            id: OTRO_TURNO_ID,
            fechaTurno: '2034-06-10T13:00:00.000Z',
            estado: 'atendido',
        },
        {
            id: '507f1f77bcf86cd799439017',
            fechaTurno: '2033-03-10T13:00:00.000Z',
            estado: 'cancelado',
        },
    ]);
    const resultado = (await turno_service_1.default.getHistorialDelPaciente(PACIENTE_ID));
    strict_1.default.equal(resultado.length, 3);
    strict_1.default.deepEqual(resultado.map((turno) => turno.estado), ['pendiente', 'atendido', 'cancelado']);
});
(0, node_test_1.test)('getHistorialDelPaciente incluye los turnos cancelados con activo false', async () => {
    prepararConsulta([
        {
            id: TURNO_ID,
            fechaTurno: '2034-06-10T13:00:00.000Z',
            estado: 'cancelado',
            activo: false,
        },
    ]);
    const resultado = (await turno_service_1.default.getHistorialDelPaciente(PACIENTE_ID));
    // El filtro no restringe `activo`: la baja lógica no oculta el turno.
    strict_1.default.deepEqual(registro.filtro, { paciente: PACIENTE_ID });
    strict_1.default.equal(resultado.length, 1);
    strict_1.default.equal(resultado[0].estado, 'cancelado');
});
(0, node_test_1.test)('getHistorialDelPaciente devuelve un arreglo vacío si el paciente no tiene turnos', async () => {
    prepararConsulta([]);
    const resultado = await turno_service_1.default.getHistorialDelPaciente(PACIENTE_ID);
    strict_1.default.deepEqual(resultado, []);
});
(0, node_test_1.test)('getHistorialDelPaciente rechaza un identificador inválido', async () => {
    await strict_1.default.rejects(turno_service_1.default.getHistorialDelPaciente('no-es-un-object-id'), (error) => error instanceof Error &&
        error.message ===
            turno_messages_1.MENSAJES_TURNO.PACIENTE_ID_INVALIDO);
});
(0, node_test_1.test)('getHistorialDelPaciente tolera referencias que ya no pueden resolverse', async () => {
    prepararConsulta([
        {
            id: TURNO_ID,
            fechaTurno: '2034-06-10T13:00:00.000Z',
            estado: 'atendido',
            especialidad: null,
            medico: null,
        },
    ]);
    const resultado = (await turno_service_1.default.getHistorialDelPaciente(PACIENTE_ID));
    strict_1.default.equal(resultado.length, 1);
    strict_1.default.equal(resultado[0].especialidad, null);
    strict_1.default.equal(resultado[0].medico, null);
});
(0, node_test_1.test)('getHistorialDelPaciente tolera documentos legacy con campos ausentes', async () => {
    prepararConsulta([
        {
            id: TURNO_ID,
            fechaTurno: '2020-01-06T12:00:00.000Z',
        },
    ]);
    const resultado = (await turno_service_1.default.getHistorialDelPaciente(PACIENTE_ID));
    strict_1.default.equal(resultado.length, 1);
    strict_1.default.equal('estado' in resultado[0], false);
    strict_1.default.equal('fechaFin' in resultado[0], false);
    strict_1.default.equal('medico' in resultado[0], false);
    strict_1.default.equal('especialidad' in resultado[0], false);
});
// ============================================================
// ENDPOINT: AUTORIZACIÓN
// ============================================================
(0, node_test_1.test)('GET /turnos/mi-historial rechaza solicitudes sin token', async () => {
    const respuesta = await solicitar('GET', RUTA_HISTORIAL);
    strict_1.default.equal(respuesta.status, 401);
});
(0, node_test_1.test)('GET /turnos/mi-historial rechaza un token inválido', async () => {
    const respuesta = await solicitar('GET', RUTA_HISTORIAL, {
        token: 'token-invalido',
    });
    strict_1.default.equal(respuesta.status, 401);
});
(0, node_test_1.test)('GET /turnos/mi-historial rechaza un token expirado', async () => {
    const tokenExpirado = jsonwebtoken_1.default.sign({ tipo: 'paciente', id: PACIENTE_ID, rol: 'paciente' }, JWT_SECRET_PRUEBA, { expiresIn: '-1s' });
    const respuesta = await solicitar('GET', RUTA_HISTORIAL, {
        token: tokenExpirado,
    });
    strict_1.default.equal(respuesta.status, 401);
});
(0, node_test_1.test)('GET /turnos/mi-historial rechaza un token de paciente inexistente', async () => {
    node_test_1.mock.method(Paciente_1.default, 'exists', async () => null);
    const respuesta = await solicitar('GET', RUTA_HISTORIAL, {
        token: crearTokenPaciente(PACIENTE_ID),
    });
    strict_1.default.equal(respuesta.status, 401);
});
(0, node_test_1.test)('GET /turnos/mi-historial rechaza a los roles internos', async () => {
    for (const rol of [
        'admin',
        'medico',
        'recepcionista',
    ]) {
        const respuesta = await solicitar('GET', RUTA_HISTORIAL, {
            token: crearTokenInterno(rol),
        });
        strict_1.default.equal(respuesta.status, 403, `El rol ${rol} no debería acceder`);
    }
});
// ============================================================
// ENDPOINT: CONTRATO DE RESPUESTA
// ============================================================
(0, node_test_1.test)('GET /turnos/mi-historial devuelve el historial del paciente autenticado', async () => {
    prepararConsulta([
        {
            id: TURNO_ID,
            paciente: {
                id: PACIENTE_ID,
                dni: '12345678',
                email: 'paciente@sala.com',
                telefono: { codigoArea: '11', numero: '12345678' },
                obraSocial: { nombre: 'OSDE' },
            },
            especialidad: {
                id: ESPECIALIDAD_ID,
                nombre: 'CARDIOLOGIA',
                descripcion: 'Corazón',
                codigo: 'CARD',
                activo: true,
                createdAt: '2024-01-01T00:00:00.000Z',
            },
            medico: {
                id: MEDICO_ID,
                nombre: 'ANA',
                apellido: 'PEREZ',
                matricula: '123456',
                email: 'ana@sala.com',
                telefono: { codigoArea: '11', numero: '87654321' },
                consultorios: ['consultorio-1'],
                horariosAtencion: [],
                activo: true,
            },
            fechaTurno: '2035-01-01T12:00:00.000Z',
            fechaFin: '2035-01-01T12:30:00.000Z',
            estado: 'pendiente',
            observaciones: 'control',
            activo: false,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
            __v: 0,
        },
        {
            id: OTRO_TURNO_ID,
            paciente: { id: PACIENTE_ID, dni: '12345678' },
            especialidad: {
                id: ESPECIALIDAD_ID,
                nombre: 'CARDIOLOGIA',
                activo: true,
            },
            medico: null,
            fechaTurno: '2034-06-10T13:00:00.000Z',
            fechaFin: '2034-06-10T13:30:00.000Z',
            estado: 'cancelado',
            activo: false,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
            __v: 0,
        },
    ]);
    const respuesta = await solicitar('GET', `${RUTA_HISTORIAL}?pacienteId=${OTRO_PACIENTE_ID}&paciente=${OTRO_PACIENTE_ID}`, { token: crearTokenPaciente(PACIENTE_ID) });
    const body = await leerCuerpo(respuesta);
    strict_1.default.equal(respuesta.status, 200);
    strict_1.default.equal(body.success, true);
    strict_1.default.equal(body.message, 'Historial de turnos obtenido exitosamente');
    strict_1.default.equal(body.total, 2);
    strict_1.default.equal(body.data.length, 2);
    // El identificador sale del JWT, no de los query params.
    strict_1.default.deepEqual(registro.filtro, { paciente: PACIENTE_ID });
});
(0, node_test_1.test)('GET /turnos/mi-historial ignora el identificador enviado por query', async () => {
    prepararConsulta([]);
    for (const query of [
        '',
        `?pacienteId=${OTRO_PACIENTE_ID}`,
        `?paciente=${OTRO_PACIENTE_ID}`,
    ]) {
        const respuesta = await solicitar('GET', `${RUTA_HISTORIAL}${query}`, { token: crearTokenPaciente(PACIENTE_ID) });
        strict_1.default.equal(respuesta.status, 200);
        strict_1.default.deepEqual(registro.filtro, { paciente: PACIENTE_ID }, `El query "${query}" no debería alterar el paciente`);
    }
});
(0, node_test_1.test)('GET /turnos/mi-historial responde un arreglo vacío sin turnos', async () => {
    prepararConsulta([]);
    const respuesta = await solicitar('GET', RUTA_HISTORIAL, {
        token: crearTokenPaciente(PACIENTE_ID),
    });
    const body = await leerCuerpo(respuesta);
    strict_1.default.equal(respuesta.status, 200);
    strict_1.default.equal(body.success, true);
    strict_1.default.equal(body.total, 0);
    strict_1.default.deepEqual(body.data, []);
});
(0, node_test_1.test)('GET /turnos/mi-historial no expone datos sensibles ni administrativos', async () => {
    prepararConsulta([
        {
            id: TURNO_ID,
            paciente: { id: PACIENTE_ID, dni: '12345678' },
            especialidad: {
                id: ESPECIALIDAD_ID,
                nombre: 'CARDIOLOGIA',
                descripcion: 'Corazón',
                codigo: 'CARD',
                activo: true,
            },
            medico: {
                id: MEDICO_ID,
                nombre: 'ANA',
                apellido: 'PEREZ',
                matricula: '123456',
                email: 'ana@sala.com',
                telefono: { codigoArea: '11', numero: '87654321' },
                consultorios: [],
                horariosAtencion: [],
            },
            fechaTurno: '2035-01-01T12:00:00.000Z',
            fechaFin: '2035-01-01T12:30:00.000Z',
            estado: 'pendiente',
            observaciones: 'control',
            activo: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
            __v: 0,
        },
    ]);
    const respuesta = await solicitar('GET', RUTA_HISTORIAL, {
        token: crearTokenPaciente(PACIENTE_ID),
    });
    const body = await leerCuerpo(respuesta);
    strict_1.default.equal(respuesta.status, 200);
    const [turno] = body.data;
    strict_1.default.deepEqual(Object.keys(turno).sort(), [
        'especialidad',
        'estado',
        'fechaFin',
        'fechaTurno',
        'id',
        'medico',
        'observaciones',
    ].sort());
    strict_1.default.deepEqual(Object.keys(turno.especialidad).sort(), ['id', 'nombre']);
    strict_1.default.deepEqual(Object.keys(turno.medico).sort(), ['apellido', 'id', 'matricula', 'nombre']);
    const serializado = JSON.stringify(body.data);
    for (const campo of [
        'paciente',
        'activo',
        'createdAt',
        'updatedAt',
        '__v',
        'email',
        'telefono',
        'consultorios',
        'horariosAtencion',
        'dni',
        'obraSocial',
        'descripcion',
        'codigo',
    ]) {
        strict_1.default.equal(serializado.includes(`"${campo}"`), false, `La respuesta no debería exponer "${campo}"`);
    }
});
(0, node_test_1.test)('GET /turnos/mi-historial no permite almacenar la respuesta en caché', async () => {
    prepararConsulta([]);
    const respuesta = await solicitar('GET', RUTA_HISTORIAL, {
        token: crearTokenPaciente(PACIENTE_ID),
    });
    strict_1.default.equal(respuesta.status, 200);
    strict_1.default.equal(respuesta.headers.get('cache-control'), 'no-store');
});
// ============================================================
// REGRESIÓN: AGENDA DEL MÉDICO
// ============================================================
(0, node_test_1.test)('GET /turnos/mis-turnos sigue disponible para el médico', async () => {
    node_test_1.mock.method(Usuario_1.default, 'findById', async () => ({
        rol: 'medico',
        medico: new mongoose_1.default.Types.ObjectId(MEDICO_ID),
    }));
    node_test_1.mock.method(Medico_1.default, 'findById', async () => ({
        _id: new mongoose_1.default.Types.ObjectId(MEDICO_ID),
        nombre: 'ANA',
        apellido: 'PEREZ',
        matricula: '123456',
        especialidad: new mongoose_1.default.Types.ObjectId(ESPECIALIDAD_ID),
        duracionTurno: 30,
        activo: true,
        horariosAtencion: [],
    }));
    prepararConsulta([]);
    const respuesta = await solicitar('GET', '/api/v1/turnos/mis-turnos', { token: crearTokenInterno('medico') });
    strict_1.default.equal(respuesta.status, 200);
});
(0, node_test_1.test)('GET /turnos/mis-turnos sigue restringido a los demás roles', async () => {
    for (const rol of [
        'admin',
        'recepcionista',
    ]) {
        const respuesta = await solicitar('GET', '/api/v1/turnos/mis-turnos', { token: crearTokenInterno(rol) });
        strict_1.default.equal(respuesta.status, 403, `El rol ${rol} no debería acceder`);
    }
    const respuestaPaciente = await solicitar('GET', '/api/v1/turnos/mis-turnos', { token: crearTokenPaciente(PACIENTE_ID) });
    strict_1.default.equal(respuestaPaciente.status, 403);
});
