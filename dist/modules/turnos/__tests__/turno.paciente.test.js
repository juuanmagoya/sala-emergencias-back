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
const Especialidad_1 = __importDefault(require("../../especialidad/models/Especialidad"));
const especialidad_service_1 = __importDefault(require("../../especialidad/services/especialidad.service"));
const Medico_1 = __importDefault(require("../../medico/models/Medico"));
const medico_service_1 = __importDefault(require("../../medico/services/medico.service"));
const Paciente_1 = __importDefault(require("../../pacientes/models/Paciente"));
const Turno_1 = __importDefault(require("../models/Turno"));
const turno_service_1 = __importDefault(require("../services/turno.service"));
const disponibilidad_service_1 = require("../services/disponibilidad.service");
const turno_messages_1 = require("../constants/turno.messages");
// ============================================================
// CONFIGURACIÓN
// ============================================================
const ZONA = 'America/Argentina/Buenos_Aires';
const JWT_SECRET_PRUEBA = 'secreto-de-prueba-turno-paciente';
const PACIENTE_ID = '507f1f77bcf86cd799439011';
const OTRO_PACIENTE_ID = '507f1f77bcf86cd799439099';
const ESPECIALIDAD_ID = '507f1f77bcf86cd799439012';
const MEDICO_ID = '507f1f77bcf86cd799439013';
const TURNO_ID = '507f1f77bcf86cd799439015';
// 2035-01-01 es lunes. Se usa una fecha lejana para que los tests de
// creación no dependan del reloj real del entorno.
const FECHA_BASE = '2035-01-01';
const FECHA_VALIDA = `${FECHA_BASE}T09:00`;
const AHORA = new Date(`${FECHA_BASE}T03:00:00.000Z`);
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
const fechaLocal = (hora) => new Date(`${FECHA_BASE}T${hora}:00.000-03:00`);
const crearMedico = (overrides = {}) => ({
    _id: new mongoose_1.default.Types.ObjectId(MEDICO_ID),
    nombre: 'ANA',
    apellido: 'PEREZ',
    matricula: '123456',
    especialidades: [new mongoose_1.default.Types.ObjectId(ESPECIALIDAD_ID)],
    duracionTurno: 30,
    activo: true,
    horariosAtencion: [
        { dia: 'LUNES', horaInicio: '08:00', horaFin: '12:00' },
        { dia: 'LUNES', horaInicio: '16:00', horaFin: '20:00' },
    ],
    ...overrides,
});
const crearDatosPaciente = (overrides = {}) => ({
    especialidad: ESPECIALIDAD_ID,
    medico: MEDICO_ID,
    fechaTurno: FECHA_VALIDA,
    observaciones: '  control  ',
    ...overrides,
});
const crearConsulta = (resultado, registro) => {
    const consulta = Promise.resolve(resultado);
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
    consulta.session = () => consulta;
    return consulta;
};
const turnos = turno_service_1.default;
const especialidades = especialidad_service_1.default;
const medicos = medico_service_1.default;
const turnosOriginal = {
    createTurnoParaPaciente: turnos.createTurnoParaPaciente,
    createTurno: turnos.createTurno,
    getDisponibilidad: turnos.getDisponibilidad,
};
const especialidadesOriginal = {
    getEspecialidadesDisponibles: especialidades.getEspecialidadesDisponibles,
};
const medicosOriginal = {
    getMedicosDisponibles: medicos.getMedicosDisponibles,
};
let registro;
let datosCreados;
const prepararDependencias = (medico = crearMedico()) => {
    node_test_1.mock.method(Paciente_1.default, 'exists', async () => ({
        _id: PACIENTE_ID,
    }));
    node_test_1.mock.method(Especialidad_1.default, 'exists', async () => ({ _id: ESPECIALIDAD_ID }));
    node_test_1.mock.method(Medico_1.default, 'findById', async () => medico);
    node_test_1.mock.method(Turno_1.default, 'find', async () => []);
};
const prepararCreacion = () => {
    node_test_1.mock.method(Turno_1.default, 'create', async (datos) => {
        datosCreados = datos;
        return {
            _id: new mongoose_1.default.Types.ObjectId(TURNO_ID),
            ...datos,
        };
    });
    const turnoCompleto = {
        id: TURNO_ID,
        fechaTurno: fechaLocal('09:00'),
        fechaFin: fechaLocal('09:30'),
        estado: 'pendiente',
        observaciones: 'control',
        especialidad: {
            id: ESPECIALIDAD_ID,
            nombre: 'CARDIOLOGIA',
        },
        medico: {
            id: MEDICO_ID,
            nombre: 'ANA',
            apellido: 'PEREZ',
            matricula: '123456',
        },
    };
    node_test_1.mock.method(Turno_1.default, 'findById', () => crearConsulta(turnoCompleto, registro));
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
    const incluirCuerpo = opciones.cuerpo !== undefined &&
        metodo !== 'GET' &&
        metodo !== 'HEAD';
    if (opciones.token) {
        headers.authorization = `Bearer ${opciones.token}`;
    }
    if (incluirCuerpo) {
        headers['content-type'] = 'application/json';
    }
    return fetch(`${urlBase}${ruta}`, {
        method: metodo,
        headers,
        body: incluirCuerpo
            ? JSON.stringify(opciones.cuerpo)
            : undefined,
    });
};
const leerCuerpo = async (respuesta) => (await respuesta.json());
(0, node_test_1.beforeEach)(() => {
    registro = { populates: [] };
    datosCreados = undefined;
    // El middleware de autenticación de pacientes valida que exista.
    node_test_1.mock.method(Paciente_1.default, 'exists', async () => ({
        _id: PACIENTE_ID,
    }));
});
(0, node_test_1.afterEach)(() => {
    node_test_1.mock.restoreAll();
    turnos.createTurnoParaPaciente =
        turnosOriginal.createTurnoParaPaciente;
    turnos.createTurno = turnosOriginal.createTurno;
    turnos.getDisponibilidad = turnosOriginal.getDisponibilidad;
    especialidades.getEspecialidadesDisponibles =
        especialidadesOriginal.getEspecialidadesDisponibles;
    medicos.getMedicosDisponibles =
        medicosOriginal.getMedicosDisponibles;
});
// ============================================================
// SERVICIO: CREACIÓN DEL TURNO DEL PACIENTE
// ============================================================
(0, node_test_1.test)('createTurnoParaPaciente usa el ID autenticado e ignora el paciente del body', async () => {
    prepararDependencias();
    prepararCreacion();
    await turno_service_1.default.createTurnoParaPaciente(PACIENTE_ID, {
        ...crearDatosPaciente(),
        paciente: OTRO_PACIENTE_ID,
    });
    strict_1.default.equal(datosCreados?.paciente, PACIENTE_ID);
});
(0, node_test_1.test)('createTurnoParaPaciente ignora estado, fechaFin, duración y activo enviados por el cliente', async () => {
    prepararDependencias();
    prepararCreacion();
    await turno_service_1.default.createTurnoParaPaciente(PACIENTE_ID, {
        ...crearDatosPaciente(),
        estado: 'atendido',
        fechaFin: fechaLocal('10:00'),
        duracionTurno: 60,
        activo: false,
    });
    strict_1.default.equal(datosCreados?.estado, 'pendiente');
    strict_1.default.equal((datosCreados?.fechaFin).toISOString(), `${FECHA_BASE}T12:30:00.000Z`);
    strict_1.default.equal('duracionTurno' in (datosCreados ?? {}), false);
    strict_1.default.equal('activo' in (datosCreados ?? {}), false);
});
(0, node_test_1.test)('createTurnoParaPaciente devuelve una proyección mínima sin paciente', async () => {
    prepararDependencias();
    prepararCreacion();
    const resultado = await turno_service_1.default.createTurnoParaPaciente(PACIENTE_ID, crearDatosPaciente());
    strict_1.default.equal(registro.seleccion, 'fechaTurno fechaFin estado observaciones especialidad medico');
    strict_1.default.deepEqual(registro.populates, [
        { ruta: 'especialidad', campos: 'nombre' },
        {
            ruta: 'medico',
            campos: 'nombre apellido matricula',
        },
    ]);
    strict_1.default.equal('paciente' in resultado, false);
});
(0, node_test_1.test)('createTurnoParaPaciente rechaza un horario que no pertenece a la grilla ofrecida', async () => {
    prepararDependencias();
    prepararCreacion();
    await strict_1.default.rejects(turno_service_1.default.createTurnoParaPaciente(PACIENTE_ID, crearDatosPaciente({
        fechaTurno: `${FECHA_BASE}T09:10`,
    })), (error) => error instanceof Error &&
        error.message ===
            turno_messages_1.MENSAJES_TURNO.HORARIO_NO_DISPONIBLE);
});
(0, node_test_1.test)('createTurnoParaPaciente rechaza un horario fuera del horario de atención', async () => {
    prepararDependencias();
    prepararCreacion();
    await strict_1.default.rejects(turno_service_1.default.createTurnoParaPaciente(PACIENTE_ID, crearDatosPaciente({
        fechaTurno: `${FECHA_BASE}T12:30`,
    })), (error) => error instanceof Error &&
        error.message === turno_messages_1.MENSAJES_TURNO.FUERA_DE_HORARIO);
});
(0, node_test_1.test)('createTurnoParaPaciente rechaza un horario superpuesto', async () => {
    prepararDependencias();
    node_test_1.mock.method(Turno_1.default, 'find', async () => [
        {
            fechaTurno: fechaLocal('09:00'),
            fechaFin: fechaLocal('09:30'),
        },
    ]);
    prepararCreacion();
    await strict_1.default.rejects(turno_service_1.default.createTurnoParaPaciente(PACIENTE_ID, crearDatosPaciente()), (error) => error instanceof Error &&
        error.message === turno_messages_1.MENSAJES_TURNO.HORARIO_OCUPADO);
});
(0, node_test_1.test)('createTurnoParaPaciente rechaza una especialidad inactiva', async () => {
    prepararDependencias();
    node_test_1.mock.method(Especialidad_1.default, 'exists', async (filtro) => {
        if (filtro?.activo === true) {
            return null;
        }
        return { _id: ESPECIALIDAD_ID };
    });
    prepararCreacion();
    await strict_1.default.rejects(turno_service_1.default.createTurnoParaPaciente(PACIENTE_ID, crearDatosPaciente()), (error) => error instanceof Error &&
        error.message ===
            turno_messages_1.MENSAJES_TURNO.ESPECIALIDAD_INACTIVA);
});
(0, node_test_1.test)('createTurnoParaPaciente rechaza un médico inactivo', async () => {
    prepararDependencias(crearMedico({ activo: false }));
    prepararCreacion();
    await strict_1.default.rejects(turno_service_1.default.createTurnoParaPaciente(PACIENTE_ID, crearDatosPaciente()), (error) => error instanceof Error &&
        error.message === turno_messages_1.MENSAJES_TURNO.MEDICO_INACTIVO);
});
(0, node_test_1.test)('createTurnoParaPaciente rechaza una especialidad que no corresponde al médico', async () => {
    prepararDependencias(crearMedico({
        especialidades: [new mongoose_1.default.Types.ObjectId()],
    }));
    prepararCreacion();
    await strict_1.default.rejects(turno_service_1.default.createTurnoParaPaciente(PACIENTE_ID, crearDatosPaciente()), (error) => error instanceof Error &&
        error.message ===
            turno_messages_1.MENSAJES_TURNO.ESPECIALIDAD_NO_CORRESPONDE);
});
(0, node_test_1.test)('createTurnoParaPaciente rechaza observaciones de más de 500 caracteres', async () => {
    prepararDependencias();
    prepararCreacion();
    await strict_1.default.rejects(turno_service_1.default.createTurnoParaPaciente(PACIENTE_ID, crearDatosPaciente({
        observaciones: 'a'.repeat(501),
    })), (error) => error instanceof Error &&
        error.message ===
            turno_messages_1.MENSAJES_TURNO.OBSERVACIONES_DEMASIADO_LARGAS);
});
(0, node_test_1.test)('createTurnoParaPaciente rechaza un ID de paciente inválido', async () => {
    await strict_1.default.rejects(turno_service_1.default.createTurnoParaPaciente('no-es-un-object-id', crearDatosPaciente()), (error) => error instanceof Error &&
        error.message ===
            turno_messages_1.MENSAJES_TURNO.PACIENTE_ID_INVALIDO);
});
(0, node_test_1.test)('createTurnoParaPaciente rechaza datos nulos', async () => {
    await strict_1.default.rejects(turno_service_1.default.createTurnoParaPaciente(PACIENTE_ID, null), (error) => error instanceof Error &&
        error.message === turno_messages_1.MENSAJES_TURNO.DATOS_INVALIDOS);
});
(0, node_test_1.test)('createTurnoParaPaciente rechaza una fecha pasada', async () => {
    prepararDependencias();
    prepararCreacion();
    await strict_1.default.rejects(turno_service_1.default.createTurnoParaPaciente(PACIENTE_ID, crearDatosPaciente({
        fechaTurno: '2020-01-06T09:00',
    })), (error) => error instanceof Error &&
        error.message === turno_messages_1.MENSAJES_TURNO.FECHA_PASADA);
});
// ============================================================
// DISPONIBILIDAD
// ============================================================
(0, node_test_1.test)('la disponibilidad del paciente exige una especialidad activa', async () => {
    node_test_1.mock.method(Medico_1.default, 'findById', async () => crearMedico());
    node_test_1.mock.method(Especialidad_1.default, 'exists', async () => null);
    node_test_1.mock.method(Turno_1.default, 'find', async () => []);
    await strict_1.default.rejects((0, disponibilidad_service_1.obtenerDisponibilidad)(MEDICO_ID, FECHA_BASE, {
        zonaHoraria: ZONA,
        ahora: AHORA,
        validarEspecialidadActiva: true,
    }), (error) => error instanceof Error &&
        error.message ===
            turno_messages_1.MENSAJES_TURNO.ESPECIALIDAD_INACTIVA);
});
(0, node_test_1.test)('la disponibilidad interna conserva el comportamiento sin exigir especialidad activa', async () => {
    node_test_1.mock.method(Medico_1.default, 'findById', async () => crearMedico());
    node_test_1.mock.method(Especialidad_1.default, 'exists', async () => null);
    node_test_1.mock.method(Turno_1.default, 'find', async () => []);
    const resultado = await (0, disponibilidad_service_1.obtenerDisponibilidad)(MEDICO_ID, FECHA_BASE, {
        zonaHoraria: ZONA,
        ahora: AHORA,
    });
    strict_1.default.ok(resultado.horarios.length > 0);
    strict_1.default.equal(resultado.horarios[0].inicio.toISOString(), `${FECHA_BASE}T11:00:00.000Z`);
});
(0, node_test_1.test)('la disponibilidad del paciente no ofrece horarios pasados', async () => {
    node_test_1.mock.method(Medico_1.default, 'findById', async () => crearMedico());
    node_test_1.mock.method(Especialidad_1.default, 'exists', async () => ({ _id: ESPECIALIDAD_ID }));
    node_test_1.mock.method(Turno_1.default, 'find', async () => []);
    const resultado = await (0, disponibilidad_service_1.obtenerDisponibilidad)(MEDICO_ID, FECHA_BASE, {
        zonaHoraria: ZONA,
        ahora: new Date(`${FECHA_BASE}T23:00:00.000Z`),
        validarEspecialidadActiva: true,
    });
    strict_1.default.equal(resultado.horarios.length, 0);
});
(0, node_test_1.test)('la disponibilidad del paciente excluye los horarios ocupados', async () => {
    node_test_1.mock.method(Medico_1.default, 'findById', async () => crearMedico());
    node_test_1.mock.method(Especialidad_1.default, 'exists', async () => ({ _id: ESPECIALIDAD_ID }));
    node_test_1.mock.method(Turno_1.default, 'find', async () => [
        {
            fechaTurno: fechaLocal('09:00'),
            fechaFin: fechaLocal('09:30'),
        },
    ]);
    const resultado = await (0, disponibilidad_service_1.obtenerDisponibilidad)(MEDICO_ID, FECHA_BASE, {
        zonaHoraria: ZONA,
        ahora: AHORA,
        validarEspecialidadActiva: true,
    });
    strict_1.default.equal(resultado.horarios.some((horario) => horario.inicio.toISOString() ===
        `${FECHA_BASE}T12:00:00.000Z`), false);
});
// ============================================================
// SERVICIO: CATÁLOGO DE ESPECIALIDADES
// ============================================================
(0, node_test_1.test)('getEspecialidadesDisponibles filtra activas y proyecta solo campos públicos', async () => {
    const consultaRegistro = {
        populates: [],
    };
    const especialidadesSimuladas = [
        {
            id: 'esp-1',
            nombre: 'CARDIOLOGIA',
            descripcion: 'Corazón',
            codigo: 'CARD',
        },
    ];
    node_test_1.mock.method(Especialidad_1.default, 'find', (filtro) => {
        consultaRegistro.filtro = filtro;
        return crearConsulta(especialidadesSimuladas, consultaRegistro);
    });
    const resultado = await especialidad_service_1.default.getEspecialidadesDisponibles();
    strict_1.default.deepEqual(consultaRegistro.filtro, {
        activo: true,
    });
    strict_1.default.equal(consultaRegistro.seleccion, 'nombre descripcion codigo');
    strict_1.default.deepEqual(consultaRegistro.orden, {
        nombre: 1,
    });
    strict_1.default.equal(resultado, especialidadesSimuladas);
});
// ============================================================
// SERVICIO: CATÁLOGO DE MÉDICOS
// ============================================================
(0, node_test_1.test)('getMedicosDisponibles filtra por especialidad y activo con proyección segura', async () => {
    const consultaRegistro = {
        populates: [],
    };
    node_test_1.mock.method(Especialidad_1.default, 'findOne', () => crearConsulta({ _id: ESPECIALIDAD_ID }, consultaRegistro));
    const medicosSimulados = [
        {
            id: MEDICO_ID,
            nombre: 'ANA',
            apellido: 'PEREZ',
            matricula: '123456',
            duracionTurno: 30,
            especialidades: [
                {
                    id: ESPECIALIDAD_ID,
                    nombre: 'CARDIOLOGIA',
                },
            ],
        },
    ];
    node_test_1.mock.method(Medico_1.default, 'find', (filtro) => {
        consultaRegistro.filtro = filtro;
        return crearConsulta(medicosSimulados, consultaRegistro);
    });
    const resultado = await medico_service_1.default.getMedicosDisponibles(ESPECIALIDAD_ID);
    strict_1.default.deepEqual(consultaRegistro.filtro, {
        especialidades: ESPECIALIDAD_ID,
        activo: true,
    });
    strict_1.default.equal(consultaRegistro.seleccion, 'nombre apellido matricula especialidades duracionTurno');
    strict_1.default.deepEqual(consultaRegistro.populates, [
        { ruta: 'especialidades', campos: 'nombre' },
    ]);
    strict_1.default.equal(resultado, medicosSimulados);
});
(0, node_test_1.test)('getMedicosDisponibles rechaza un ID de especialidad inválido', async () => {
    await strict_1.default.rejects(medico_service_1.default.getMedicosDisponibles('no-es-id'), (error) => error instanceof Error &&
        error.message ===
            'El ID de la especialidad no es válido');
});
(0, node_test_1.test)('getMedicosDisponibles rechaza una especialidad inexistente', async () => {
    const consultaRegistro = {
        populates: [],
    };
    node_test_1.mock.method(Especialidad_1.default, 'findOne', () => crearConsulta(null, consultaRegistro));
    node_test_1.mock.method(Especialidad_1.default, 'exists', async () => null);
    await strict_1.default.rejects(medico_service_1.default.getMedicosDisponibles(ESPECIALIDAD_ID), (error) => error instanceof Error &&
        error.message ===
            'La especialidad indicada no existe');
});
(0, node_test_1.test)('getMedicosDisponibles rechaza una especialidad inactiva', async () => {
    const consultaRegistro = {
        populates: [],
    };
    node_test_1.mock.method(Especialidad_1.default, 'findOne', () => crearConsulta(null, consultaRegistro));
    node_test_1.mock.method(Especialidad_1.default, 'exists', async () => ({ _id: ESPECIALIDAD_ID }));
    await strict_1.default.rejects(medico_service_1.default.getMedicosDisponibles(ESPECIALIDAD_ID), (error) => error instanceof Error &&
        error.message ===
            'La especialidad no está activa');
});
// ============================================================
// ENDPOINTS: AUTORIZACIÓN E IDENTIDAD
// ============================================================
(0, node_test_1.test)('POST /turnos/mi-turno rechaza solicitudes sin token', async () => {
    const respuesta = await solicitar('POST', '/api/v1/turnos/mi-turno', { cuerpo: crearDatosPaciente() });
    strict_1.default.equal(respuesta.status, 401);
});
(0, node_test_1.test)('POST /turnos/mi-turno rechaza a los roles internos', async () => {
    for (const rol of [
        'admin',
        'medico',
        'recepcionista',
    ]) {
        const respuesta = await solicitar('POST', '/api/v1/turnos/mi-turno', {
            token: crearTokenInterno(rol),
            cuerpo: crearDatosPaciente(),
        });
        strict_1.default.equal(respuesta.status, 403, `El rol ${rol} no debería acceder`);
    }
});
(0, node_test_1.test)('POST /turnos/mi-turno registra el turno para el paciente del JWT', async () => {
    let capturado;
    turnos.createTurnoParaPaciente = async (idPaciente, datos) => {
        capturado = { idPaciente, datos };
        return {
            id: TURNO_ID,
            estado: 'pendiente',
            especialidad: {
                id: ESPECIALIDAD_ID,
                nombre: 'CARDIOLOGIA',
            },
            medico: {
                id: MEDICO_ID,
                nombre: 'ANA',
                apellido: 'PEREZ',
            },
            fechaTurno: fechaLocal('09:00'),
            fechaFin: fechaLocal('09:30'),
        };
    };
    const cuerpo = {
        ...crearDatosPaciente(),
        paciente: OTRO_PACIENTE_ID,
        estado: 'atendido',
        fechaFin: fechaLocal('10:00'),
        activo: false,
    };
    const respuesta = await solicitar('POST', '/api/v1/turnos/mi-turno', {
        token: crearTokenPaciente(PACIENTE_ID),
        cuerpo,
    });
    const body = await leerCuerpo(respuesta);
    strict_1.default.equal(respuesta.status, 201);
    strict_1.default.equal(body.success, true);
    strict_1.default.equal(body.message, 'Turno registrado exitosamente');
    strict_1.default.equal(body.data.id, TURNO_ID);
    strict_1.default.equal(capturado?.idPaciente, PACIENTE_ID);
    strict_1.default.equal((capturado?.datos).paciente, OTRO_PACIENTE_ID);
});
(0, node_test_1.test)('POST /turnos/mi-turno rechaza un token de paciente inexistente', async () => {
    node_test_1.mock.method(Paciente_1.default, 'exists', async () => null);
    const respuesta = await solicitar('POST', '/api/v1/turnos/mi-turno', {
        token: crearTokenPaciente(PACIENTE_ID),
        cuerpo: crearDatosPaciente(),
    });
    strict_1.default.equal(respuesta.status, 401);
});
// ============================================================
// ENDPOINTS: CATÁLOGO DE ESPECIALIDADES
// ============================================================
(0, node_test_1.test)('GET /especialidades/disponibles devuelve solo campos públicos al paciente', async () => {
    especialidades.getEspecialidadesDisponibles =
        async () => [
            {
                id: 'esp-1',
                nombre: 'CARDIOLOGIA',
                descripcion: 'Corazón',
                codigo: 'CARD',
            },
        ];
    const respuesta = await solicitar('GET', '/api/v1/especialidades/disponibles', {
        token: crearTokenPaciente(PACIENTE_ID),
    });
    const body = await leerCuerpo(respuesta);
    strict_1.default.equal(respuesta.status, 200);
    strict_1.default.equal(body.total, 1);
    const [especialidad] = body.data;
    strict_1.default.deepEqual(Object.keys(especialidad).sort(), ['codigo', 'descripcion', 'id', 'nombre'].sort());
    strict_1.default.equal('activo' in especialidad, false);
    strict_1.default.equal('createdAt' in especialidad, false);
});
(0, node_test_1.test)('GET /especialidades/disponibles rechaza a los roles internos', async () => {
    for (const rol of [
        'admin',
        'medico',
        'recepcionista',
    ]) {
        const respuesta = await solicitar('GET', '/api/v1/especialidades/disponibles', { token: crearTokenInterno(rol) });
        strict_1.default.equal(respuesta.status, 403, `El rol ${rol} no debería acceder`);
    }
});
(0, node_test_1.test)('GET /especialidades conserva el acceso restringido al personal', async () => {
    const respuesta = await solicitar('GET', '/api/v1/especialidades', {
        token: crearTokenPaciente(PACIENTE_ID),
    });
    strict_1.default.equal(respuesta.status, 403);
});
// ============================================================
// ENDPOINTS: CATÁLOGO DE MÉDICOS
// ============================================================
(0, node_test_1.test)('GET /turnos/medicos-disponibles devuelve solo campos públicos al paciente', async () => {
    medicos.getMedicosDisponibles = async () => [
        {
            id: MEDICO_ID,
            nombre: 'ANA',
            apellido: 'PEREZ',
            matricula: '123456',
            duracionTurno: 30,
            especialidades: [
                {
                    id: ESPECIALIDAD_ID,
                    nombre: 'CARDIOLOGIA',
                },
            ],
        },
    ];
    const respuesta = await solicitar('GET', `/api/v1/turnos/medicos-disponibles?especialidad=${ESPECIALIDAD_ID}`, {
        token: crearTokenPaciente(PACIENTE_ID),
    });
    const body = await leerCuerpo(respuesta);
    strict_1.default.equal(respuesta.status, 200);
    strict_1.default.equal(body.total, 1);
    const [medico] = body.data;
    strict_1.default.deepEqual(Object.keys(medico).sort(), [
        'apellido',
        'duracionTurno',
        'especialidades',
        'id',
        'matricula',
        'nombre',
    ].sort());
    strict_1.default.equal('email' in medico, false);
    strict_1.default.equal('telefono' in medico, false);
    strict_1.default.equal('consultorios' in medico, false);
    strict_1.default.equal('horariosAtencion' in medico, false);
});
(0, node_test_1.test)('GET /turnos/medicos-disponibles rechaza a los roles internos', async () => {
    for (const rol of [
        'admin',
        'medico',
        'recepcionista',
    ]) {
        const respuesta = await solicitar('GET', `/api/v1/turnos/medicos-disponibles?especialidad=${ESPECIALIDAD_ID}`, { token: crearTokenInterno(rol) });
        strict_1.default.equal(respuesta.status, 403, `El rol ${rol} no debería acceder`);
    }
});
(0, node_test_1.test)('GET /turnos/medicos-disponibles rechaza un ObjectId inválido', async () => {
    const respuesta = await solicitar('GET', '/api/v1/turnos/medicos-disponibles?especialidad=no-es-id', {
        token: crearTokenPaciente(PACIENTE_ID),
    });
    strict_1.default.equal(respuesta.status, 400);
});
(0, node_test_1.test)('GET /turnos/medicos-disponibles responde 404 si la especialidad no existe', async () => {
    const consultaRegistro = {
        populates: [],
    };
    node_test_1.mock.method(Especialidad_1.default, 'findOne', () => crearConsulta(null, consultaRegistro));
    node_test_1.mock.method(Especialidad_1.default, 'exists', async () => null);
    const respuesta = await solicitar('GET', `/api/v1/turnos/medicos-disponibles?especialidad=${ESPECIALIDAD_ID}`, {
        token: crearTokenPaciente(PACIENTE_ID),
    });
    strict_1.default.equal(respuesta.status, 404);
});
(0, node_test_1.test)('GET /turnos/medicos-disponibles responde 409 si la especialidad está inactiva', async () => {
    const consultaRegistro = {
        populates: [],
    };
    node_test_1.mock.method(Especialidad_1.default, 'findOne', () => crearConsulta(null, consultaRegistro));
    node_test_1.mock.method(Especialidad_1.default, 'exists', async () => ({ _id: ESPECIALIDAD_ID }));
    const respuesta = await solicitar('GET', `/api/v1/turnos/medicos-disponibles?especialidad=${ESPECIALIDAD_ID}`, {
        token: crearTokenPaciente(PACIENTE_ID),
    });
    strict_1.default.equal(respuesta.status, 409);
});
// ============================================================
// ENDPOINTS: DISPONIBILIDAD
// ============================================================
(0, node_test_1.test)('GET /turnos/disponibilidad permite al paciente y exige especialidad activa', async () => {
    let opcionesRecibidas;
    turnos.getDisponibilidad = async (_medicoId, _fecha, opciones) => {
        opcionesRecibidas = opciones;
        return { horarios: [] };
    };
    const respuesta = await solicitar('GET', `/api/v1/turnos/disponibilidad?medicoId=${MEDICO_ID}&fecha=${FECHA_BASE}`, {
        token: crearTokenPaciente(PACIENTE_ID),
    });
    strict_1.default.equal(respuesta.status, 200);
    strict_1.default.deepEqual(opcionesRecibidas, {
        validarEspecialidadActiva: true,
    });
});
(0, node_test_1.test)('GET /turnos/disponibilidad conserva el comportamiento interno', async () => {
    for (const rol of [
        'admin',
        'medico',
        'recepcionista',
    ]) {
        let opcionesRecibidas;
        turnos.getDisponibilidad = async (_medicoId, _fecha, opciones) => {
            opcionesRecibidas = opciones;
            return { horarios: [] };
        };
        const respuesta = await solicitar('GET', `/api/v1/turnos/disponibilidad?medicoId=${MEDICO_ID}&fecha=${FECHA_BASE}`, { token: crearTokenInterno(rol) });
        strict_1.default.equal(respuesta.status, 200);
        strict_1.default.deepEqual(opcionesRecibidas, {
            validarEspecialidadActiva: false,
        });
    }
});
// ============================================================
// REGRESIONES DE PERMISOS INTERNOS
// ============================================================
(0, node_test_1.test)('el paciente no puede acceder a las rutas internas de turnos', async () => {
    const solicitudes = [
        ['GET', '/api/v1/turnos'],
        ['GET', '/api/v1/turnos/mis-turnos'],
        ['POST', '/api/v1/turnos'],
        ['PATCH', `/api/v1/turnos/${TURNO_ID}/estado`],
        ['DELETE', `/api/v1/turnos/${TURNO_ID}`],
    ];
    for (const [metodo, ruta] of solicitudes) {
        const respuesta = await solicitar(metodo, ruta, {
            token: crearTokenPaciente(PACIENTE_ID),
            cuerpo: {},
        });
        strict_1.default.equal(respuesta.status, 403, `${metodo} ${ruta} debería estar restringido`);
    }
});
(0, node_test_1.test)('la creación interna de turnos sigue funcionando para admin y recepción', async () => {
    turnos.createTurno = async () => ({
        id: TURNO_ID,
        estado: 'pendiente',
    });
    for (const rol of ['admin', 'recepcionista']) {
        const respuesta = await solicitar('POST', '/api/v1/turnos', {
            token: crearTokenInterno(rol),
            cuerpo: {},
        });
        strict_1.default.equal(respuesta.status, 201, `El rol ${rol} debería crear turnos`);
    }
});
(0, node_test_1.test)('el paciente no puede acceder al directorio interno de médicos', async () => {
    const respuesta = await solicitar('GET', '/api/v1/medicos', {
        token: crearTokenPaciente(PACIENTE_ID),
    });
    strict_1.default.equal(respuesta.status, 403);
});
