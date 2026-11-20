"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const mongoose_1 = __importDefault(require("mongoose"));
const Medico_1 = __importDefault(require("../../medico/models/Medico"));
const Especialidad_1 = __importDefault(require("../../especialidad/models/Especialidad"));
const Turno_1 = __importDefault(require("../models/Turno"));
const disponibilidad_service_1 = require("../services/disponibilidad.service");
const turno_messages_1 = require("../constants/turno.messages");
const ZONA = 'America/Argentina/Buenos_Aires';
const MEDICO_ID = '507f1f77bcf86cd799439013';
const ESPECIALIDAD_ID = '507f1f77bcf86cd799439012';
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
const fechaLocal = (hora) => new Date(`2026-11-02T${hora}:00.000-03:00`);
(0, node_test_1.afterEach)(() => {
    node_test_1.mock.restoreAll();
});
// ============================================================
// GENERACIÓN DE HORARIOS
// ============================================================
(0, node_test_1.test)('genera horarios de 30 minutos en ambos intervalos del lunes', async () => {
    const medico = crearMedico();
    node_test_1.mock.method(Medico_1.default, 'findById', async () => medico);
    node_test_1.mock.method(Turno_1.default, 'find', async () => []);
    const resultado = await (0, disponibilidad_service_1.obtenerDisponibilidad)(MEDICO_ID, '2026-11-02', {
        zonaHoraria: ZONA,
        ahora: new Date('2026-11-02T03:00:00.000Z'),
    });
    strict_1.default.equal(resultado.horarios.length, 16);
    strict_1.default.equal(resultado.duracionTurno, 30);
    strict_1.default.equal(resultado.horarios[0]?.horaLocal, '08:00');
    strict_1.default.equal(resultado.horarios[0]?.inicio.toISOString(), '2026-11-02T11:00:00.000Z');
    const ultimoDeLaManana = resultado.horarios[7];
    strict_1.default.equal(ultimoDeLaManana?.horaLocal, '11:30');
    strict_1.default.equal(ultimoDeLaManana?.fin.toISOString(), '2026-11-02T15:00:00.000Z');
    const primeroDeLaTarde = resultado.horarios[8];
    strict_1.default.equal(primeroDeLaTarde?.horaLocal, '16:00');
    strict_1.default.equal(primeroDeLaTarde?.fin.toISOString(), '2026-11-02T19:30:00.000Z');
    strict_1.default.equal(resultado.horarios.some((horario) => horario.horaLocal === '12:00' ||
        horario.horaLocal === '15:30'), false);
});
(0, node_test_1.test)('respeta la duración configurada por cada médico', () => {
    const medico = crearMedico({
        duracionTurno: 45,
        horariosAtencion: [
            {
                dia: 'LUNES',
                horaInicio: '08:00',
                horaFin: '10:00',
            },
        ],
    });
    const horarios = (0, disponibilidad_service_1.generarHorariosDelDia)(medico, { anio: 2026, mes: 11, dia: 2 }, ZONA);
    strict_1.default.deepEqual(horarios.map((horario) => horario.horaLocal), ['08:00', '08:45']);
    strict_1.default.equal(horarios[1]?.fin.toISOString(), '2026-11-02T12:30:00.000Z');
});
(0, node_test_1.test)('no ofrece turnos que terminen después del cierre', () => {
    const medico = crearMedico({
        duracionTurno: 40,
        horariosAtencion: [
            {
                dia: 'LUNES',
                horaInicio: '08:00',
                horaFin: '10:00',
            },
        ],
    });
    const horarios = (0, disponibilidad_service_1.generarHorariosDelDia)(medico, { anio: 2026, mes: 11, dia: 2 }, ZONA);
    strict_1.default.deepEqual(horarios.map((horario) => horario.horaLocal), ['08:00', '08:40', '09:20']);
    strict_1.default.equal(horarios.at(-1)?.fin.toISOString(), '2026-11-02T13:00:00.000Z');
});
(0, node_test_1.test)('devuelve una lista vacía si el médico no atiende ese día', async () => {
    const medico = crearMedico();
    node_test_1.mock.method(Medico_1.default, 'findById', async () => medico);
    node_test_1.mock.method(Turno_1.default, 'find', async () => []);
    const resultado = await (0, disponibilidad_service_1.obtenerDisponibilidad)(MEDICO_ID, '2026-11-01', { zonaHoraria: ZONA });
    strict_1.default.deepEqual(resultado.horarios, []);
});
(0, node_test_1.test)('excluye los horarios ocupados y conserva los adyacentes', async () => {
    const medico = crearMedico();
    node_test_1.mock.method(Medico_1.default, 'findById', async () => medico);
    node_test_1.mock.method(Turno_1.default, 'find', async () => [
        {
            fechaTurno: fechaLocal('09:00'),
            fechaFin: fechaLocal('09:30'),
        },
    ]);
    const resultado = await (0, disponibilidad_service_1.obtenerDisponibilidad)(MEDICO_ID, '2026-11-02', {
        zonaHoraria: ZONA,
        ahora: new Date('2026-11-02T03:00:00.000Z'),
    });
    strict_1.default.equal(resultado.horarios.some((horario) => horario.horaLocal === '09:00'), false);
    strict_1.default.equal(resultado.horarios.some((horario) => horario.horaLocal === '09:30'), true);
    strict_1.default.equal(resultado.horarios.some((horario) => horario.horaLocal === '08:30'), true);
});
(0, node_test_1.test)('los turnos cancelados no bloquean la agenda', async () => {
    const medico = crearMedico();
    let filtroConsultado;
    node_test_1.mock.method(Medico_1.default, 'findById', async () => medico);
    node_test_1.mock.method(Turno_1.default, 'find', async (filtro) => {
        filtroConsultado = filtro;
        return [];
    });
    const resultado = await (0, disponibilidad_service_1.obtenerDisponibilidad)(MEDICO_ID, '2026-11-02', {
        zonaHoraria: ZONA,
        ahora: new Date('2026-11-02T03:00:00.000Z'),
    });
    strict_1.default.deepEqual(filtroConsultado?.estado, {
        $ne: 'cancelado',
    });
    strict_1.default.deepEqual(filtroConsultado?.activo, {
        $ne: false,
    });
    strict_1.default.equal(resultado.horarios.length, 16);
});
(0, node_test_1.test)('un médico inactivo no tiene disponibilidad', async () => {
    const medico = crearMedico({ activo: false });
    node_test_1.mock.method(Medico_1.default, 'findById', async () => medico);
    await strict_1.default.rejects((0, disponibilidad_service_1.obtenerDisponibilidad)(MEDICO_ID, '2026-11-02', {
        zonaHoraria: ZONA,
    }), (error) => error instanceof Error &&
        error.message === turno_messages_1.MENSAJES_TURNO.MEDICO_INACTIVO);
});
(0, node_test_1.test)('rechaza una fecha de consulta inválida', async () => {
    await strict_1.default.rejects((0, disponibilidad_service_1.obtenerDisponibilidad)(MEDICO_ID, '2026-02-30', {
        zonaHoraria: ZONA,
    }), (error) => error instanceof Error &&
        error.message ===
            turno_messages_1.MENSAJES_TURNO.FECHA_CONSULTA_INVALIDA);
});
(0, node_test_1.test)('no ofrece horarios de una fecha ya pasada', async () => {
    const medico = crearMedico();
    node_test_1.mock.method(Medico_1.default, 'findById', async () => medico);
    node_test_1.mock.method(Turno_1.default, 'find', async () => []);
    const resultado = await (0, disponibilidad_service_1.obtenerDisponibilidad)(MEDICO_ID, '2026-10-26', {
        zonaHoraria: ZONA,
        ahora: new Date('2026-11-02T03:00:00.000Z'),
    });
    strict_1.default.deepEqual(resultado.horarios, []);
});
// ============================================================
// ESPECIALIDAD CONSULTADA
// ============================================================
const SEGUNDA_ESPECIALIDAD_ID = '507f1f77bcf86cd799439099';
(0, node_test_1.test)('la disponibilidad es la misma para cada especialidad asignada', async () => {
    const primera = new mongoose_1.default.Types.ObjectId(ESPECIALIDAD_ID);
    const segunda = new mongoose_1.default.Types.ObjectId(SEGUNDA_ESPECIALIDAD_ID);
    node_test_1.mock.method(Medico_1.default, 'findById', async () => crearMedico({ especialidades: [primera, segunda] }));
    node_test_1.mock.method(Turno_1.default, 'find', async () => []);
    const consultadas = [];
    node_test_1.mock.method(Especialidad_1.default, 'exists', async (filtro) => {
        consultadas.push(filtro._id);
        return { _id: filtro._id };
    });
    for (const especialidad of [primera, segunda]) {
        const resultado = await (0, disponibilidad_service_1.obtenerDisponibilidad)(MEDICO_ID, '2026-11-02', {
            zonaHoraria: ZONA,
            ahora: new Date('2026-11-02T03:00:00.000Z'),
            especialidadId: especialidad.toString(),
            validarEspecialidadActiva: true,
        });
        // La grilla depende del médico, no de la especialidad.
        strict_1.default.equal(resultado.horarios.length, 16);
        strict_1.default.equal(resultado.duracionTurno, 30);
    }
    strict_1.default.deepEqual(consultadas.map(String), [primera.toString(), segunda.toString()]);
});
(0, node_test_1.test)('rechaza una especialidad que el médico no tiene asignada', async () => {
    node_test_1.mock.method(Medico_1.default, 'findById', async () => crearMedico());
    await strict_1.default.rejects((0, disponibilidad_service_1.obtenerDisponibilidad)(MEDICO_ID, '2026-11-02', {
        zonaHoraria: ZONA,
        especialidadId: SEGUNDA_ESPECIALIDAD_ID,
        validarEspecialidadActiva: true,
    }), (error) => error instanceof Error &&
        error.message ===
            turno_messages_1.MENSAJES_TURNO.ESPECIALIDAD_NO_CORRESPONDE);
});
(0, node_test_1.test)('rechaza la especialidad asignada pero inactiva', async () => {
    node_test_1.mock.method(Medico_1.default, 'findById', async () => crearMedico());
    node_test_1.mock.method(Especialidad_1.default, 'exists', async () => null);
    await strict_1.default.rejects((0, disponibilidad_service_1.obtenerDisponibilidad)(MEDICO_ID, '2026-11-02', {
        zonaHoraria: ZONA,
        especialidadId: ESPECIALIDAD_ID,
        validarEspecialidadActiva: true,
    }), (error) => error instanceof Error &&
        error.message ===
            turno_messages_1.MENSAJES_TURNO.ESPECIALIDAD_INACTIVA);
});
(0, node_test_1.test)('rechaza un ID de especialidad consultada inválido', async () => {
    node_test_1.mock.method(Medico_1.default, 'findById', async () => crearMedico());
    await strict_1.default.rejects((0, disponibilidad_service_1.obtenerDisponibilidad)(MEDICO_ID, '2026-11-02', {
        zonaHoraria: ZONA,
        especialidadId: 'no-es-id',
    }), (error) => error instanceof Error &&
        error.message ===
            turno_messages_1.MENSAJES_TURNO.ESPECIALIDAD_ID_INVALIDO);
});
(0, node_test_1.test)('un turno de otra especialidad del mismo médico también bloquea el horario', async () => {
    const primera = new mongoose_1.default.Types.ObjectId(ESPECIALIDAD_ID);
    const segunda = new mongoose_1.default.Types.ObjectId(SEGUNDA_ESPECIALIDAD_ID);
    let filtroTurnos;
    node_test_1.mock.method(Medico_1.default, 'findById', async () => crearMedico({ especialidades: [primera, segunda] }));
    node_test_1.mock.method(Turno_1.default, 'find', async (filtro) => {
        filtroTurnos = filtro;
        return [
            {
                fechaTurno: fechaLocal('09:00'),
                fechaFin: fechaLocal('09:30'),
            },
        ];
    });
    node_test_1.mock.method(Especialidad_1.default, 'exists', async () => ({ _id: segunda }));
    const resultado = await (0, disponibilidad_service_1.obtenerDisponibilidad)(MEDICO_ID, '2026-11-02', {
        zonaHoraria: ZONA,
        ahora: new Date('2026-11-02T03:00:00.000Z'),
        especialidadId: segunda.toString(),
        validarEspecialidadActiva: true,
    });
    // La ocupación se evalúa por médico, sin filtrar por especialidad.
    strict_1.default.equal(filtroTurnos !== undefined &&
        'especialidad' in filtroTurnos, false);
    strict_1.default.equal(resultado.horarios.some((horario) => horario.horaLocal === '09:00'), false);
});
// ============================================================
// VALIDACIÓN DE UN HORARIO CONCRETO
// ============================================================
(0, node_test_1.test)('acepta un horario alineado dentro del intervalo', () => {
    const fin = (0, disponibilidad_service_1.validarHorarioDisponible)(crearMedico(), fechaLocal('08:00'), [], ZONA);
    strict_1.default.equal(fin.toISOString(), '2026-11-02T11:30:00.000Z');
});
(0, node_test_1.test)('acepta el último turno que termina justo al cierre', () => {
    const fin = (0, disponibilidad_service_1.validarHorarioDisponible)(crearMedico(), fechaLocal('11:30'), [], ZONA);
    strict_1.default.equal(fin.toISOString(), '2026-11-02T15:00:00.000Z');
});
(0, node_test_1.test)('rechaza un horario fuera de los intervalos', () => {
    strict_1.default.throws(() => (0, disponibilidad_service_1.validarHorarioDisponible)(crearMedico(), fechaLocal('12:00'), [], ZONA), (error) => error instanceof Error &&
        error.message === turno_messages_1.MENSAJES_TURNO.FUERA_DE_HORARIO);
});
(0, node_test_1.test)('rechaza un día en el que el médico no atiende', () => {
    strict_1.default.throws(() => (0, disponibilidad_service_1.validarHorarioDisponible)(crearMedico(), new Date('2026-11-03T12:00:00.000Z'), [], ZONA), (error) => error instanceof Error &&
        error.message === turno_messages_1.MENSAJES_TURNO.NO_ATIENDE_ESE_DIA);
});
(0, node_test_1.test)('detecta superposición aunque la hora de inicio sea distinta', () => {
    const ocupados = [
        {
            inicio: fechaLocal('08:45'),
            fin: fechaLocal('09:15'),
        },
    ];
    strict_1.default.throws(() => (0, disponibilidad_service_1.validarHorarioDisponible)(crearMedico(), fechaLocal('09:00'), ocupados, ZONA), (error) => error instanceof Error &&
        error.message === turno_messages_1.MENSAJES_TURNO.HORARIO_OCUPADO);
});
(0, node_test_1.test)('permite un turno que empieza cuando termina el anterior', () => {
    const ocupados = [
        {
            inicio: fechaLocal('09:00'),
            fin: fechaLocal('09:30'),
        },
    ];
    const fin = (0, disponibilidad_service_1.validarHorarioDisponible)(crearMedico(), fechaLocal('09:30'), ocupados, ZONA);
    strict_1.default.equal(fin.toISOString(), '2026-11-02T13:00:00.000Z');
});
