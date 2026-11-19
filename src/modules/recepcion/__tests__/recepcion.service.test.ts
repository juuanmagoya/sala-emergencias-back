import assert from 'node:assert/strict';
import { afterEach, test, mock } from 'node:test';

import mongoose from 'mongoose';

import PacienteModel from '../../pacientes/models/Paciente';
import TurnoModel from '../../turnos/models/Turno';
import turnoService from '../../turnos/services/turno.service';

import recepcionService from '../services/recepcion.service';

import type { ClientSession } from 'mongoose';
import type { CrearIngresoDTO } from '../dtos/CrearIngresoDTO';

const PACIENTE_ID = '507f1f77bcf86cd799439011';
const ESPECIALIDAD_ID = '507f1f77bcf86cd799439012';
const MEDICO_ID = '507f1f77bcf86cd799439013';
const TURNO_ID = '507f1f77bcf86cd799439015';

const crearIngreso = (
    datosPaciente: Record<string, unknown> = {}
): CrearIngresoDTO =>
    ({
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
    }) as unknown as CrearIngresoDTO;

const crearSession = () => {
    const session = {
        startTransaction: mock.fn(),
        commitTransaction: mock.fn(async () => undefined),
        abortTransaction: mock.fn(async () => undefined),
        endSession: mock.fn(async () => undefined),
    };

    mock.method(
        mongoose,
        'startSession',
        async () => session as unknown as ClientSession
    );

    return session;
};

const prepararConsultaTurno = (
    turnoCompleto: Record<string, unknown>
) => {
    const consulta = Promise.resolve(
        turnoCompleto
    ) as unknown as Promise<Record<string, unknown>> & {
        populate: () => typeof consulta;
    };

    consulta.populate = () => consulta;

    mock.method(TurnoModel, 'findById', () => consulta);
};

afterEach(() => {
    mock.restoreAll();
});

// ============================================================
// ALTA MÍNIMA
// ============================================================

test('crea el paciente con lista blanca y el turno dentro de la transacción', async () => {
    const session = crearSession();
    const turnoCompleto = {
        _id: TURNO_ID,
        estado: 'pendiente',
    };

    let datosPacienteCreados: Record<string, unknown> | undefined;
    let datosTurnoCreados: Record<string, unknown> | undefined;

    mock.method(
        PacienteModel,
        'create',
        async (
            datos: Array<Record<string, unknown>>,
            opciones: { session: ClientSession }
        ) => {
            datosPacienteCreados = datos[0];

            assert.equal(opciones.session, session);

            return [
                {
                    _id: new mongoose.Types.ObjectId(PACIENTE_ID),
                    ...datos[0],
                },
            ];
        }
    );

    mock.method(
        turnoService,
        'createTurno',
        async (
            datos: Record<string, unknown>,
            opciones: Record<string, unknown>
        ) => {
            datosTurnoCreados = datos;

            assert.equal(opciones.session, session);
            assert.equal(opciones.validarPaciente, false);
            assert.equal(opciones.poblarRespuesta, false);

            return { _id: new mongoose.Types.ObjectId(TURNO_ID) };
        }
    );

    prepararConsultaTurno(turnoCompleto);

    const resultado = await recepcionService.registrarIngreso(
        crearIngreso({
            email: 'ignorado@ejemplo.com',
            direccion: { calle: 'Ignorada', numero: '1' },
            obraSocial: { nombre: 'OSDE' },
            fechaFin: '2026-11-02T09:30',
            estado: 'atendido',
            activo: false,
        })
    );

    assert.equal(resultado, turnoCompleto);
    assert.equal(datosPacienteCreados?.nombre, 'JUAN PÉREZ');
    assert.deepEqual(datosPacienteCreados?.telefono, {
        codigoArea: '11',
        numero: '12345678',
        tipo: 'CELULAR',
    });
    assert.deepEqual(datosPacienteCreados?.obraSocial, {
        nombre: 'NINGUNA',
    });
    assert.equal('email' in (datosPacienteCreados ?? {}), false);
    assert.equal('direccion' in (datosPacienteCreados ?? {}), false);
    assert.equal('fechaFin' in (datosPacienteCreados ?? {}), false);
    assert.equal('estado' in (datosPacienteCreados ?? {}), false);
    assert.equal('activo' in (datosPacienteCreados ?? {}), false);

    assert.equal(
        datosTurnoCreados?.paciente,
        String(datosPacienteCreados?._id)
    );
    assert.equal(datosTurnoCreados?.especialidad, ESPECIALIDAD_ID);
    assert.equal(datosTurnoCreados?.medico, MEDICO_ID);
    assert.equal(datosTurnoCreados?.fechaTurno, '2026-11-02T09:00');
    assert.equal(datosTurnoCreados?.observaciones, '  control  ');

    assert.equal(session.startTransaction.mock.callCount(), 1);
    assert.equal(session.commitTransaction.mock.callCount(), 1);
    assert.equal(session.abortTransaction.mock.callCount(), 0);
    assert.equal(session.endSession.mock.callCount(), 1);
});

// ============================================================
// VALIDACIONES
// ============================================================

test('rechaza un DNI inválido antes de abrir la transacción', async () => {
    await assert.rejects(
        recepcionService.registrarIngreso(
            crearIngreso({ dni: '123' })
        ),
        (error: unknown) => {
            assert.ok(
                error instanceof mongoose.Error.ValidationError
            );
            assert.ok(error.errors.dni);

            return true;
        }
    );
});

test('rechaza un teléfono incompleto antes de abrir la transacción', async () => {
    await assert.rejects(
        recepcionService.registrarIngreso(
            crearIngreso({ telefono: { codigoArea: '11' } })
        ),
        (error: unknown) => {
            assert.ok(
                error instanceof mongoose.Error.ValidationError
            );
            assert.ok(error.errors['telefono.numero']);

            return true;
        }
    );
});

// ============================================================
// TRANSACCIÓN Y ERRORES
// ============================================================

test('revierte la transacción si falla la creación del turno', async () => {
    const session = crearSession();
    const errorTurno = new Error('fallo al crear el turno');

    mock.method(
        PacienteModel,
        'create',
        async (datos: Array<Record<string, unknown>>) => [
            {
                _id: new mongoose.Types.ObjectId(PACIENTE_ID),
                ...datos[0],
            },
        ]
    );

    mock.method(turnoService, 'createTurno', async () => {
        throw errorTurno;
    });

    await assert.rejects(
        recepcionService.registrarIngreso(crearIngreso()),
        (error: unknown) => error === errorTurno
    );

    assert.equal(session.startTransaction.mock.callCount(), 1);
    assert.equal(session.commitTransaction.mock.callCount(), 0);
    assert.equal(session.abortTransaction.mock.callCount(), 1);
    assert.equal(session.endSession.mock.callCount(), 1);
});

test('propaga el duplicado de DNI y revierte la transacción', async () => {
    const session = crearSession();
    const errorDuplicado = Object.assign(
        new Error('duplicado'),
        {
            code: 11000,
            keyPattern: { dni: 1 },
            keyValue: { dni: '12345678' },
        }
    );

    mock.method(PacienteModel, 'create', async () => {
        throw errorDuplicado;
    });

    await assert.rejects(
        recepcionService.registrarIngreso(crearIngreso()),
        (error: unknown) => error === errorDuplicado
    );

    assert.equal(session.commitTransaction.mock.callCount(), 0);
    assert.equal(session.abortTransaction.mock.callCount(), 1);
    assert.equal(session.endSession.mock.callCount(), 1);
});
