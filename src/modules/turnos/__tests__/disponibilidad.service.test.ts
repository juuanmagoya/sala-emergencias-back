import assert from 'node:assert/strict';
import { afterEach, test, mock } from 'node:test';

import mongoose from 'mongoose';

import MedicoModel from '../../medico/models/Medico';
import TurnoModel from '../models/Turno';

import {
    generarHorariosDelDia,
    obtenerDisponibilidad,
    validarHorarioDisponible,
} from '../services/disponibilidad.service';

import { MENSAJES_TURNO } from '../constants/turno.messages';

import type { IMedico } from '../../medico/interfaces/Medico.interface';
import type {
    IntervaloTurno,
    MedicoDocumento,
} from '../services/disponibilidad.service';

const ZONA = 'America/Argentina/Buenos_Aires';
const MEDICO_ID = '507f1f77bcf86cd799439013';
const ESPECIALIDAD_ID = '507f1f77bcf86cd799439012';

const crearMedico = (
    overrides: Partial<IMedico> = {}
): MedicoDocumento =>
    ({
        _id: new mongoose.Types.ObjectId(MEDICO_ID),
        nombre: 'ANA',
        apellido: 'PEREZ',
        matricula: '123456',
        especialidad: new mongoose.Types.ObjectId(
            ESPECIALIDAD_ID
        ),
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
    }) as unknown as MedicoDocumento;

const fechaLocal = (
    hora: string
): Date => new Date(`2026-11-02T${hora}:00.000-03:00`);

afterEach(() => {
    mock.restoreAll();
});

// ============================================================
// GENERACIÓN DE HORARIOS
// ============================================================

test('genera horarios de 30 minutos en ambos intervalos del lunes', async () => {
    const medico = crearMedico();

    mock.method(MedicoModel, 'findById', async () => medico);
    mock.method(TurnoModel, 'find', async () => []);

    const resultado = await obtenerDisponibilidad(
        MEDICO_ID,
        '2026-11-02',
        {
            zonaHoraria: ZONA,
            ahora: new Date('2026-11-02T03:00:00.000Z'),
        }
    );

    assert.equal(resultado.horarios.length, 16);
    assert.equal(resultado.duracionTurno, 30);
    assert.equal(resultado.horarios[0]?.horaLocal, '08:00');
    assert.equal(
        resultado.horarios[0]?.inicio.toISOString(),
        '2026-11-02T11:00:00.000Z'
    );

    const ultimoDeLaManana = resultado.horarios[7];

    assert.equal(ultimoDeLaManana?.horaLocal, '11:30');
    assert.equal(
        ultimoDeLaManana?.fin.toISOString(),
        '2026-11-02T15:00:00.000Z'
    );

    const primeroDeLaTarde = resultado.horarios[8];

    assert.equal(primeroDeLaTarde?.horaLocal, '16:00');
    assert.equal(
        primeroDeLaTarde?.fin.toISOString(),
        '2026-11-02T19:30:00.000Z'
    );

    assert.equal(
        resultado.horarios.some(
            (horario) =>
                horario.horaLocal === '12:00' ||
                horario.horaLocal === '15:30'
        ),
        false
    );
});

test('respeta la duración configurada por cada médico', () => {
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

    const horarios = generarHorariosDelDia(
        medico,
        { anio: 2026, mes: 11, dia: 2 },
        ZONA
    );

    assert.deepEqual(
        horarios.map((horario) => horario.horaLocal),
        ['08:00', '08:45']
    );
    assert.equal(
        horarios[1]?.fin.toISOString(),
        '2026-11-02T12:30:00.000Z'
    );
});

test('no ofrece turnos que terminen después del cierre', () => {
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

    const horarios = generarHorariosDelDia(
        medico,
        { anio: 2026, mes: 11, dia: 2 },
        ZONA
    );

    assert.deepEqual(
        horarios.map((horario) => horario.horaLocal),
        ['08:00', '08:40', '09:20']
    );
    assert.equal(
        horarios.at(-1)?.fin.toISOString(),
        '2026-11-02T13:00:00.000Z'
    );
});

test('devuelve una lista vacía si el médico no atiende ese día', async () => {
    const medico = crearMedico();

    mock.method(MedicoModel, 'findById', async () => medico);
    mock.method(TurnoModel, 'find', async () => []);

    const resultado = await obtenerDisponibilidad(
        MEDICO_ID,
        '2026-11-01',
        { zonaHoraria: ZONA }
    );

    assert.deepEqual(resultado.horarios, []);
});

test('excluye los horarios ocupados y conserva los adyacentes', async () => {
    const medico = crearMedico();

    mock.method(MedicoModel, 'findById', async () => medico);
    mock.method(TurnoModel, 'find', async () => [
        {
            fechaTurno: fechaLocal('09:00'),
            fechaFin: fechaLocal('09:30'),
        },
    ]);

    const resultado = await obtenerDisponibilidad(
        MEDICO_ID,
        '2026-11-02',
        {
            zonaHoraria: ZONA,
            ahora: new Date('2026-11-02T03:00:00.000Z'),
        }
    );

    assert.equal(
        resultado.horarios.some(
            (horario) => horario.horaLocal === '09:00'
        ),
        false
    );
    assert.equal(
        resultado.horarios.some(
            (horario) => horario.horaLocal === '09:30'
        ),
        true
    );
    assert.equal(
        resultado.horarios.some(
            (horario) => horario.horaLocal === '08:30'
        ),
        true
    );
});

