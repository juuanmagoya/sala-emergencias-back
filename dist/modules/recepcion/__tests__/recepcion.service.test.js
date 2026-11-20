"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const mongoose_1 = __importDefault(require("mongoose"));
const Paciente_1 = __importDefault(require("../../pacientes/models/Paciente"));
const Turno_1 = __importDefault(require("../../turnos/models/Turno"));
const turno_service_1 = __importDefault(require("../../turnos/services/turno.service"));
const recepcion_service_1 = __importDefault(require("../services/recepcion.service"));
const PACIENTE_ID = '507f1f77bcf86cd799439011';
const ESPECIALIDAD_ID = '507f1f77bcf86cd799439012';
const MEDICO_ID = '507f1f77bcf86cd799439013';
const TURNO_ID = '507f1f77bcf86cd799439015';
const crearIngreso = (datosPaciente = {}) => ({
    datosPaciente: {
        nombre: '  Juan Pérez  ',
        dni: '12345678',
        telefono: {
            codigoArea: '11',
            numero: '12345678',
        },
        ...datosPaciente,
    },
    especialidad: ESPECIALIDAD_ID,
    medico: MEDICO_ID,
    fechaTurno: '2026-11-02T09:00',
    observaciones: '  control  ',
});
const crearSession = () => {
    const session = {
        startTransaction: node_test_1.mock.fn(),
        commitTransaction: node_test_1.mock.fn(async () => undefined),
        abortTransaction: node_test_1.mock.fn(async () => undefined),
        endSession: node_test_1.mock.fn(async () => undefined),
    };
    node_test_1.mock.method(mongoose_1.default, 'startSession', async () => session);
    return session;
};
const prepararConsultaTurno = (turnoCompleto) => {
    const consulta = Promise.resolve(turnoCompleto);
    consulta.populate = () => consulta;
    node_test_1.mock.method(Turno_1.default, 'findById', () => consulta);
};
(0, node_test_1.afterEach)(() => {
    node_test_1.mock.restoreAll();
});
// ============================================================
// ALTA MÍNIMA
// ============================================================
(0, node_test_1.test)('crea el paciente con lista blanca y el turno dentro de la transacción', async () => {
    const session = crearSession();
    const turnoCompleto = {
        _id: TURNO_ID,
        estado: 'pendiente',
    };
    let datosPacienteCreados;
    let datosTurnoCreados;
    node_test_1.mock.method(Paciente_1.default, 'create', async (datos, opciones) => {
        datosPacienteCreados = datos[0];
        strict_1.default.equal(opciones.session, session);
        return [
            {
                _id: new mongoose_1.default.Types.ObjectId(PACIENTE_ID),
                ...datos[0],
            },
        ];
    });
    node_test_1.mock.method(turno_service_1.default, 'createTurno', async (datos, opciones) => {
        datosTurnoCreados = datos;
        strict_1.default.equal(opciones.session, session);
        strict_1.default.equal(opciones.validarPaciente, false);
        strict_1.default.equal(opciones.poblarRespuesta, false);
        return { _id: new mongoose_1.default.Types.ObjectId(TURNO_ID) };
    });
    prepararConsultaTurno(turnoCompleto);
    const resultado = await recepcion_service_1.default.registrarIngreso(crearIngreso({
        email: 'ignorado@ejemplo.com',
        direccion: { calle: 'Ignorada', numero: '1' },
        obraSocial: { nombre: 'OSDE' },
        fechaFin: '2026-11-02T09:30',
        estado: 'atendido',
        activo: false,
    }));
    strict_1.default.equal(resultado, turnoCompleto);
    strict_1.default.equal(datosPacienteCreados?.nombre, 'JUAN PÉREZ');
    strict_1.default.deepEqual(datosPacienteCreados?.telefono, {
        codigoArea: '11',
        numero: '12345678',
        tipo: 'CELULAR',
    });
    strict_1.default.deepEqual(datosPacienteCreados?.obraSocial, {
        nombre: 'NINGUNA',
    });
    strict_1.default.equal('email' in (datosPacienteCreados ?? {}), false);
    strict_1.default.equal('direccion' in (datosPacienteCreados ?? {}), false);
    strict_1.default.equal('fechaFin' in (datosPacienteCreados ?? {}), false);
    strict_1.default.equal('estado' in (datosPacienteCreados ?? {}), false);
    strict_1.default.equal('activo' in (datosPacienteCreados ?? {}), false);
    strict_1.default.equal(datosTurnoCreados?.paciente, String(datosPacienteCreados?._id));
    strict_1.default.equal(datosTurnoCreados?.especialidad, ESPECIALIDAD_ID);
    strict_1.default.equal(datosTurnoCreados?.medico, MEDICO_ID);
    strict_1.default.equal(datosTurnoCreados?.fechaTurno, '2026-11-02T09:00');
    strict_1.default.equal(datosTurnoCreados?.observaciones, '  control  ');
    strict_1.default.equal(session.startTransaction.mock.callCount(), 1);
    strict_1.default.equal(session.commitTransaction.mock.callCount(), 1);
    strict_1.default.equal(session.abortTransaction.mock.callCount(), 0);
    strict_1.default.equal(session.endSession.mock.callCount(), 1);
});
// ============================================================
// VALIDACIONES
// ============================================================
(0, node_test_1.test)('rechaza un DNI inválido antes de abrir la transacción', async () => {
    await strict_1.default.rejects(recepcion_service_1.default.registrarIngreso(crearIngreso({ dni: '123' })), (error) => {
        strict_1.default.ok(error instanceof mongoose_1.default.Error.ValidationError);
        strict_1.default.ok(error.errors.dni);
        return true;
    });
});
(0, node_test_1.test)('rechaza un teléfono incompleto antes de abrir la transacción', async () => {
    await strict_1.default.rejects(recepcion_service_1.default.registrarIngreso(crearIngreso({ telefono: { codigoArea: '11' } })), (error) => {
        strict_1.default.ok(error instanceof mongoose_1.default.Error.ValidationError);
        strict_1.default.ok(error.errors['telefono.numero']);
        return true;
    });
});
// ============================================================
// TRANSACCIÓN Y ERRORES
// ============================================================
(0, node_test_1.test)('revierte la transacción si falla la creación del turno', async () => {
    const session = crearSession();
    const errorTurno = new Error('fallo al crear el turno');
    node_test_1.mock.method(Paciente_1.default, 'create', async (datos) => [
        {
            _id: new mongoose_1.default.Types.ObjectId(PACIENTE_ID),
            ...datos[0],
        },
    ]);
    node_test_1.mock.method(turno_service_1.default, 'createTurno', async () => {
        throw errorTurno;
    });
    await strict_1.default.rejects(recepcion_service_1.default.registrarIngreso(crearIngreso()), (error) => error === errorTurno);
    strict_1.default.equal(session.startTransaction.mock.callCount(), 1);
    strict_1.default.equal(session.commitTransaction.mock.callCount(), 0);
    strict_1.default.equal(session.abortTransaction.mock.callCount(), 1);
    strict_1.default.equal(session.endSession.mock.callCount(), 1);
});
(0, node_test_1.test)('propaga el duplicado de DNI y revierte la transacción', async () => {
    const session = crearSession();
    const errorDuplicado = Object.assign(new Error('duplicado'), {
        code: 11000,
        keyPattern: { dni: 1 },
        keyValue: { dni: '12345678' },
    });
    node_test_1.mock.method(Paciente_1.default, 'create', async () => {
        throw errorDuplicado;
    });
    await strict_1.default.rejects(recepcion_service_1.default.registrarIngreso(crearIngreso()), (error) => error === errorDuplicado);
    strict_1.default.equal(session.commitTransaction.mock.callCount(), 0);
    strict_1.default.equal(session.abortTransaction.mock.callCount(), 1);
    strict_1.default.equal(session.endSession.mock.callCount(), 1);
});
