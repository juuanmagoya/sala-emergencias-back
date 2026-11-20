"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const mongoose_1 = __importDefault(require("mongoose"));
const Especialidad_1 = __importDefault(require("../../especialidad/models/Especialidad"));
const Medico_1 = __importDefault(require("../../medico/models/Medico"));
const Paciente_1 = __importDefault(require("../../pacientes/models/Paciente"));
const Usuario_1 = __importDefault(require("../../usuario/models/Usuario"));
const Turno_1 = __importDefault(require("../models/Turno"));
const turno_service_1 = __importDefault(require("../services/turno.service"));
const disponibilidad_service_1 = require("../services/disponibilidad.service");
const turno_messages_1 = require("../constants/turno.messages");
const ZONA = 'America/Argentina/Buenos_Aires';
const PACIENTE_ID = '507f1f77bcf86cd799439011';
const ESPECIALIDAD_ID = '507f1f77bcf86cd799439012';
const MEDICO_ID = '507f1f77bcf86cd799439013';
const USUARIO_ID = '507f1f77bcf86cd799439014';
const TURNO_ID = '507f1f77bcf86cd799439015';
const AHORA = new Date('2026-11-02T03:00:00.000Z');
const FECHA_VALIDA = '2026-11-02T09:00';
const crearMedico = (overrides = {}) => ({
    _id: new mongoose_1.default.Types.ObjectId(MEDICO_ID),
    nombre: 'ANA',
    apellido: 'PEREZ',
    matricula: '123456',
    especialidades: [
        new mongoose_1.default.Types.ObjectId(ESPECIALIDAD_ID),
    ],
    email: 'ana@example.com',
    telefono: {
        tipo: 'CELULAR',
        codigoArea: '11',
        numero: '12345678',
    },
    consultorios: [],
    horariosAtencion: [
        {
            dia: 'LUNES',
            horaInicio: '08:00',
            horaFin: '12:00',
        },
        {
            dia: 'LUNES',
            horaInicio: '16:00',
            horaFin: '20:00',
        },
    ],
    duracionTurno: 30,
    activo: true,
    ...overrides,
});
const crearDatos = (overrides = {}) => ({
    paciente: PACIENTE_ID,
    especialidad: ESPECIALIDAD_ID,
    medico: MEDICO_ID,
    fechaTurno: FECHA_VALIDA,
    observaciones: '  control  ',
    ...overrides,
});
const fechaLocal = (hora) => new Date(`2026-11-02T${hora}:00.000-03:00`);
const prepararDependencias = (medico = crearMedico()) => {
    node_test_1.mock.method(Paciente_1.default, 'exists', async () => ({
        _id: PACIENTE_ID,
    }));
    node_test_1.mock.method(Especialidad_1.default, 'exists', async () => ({
        _id: ESPECIALIDAD_ID,
    }));
    node_test_1.mock.method(Medico_1.default, 'findById', async () => medico);
    node_test_1.mock.method(Turno_1.default, 'find', async () => []);
};
const prepararCreacion = (turnoCompleto) => {
    let datosCreados;
    node_test_1.mock.method(Turno_1.default, 'create', async (datos) => {
        datosCreados = datos;
        return {
            _id: new mongoose_1.default.Types.ObjectId(),
            ...datos,
        };
    });
    const consulta = Promise.resolve(turnoCompleto);
    consulta.populate = () => consulta;
    node_test_1.mock.method(Turno_1.default, 'findById', () => consulta);
    return () => datosCreados;
};
(0, node_test_1.afterEach)(() => {
    node_test_1.mock.restoreAll();
});
// ============================================================
// CREACIÓN
// ============================================================
(0, node_test_1.test)('crea el turno con estado y duración derivados en el servidor', async () => {
    prepararDependencias();
    const turnoCompleto = {
        _id: new mongoose_1.default.Types.ObjectId(),
        estado: 'pendiente',
    };
    const obtenerDatosCreados = prepararCreacion(turnoCompleto);
    const resultado = await turno_service_1.default.createTurno({
        ...crearDatos(),
        // Aunque un cliente los envíe, el servidor los ignora.
        estado: 'atendido',
        duracionTurno: 60,
    }, { ahora: AHORA, zonaHoraria: ZONA });
    const datosCreados = obtenerDatosCreados();
    strict_1.default.equal(resultado, turnoCompleto);
    strict_1.default.equal(datosCreados?.estado, 'pendiente');
    strict_1.default.equal((datosCreados?.fechaFin).toISOString(), '2026-11-02T12:30:00.000Z');
    strict_1.default.equal(datosCreados?.observaciones, 'control');
    strict_1.default.equal(datosCreados?.medico, MEDICO_ID);
    strict_1.default.equal('duracionTurno' in (datosCreados ?? {}), false);
});
(0, node_test_1.test)('consulta los turnos ocupados con la regla de estados del proyecto', async () => {
    prepararDependencias();
    let filtroConsultado;
    node_test_1.mock.method(Turno_1.default, 'find', async (filtro) => {
        filtroConsultado = filtro;
        return [];
    });
    prepararCreacion({ _id: new mongoose_1.default.Types.ObjectId() });
    await turno_service_1.default.createTurno(crearDatos(), {
        ahora: AHORA,
        zonaHoraria: ZONA,
    });
    strict_1.default.deepEqual(filtroConsultado?.estado, {
        $ne: 'cancelado',
    });
    strict_1.default.deepEqual(filtroConsultado?.activo, {
        $ne: false,
    });
});
(0, node_test_1.test)('rechaza un médico inactivo', async () => {
    prepararDependencias(crearMedico({ activo: false }));
    await strict_1.default.rejects(turno_service_1.default.createTurno(crearDatos(), {
        ahora: AHORA,
        zonaHoraria: ZONA,
    }), (error) => error instanceof Error &&
        error.message === turno_messages_1.MENSAJES_TURNO.MEDICO_INACTIVO);
});
(0, node_test_1.test)('rechaza una especialidad que no corresponde al médico', async () => {
    prepararDependencias(crearMedico({
        especialidades: [new mongoose_1.default.Types.ObjectId()],
    }));
    await strict_1.default.rejects(turno_service_1.default.createTurno(crearDatos(), {
        ahora: AHORA,
        zonaHoraria: ZONA,
    }), (error) => error instanceof Error &&
        error.message ===
            turno_messages_1.MENSAJES_TURNO.ESPECIALIDAD_NO_CORRESPONDE);
});
(0, node_test_1.test)('permite reservar con cualquier especialidad asignada, en cualquier posición', async () => {
    const segunda = new mongoose_1.default.Types.ObjectId();
    prepararDependencias(crearMedico({
        especialidades: [
            new mongoose_1.default.Types.ObjectId(ESPECIALIDAD_ID),
            segunda,
        ],
    }));
    const obtenerDatosCreados = prepararCreacion({
        _id: new mongoose_1.default.Types.ObjectId(),
    });
    await turno_service_1.default.createTurno(crearDatos({ especialidad: segunda.toString() }), { ahora: AHORA, zonaHoraria: ZONA });
    const datosCreados = obtenerDatosCreados();
    // El turno conserva una única especialidad, la reservada.
    strict_1.default.equal(datosCreados?.especialidad, segunda.toString());
});
(0, node_test_1.test)('rechaza fechas inválidas y fechas pasadas', async () => {
    prepararDependencias();
    await strict_1.default.rejects(turno_service_1.default.createTurno(crearDatos({ fechaTurno: '2026-02-30T09:00' }), { ahora: AHORA, zonaHoraria: ZONA }), (error) => error instanceof Error &&
        error.message === turno_messages_1.MENSAJES_TURNO.FECHA_INVALIDA);
    await strict_1.default.rejects(turno_service_1.default.createTurno(crearDatos({ fechaTurno: '2026-11-01T23:00' }), { ahora: AHORA, zonaHoraria: ZONA }), (error) => error instanceof Error &&
        error.message === turno_messages_1.MENSAJES_TURNO.FECHA_PASADA);
});
(0, node_test_1.test)('rechaza un turno superpuesto con uno existente', async () => {
    prepararDependencias();
    node_test_1.mock.method(Turno_1.default, 'find', async () => [
        {
            fechaTurno: fechaLocal('09:00'),
            fechaFin: fechaLocal('09:30'),
        },
    ]);
    await strict_1.default.rejects(turno_service_1.default.createTurno(crearDatos(), {
        ahora: AHORA,
        zonaHoraria: ZONA,
    }), (error) => error instanceof Error &&
        error.message === turno_messages_1.MENSAJES_TURNO.HORARIO_OCUPADO);
});
(0, node_test_1.test)('rechaza relaciones inexistentes', async () => {
    prepararDependencias();
    node_test_1.mock.method(Paciente_1.default, 'exists', async () => null);
    await strict_1.default.rejects(turno_service_1.default.createTurno(crearDatos(), {
        ahora: AHORA,
        zonaHoraria: ZONA,
    }), (error) => error instanceof Error &&
        error.message === turno_messages_1.MENSAJES_TURNO.PACIENTE_NO_EXISTE);
    node_test_1.mock.restoreAll();
    prepararDependencias();
    node_test_1.mock.method(Especialidad_1.default, 'exists', async () => null);
    await strict_1.default.rejects(turno_service_1.default.createTurno(crearDatos(), {
        ahora: AHORA,
        zonaHoraria: ZONA,
    }), (error) => error instanceof Error &&
        error.message ===
            turno_messages_1.MENSAJES_TURNO.ESPECIALIDAD_NO_EXISTE);
});
(0, node_test_1.test)('traduce el duplicado de la base a un conflicto de horario', async () => {
    prepararDependencias();
    node_test_1.mock.method(Turno_1.default, 'create', async () => {
        throw Object.assign(new Error('duplicado'), {
            code: 11000,
            keyPattern: { medico: 1, fechaTurno: 1 },
        });
    });
    await strict_1.default.rejects(turno_service_1.default.createTurno(crearDatos(), {
        ahora: AHORA,
        zonaHoraria: ZONA,
    }), (error) => error instanceof Error &&
        error.message === turno_messages_1.MENSAJES_TURNO.HORARIO_OCUPADO);
});
(0, node_test_1.test)('no traduce un duplicado desconocido a horario ocupado', async () => {
    prepararDependencias();
    const errorDuplicado = Object.assign(new Error('duplicado desconocido'), {
        code: 11000,
        keyPattern: { otraClave: 1 },
    });
    node_test_1.mock.method(Turno_1.default, 'create', async () => {
        throw errorDuplicado;
    });
    await strict_1.default.rejects(turno_service_1.default.createTurno(crearDatos(), {
        ahora: AHORA,
        zonaHoraria: ZONA,
    }), (error) => error === errorDuplicado);
});
(0, node_test_1.test)('dos reservas simultáneas del mismo horario no se confirman juntas', async () => {
    prepararDependencias();
    let creaciones = 0;
    node_test_1.mock.method(Turno_1.default, 'create', async (datos) => {
        creaciones += 1;
        if (creaciones === 2) {
            throw Object.assign(new Error('duplicado'), {
                code: 11000,
                keyPattern: { medico: 1, fechaTurno: 1 },
            });
        }
        return {
            _id: new mongoose_1.default.Types.ObjectId(),
            ...datos,
        };
    });
    const consulta = Promise.resolve({
        _id: new mongoose_1.default.Types.ObjectId(),
    });
    consulta.populate = () => consulta;
    node_test_1.mock.method(Turno_1.default, 'findById', () => consulta);
    const resultados = await Promise.allSettled([
        turno_service_1.default.createTurno(crearDatos(), {
            ahora: AHORA,
            zonaHoraria: ZONA,
        }),
        turno_service_1.default.createTurno(crearDatos(), {
            ahora: AHORA,
            zonaHoraria: ZONA,
        }),
    ]);
    strict_1.default.equal(resultados.filter((resultado) => resultado.status === 'fulfilled').length, 1);
    const rechazado = resultados.find((resultado) => resultado.status === 'rejected');
    strict_1.default.ok(rechazado && rechazado.status === 'rejected');
    strict_1.default.equal(rechazado.reason.message, turno_messages_1.MENSAJES_TURNO.HORARIO_OCUPADO);
});
(0, node_test_1.test)('la disponibilidad ofrecida puede reservarse con la misma regla', async () => {
    prepararDependencias();
    const disponibilidad = await (0, disponibilidad_service_1.obtenerDisponibilidad)(MEDICO_ID, '2026-11-02', { zonaHoraria: ZONA, ahora: AHORA });
    const primerHorario = disponibilidad.horarios[0];
    strict_1.default.ok(primerHorario);
    prepararCreacion({ _id: new mongoose_1.default.Types.ObjectId() });
    const turno = await turno_service_1.default.createTurno(crearDatos({
        fechaTurno: primerHorario.inicio.toISOString(),
    }), { ahora: AHORA, zonaHoraria: ZONA });
    strict_1.default.ok(turno);
});
// ============================================================
// ACTUALIZACIÓN DE ESTADO
// ============================================================
const prepararActualizacionEstado = (turno) => {
    let actualizacionConsultada;
    const consulta = Promise.resolve(turno);
    consulta.populate = () => consulta;
    node_test_1.mock.method(Turno_1.default, 'findByIdAndUpdate', (id, cambios, opciones) => {
        actualizacionConsultada = { id, cambios, opciones };
        return consulta;
    });
    return () => actualizacionConsultada;
};
(0, node_test_1.test)('actualiza únicamente el campo estado del turno', async () => {
    const turnoActualizado = {
        _id: TURNO_ID,
        estado: 'atendido',
    };
    const obtenerActualizacion = prepararActualizacionEstado(turnoActualizado);
    const resultado = await turno_service_1.default.actualizarEstadoTurno(TURNO_ID, { estado: 'atendido' });
    const actualizacion = obtenerActualizacion();
    strict_1.default.equal(resultado, turnoActualizado);
    strict_1.default.equal(actualizacion?.id, TURNO_ID);
    strict_1.default.deepEqual(actualizacion?.cambios, {
        $set: { estado: 'atendido' },
    });
    strict_1.default.equal(actualizacion?.opciones.new, true);
    strict_1.default.equal(actualizacion?.opciones.runValidators, true);
});
(0, node_test_1.test)('rechaza un ID de turno inválido', async () => {
    await strict_1.default.rejects(turno_service_1.default.actualizarEstadoTurno('no-es-un-id', {
        estado: 'atendido',
    }), (error) => error instanceof Error &&
        error.message === turno_messages_1.MENSAJES_TURNO.TURNO_ID_INVALIDO);
});
(0, node_test_1.test)('exige un estado y rechaza los no permitidos', async () => {
    await strict_1.default.rejects(turno_service_1.default.actualizarEstadoTurno(TURNO_ID, {}), (error) => error instanceof Error &&
        error.message === turno_messages_1.MENSAJES_TURNO.ESTADO_REQUERIDO);
    await strict_1.default.rejects(turno_service_1.default.actualizarEstadoTurno(TURNO_ID, { estado: 'en-espera' }), (error) => error instanceof Error &&
        error.message === turno_messages_1.MENSAJES_TURNO.ESTADO_INVALIDO);
});
(0, node_test_1.test)('rechaza campos distintos de estado en el body', async () => {
    await strict_1.default.rejects(turno_service_1.default.actualizarEstadoTurno(TURNO_ID, {
        estado: 'atendido',
        observaciones: 'otra cosa',
    }), (error) => error instanceof Error &&
        error.message ===
            turno_messages_1.MENSAJES_TURNO.SOLO_ESTADO_MODIFICABLE);
});
(0, node_test_1.test)('rechaza un turno inexistente', async () => {
    prepararActualizacionEstado(null);
    await strict_1.default.rejects(turno_service_1.default.actualizarEstadoTurno(TURNO_ID, {
        estado: 'atendido',
    }), (error) => error instanceof Error &&
        error.message === turno_messages_1.MENSAJES_TURNO.TURNO_NO_ENCONTRADO);
});
// ============================================================
// AGENDA DEL MÉDICO AUTENTICADO
// ============================================================
(0, node_test_1.test)('mis-turnos filtra por la relación explícita del usuario', async () => {
    const medico = crearMedico();
    node_test_1.mock.method(Usuario_1.default, 'findById', async () => ({
        rol: 'medico',
        medico: new mongoose_1.default.Types.ObjectId(MEDICO_ID),
    }));
    node_test_1.mock.method(Medico_1.default, 'findById', async () => medico);
    let filtroConsultado;
    let ordenConsultado;
    const cadena = {
        populate: () => cadena,
        sort: (orden) => {
            ordenConsultado = orden;
            return Promise.resolve([]);
        },
    };
    node_test_1.mock.method(Turno_1.default, 'find', (filtro) => {
        filtroConsultado = filtro;
        return cadena;
    });
    const turnos = await turno_service_1.default.getTurnosDelMedico(USUARIO_ID);
    strict_1.default.deepEqual(filtroConsultado, { medico: medico._id });
    strict_1.default.deepEqual(ordenConsultado, { fechaTurno: 1 });
    strict_1.default.deepEqual(turnos, []);
});
(0, node_test_1.test)('mis-turnos rechaza usuarios sin perfil médico', async () => {
    node_test_1.mock.method(Usuario_1.default, 'findById', async () => ({
        rol: 'recepcionista',
    }));
    await strict_1.default.rejects(turno_service_1.default.getTurnosDelMedico(USUARIO_ID), (error) => error instanceof Error &&
        error.message === turno_messages_1.MENSAJES_TURNO.SIN_PERFIL_MEDICO);
});
