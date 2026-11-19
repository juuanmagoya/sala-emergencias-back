import assert from 'node:assert/strict';
import { afterEach, test, mock } from 'node:test';

import type { Response } from 'express';

import { MENSAJES_TURNO } from '../constants/turno.messages';
import { responderErrorTurno } from '../utils/responderErrorTurno';

interface CuerpoRespuesta {
    success?: boolean;
    message?: string;
    data?: unknown;
}

const crearRespuesta = () => {
    let status = 0;
    let cuerpo: CuerpoRespuesta = {};

    const res = {
        status(codigo: number) {
            status = codigo;
            return res;
        },
        json(datos: CuerpoRespuesta) {
            cuerpo = datos;
            return res;
        },
    };

    return {
        res: res as unknown as Response,
        obtener: () => ({ status, cuerpo }),
    };
};

const crearDuplicado = (
    keyPattern?: Record<string, unknown>,
    keyValue?: Record<string, unknown>
) =>
    Object.assign(new Error('duplicado'), {
        code: 11000,
        keyPattern,
        keyValue,
    });

afterEach(() => {
    mock.restoreAll();
});

// ============================================================
// DUPLICADOS DE PACIENTE
// ============================================================

test('identifica un DNI duplicado sin informarlo como horario ocupado', () => {
    const { res, obtener } = crearRespuesta();

    responderErrorTurno(
        res,
        crearDuplicado({ dni: 1 }, { dni: '12345678' }),
        'Error al registrar el ingreso'
    );

    const { status, cuerpo } = obtener();

    assert.equal(status, 400);
    assert.equal(cuerpo.success, false);
    assert.equal(cuerpo.message, 'El DNI ya está registrado');
    assert.equal(
        cuerpo.data,
        'Ya existe un paciente registrado con ese DNI'
    );
});

test('identifica un email duplicado usando keyValue', () => {
    const { res, obtener } = crearRespuesta();

    responderErrorTurno(
        res,
        crearDuplicado(undefined, {
            email: 'paciente@ejemplo.com',
        }),
        'Error al registrar el ingreso'
    );

    const { status, cuerpo } = obtener();

    assert.equal(status, 400);
    assert.equal(
        cuerpo.message,
        'El correo electrónico ya está registrado'
    );
    assert.equal(
        cuerpo.data,
        'Ya existe un paciente registrado con ese correo electrónico'
    );
});

// ============================================================
// DUPLICADOS DE TURNO
// ============================================================

test('identifica la colisión del índice medico+fechaTurno', () => {
    const { res, obtener } = crearRespuesta();

    responderErrorTurno(
        res,
        crearDuplicado(
            { medico: 1, fechaTurno: 1 },
            {
                medico: '507f1f77bcf86cd799439013',
                fechaTurno: '2026-11-02T12:00:00.000Z',
            }
        ),
        'Error al registrar el turno'
    );

    const { status, cuerpo } = obtener();

    assert.equal(status, 409);
    assert.equal(cuerpo.message, MENSAJES_TURNO.HORARIO_OCUPADO);
});

test('no oculta un duplicado de un índice desconocido', () => {
    mock.method(console, 'error', () => undefined);

    const { res, obtener } = crearRespuesta();

    responderErrorTurno(
        res,
        crearDuplicado({ otraClave: 1 }),
        'Error al registrar el ingreso'
    );

    const { status, cuerpo } = obtener();

    assert.equal(status, 500);
    assert.equal(cuerpo.message, 'Error al registrar el ingreso');
});