test('los turnos cancelados no bloquean la agenda', async () => {
    const medico = crearMedico();
    let filtroConsultado: Record<string, unknown> | undefined;

    mock.method(MedicoModel, 'findById', async () => medico);
    mock.method(
        TurnoModel,
        'find',
        async (filtro: Record<string, unknown>) => {
            filtroConsultado = filtro;
            return [];
        }
    );

    const resultado = await obtenerDisponibilidad(
        MEDICO_ID,
        '2026-11-02',
        {
            zonaHoraria: ZONA,
            ahora: new Date('2026-11-02T03:00:00.000Z'),
        }
    );

    assert.deepEqual(filtroConsultado?.estado, {
        $ne: 'cancelado',
    });
    assert.deepEqual(filtroConsultado?.activo, {
        $ne: false,
    });
    assert.equal(resultado.horarios.length, 16);
});

test('un médico inactivo no tiene disponibilidad', async () => {
    const medico = crearMedico({ activo: false });

    mock.method(MedicoModel, 'findById', async () => medico);

    await assert.rejects(
        obtenerDisponibilidad(MEDICO_ID, '2026-11-02', {
            zonaHoraria: ZONA,
        }),
        (error: unknown) =>
            error instanceof Error &&
            error.message === MENSAJES_TURNO.MEDICO_INACTIVO
    );
});

test('rechaza una fecha de consulta inválida', async () => {
    await assert.rejects(
        obtenerDisponibilidad(MEDICO_ID, '2026-02-30', {
            zonaHoraria: ZONA,
        }),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                MENSAJES_TURNO.FECHA_CONSULTA_INVALIDA
    );
});

test('no ofrece horarios de una fecha ya pasada', async () => {
    const medico = crearMedico();

    mock.method(MedicoModel, 'findById', async () => medico);
    mock.method(TurnoModel, 'find', async () => []);

    const resultado = await obtenerDisponibilidad(
        MEDICO_ID,
        '2026-10-26',
        {
            zonaHoraria: ZONA,
            ahora: new Date('2026-11-02T03:00:00.000Z'),
        }
    );

    assert.deepEqual(resultado.horarios, []);
});

// ============================================================
// VALIDACIÓN DE UN HORARIO CONCRETO
// ============================================================

test('acepta un horario alineado dentro del intervalo', () => {
    const fin = validarHorarioDisponible(
        crearMedico(),
        fechaLocal('08:00'),
        [],
        ZONA
    );

    assert.equal(fin.toISOString(), '2026-11-02T11:30:00.000Z');
});

test('acepta el último turno que termina justo al cierre', () => {
    const fin = validarHorarioDisponible(
        crearMedico(),
        fechaLocal('11:30'),
        [],
        ZONA
    );

    assert.equal(fin.toISOString(), '2026-11-02T15:00:00.000Z');
});

test('rechaza un horario fuera de los intervalos', () => {
    assert.throws(
        () =>
            validarHorarioDisponible(
                crearMedico(),
                fechaLocal('12:00'),
                [],
                ZONA
            ),
        (error: unknown) =>
            error instanceof Error &&
            error.message === MENSAJES_TURNO.FUERA_DE_HORARIO
    );
});


test('rechaza un día en el que el médico no atiende', () => {
    assert.throws(
        () =>
            validarHorarioDisponible(
                crearMedico(),
                new Date('2026-11-03T12:00:00.000Z'),
                [],
                ZONA
            ),
        (error: unknown) =>
            error instanceof Error &&
            error.message === MENSAJES_TURNO.NO_ATIENDE_ESE_DIA
    );
});

test('detecta superposición aunque la hora de inicio sea distinta', () => {
    const ocupados: IntervaloTurno[] = [
        {
            inicio: fechaLocal('08:45'),
            fin: fechaLocal('09:15'),
        },
    ];

    assert.throws(
        () =>
            validarHorarioDisponible(
                crearMedico(),
                fechaLocal('09:00'),
                ocupados,
                ZONA
            ),
        (error: unknown) =>
            error instanceof Error &&
            error.message === MENSAJES_TURNO.HORARIO_OCUPADO
    );
});

test('permite un turno que empieza cuando termina el anterior', () => {
    const ocupados: IntervaloTurno[] = [
        {
            inicio: fechaLocal('09:00'),
            fin: fechaLocal('09:30'),
        },
    ];

    const fin = validarHorarioDisponible(
        crearMedico(),
        fechaLocal('09:30'),
        ocupados,
        ZONA
    );

    assert.equal(fin.toISOString(), '2026-11-02T13:00:00.000Z');
});
