import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import {
    LIMITE_LOGIN_POR_DEFECTO,
    VENTANA_LOGIN_POR_DEFECTO_MS,
    ZONA_HORARIA_POR_DEFECTO,
    validarConfiguracion,
} from '../entorno';
import ErrorConfiguracion from '../../utils/ErrorConfiguracion';

// ============================================================
// PRESERVACIÓN DEL ENTORNO
// ============================================================

const VARIABLES = [
    'JWT_SECRET',
    'DATABASE_URL_ATLAS',
    'PORT',
    'LOGIN_RATE_LIMIT_MAX',
    'LOGIN_RATE_LIMIT_WINDOW_MS',
    'ZONA_HORARIA',
] as const;

const entornoOriginal = new Map<string, string | undefined>(
    VARIABLES.map((variable) => [variable, process.env[variable]])
);

afterEach(() => {
    for (const variable of VARIABLES) {
        const valor = entornoOriginal.get(variable);

        if (valor === undefined) {
            delete process.env[variable];

            continue;
        }

        process.env[variable] = valor;
    }
});

const configurarEntornoValido = () => {
    process.env.JWT_SECRET = 'secreto-de-prueba';
    process.env.DATABASE_URL_ATLAS = 'mongodb://localhost/prueba';

    delete process.env.PORT;
    delete process.env.LOGIN_RATE_LIMIT_MAX;
    delete process.env.LOGIN_RATE_LIMIT_WINDOW_MS;
    delete process.env.ZONA_HORARIA;
};

// ============================================================
// VALIDACIÓN AL INICIAR
// ============================================================

test('acepta una configuración válida y aplica valores por defecto', () => {
    configurarEntornoValido();

    const configuracion = validarConfiguracion();

    assert.equal(configuracion.puerto, 3000);
    assert.equal(
        configuracion.limiteIntentosLogin,
        LIMITE_LOGIN_POR_DEFECTO
    );
    assert.equal(
        configuracion.ventanaLimiteLoginMs,
        VENTANA_LOGIN_POR_DEFECTO_MS
    );
    assert.equal(
        configuracion.zonaHoraria,
        ZONA_HORARIA_POR_DEFECTO
    );
});

test('falla de forma explícita si falta JWT_SECRET', () => {
    configurarEntornoValido();

    delete process.env.JWT_SECRET;

    assert.throws(
        () => validarConfiguracion(),
        (error: unknown) => {
            assert.ok(error instanceof ErrorConfiguracion);

            return true;
        }
    );
});

test('falla si el límite de login no es un entero positivo', () => {
    configurarEntornoValido();

    process.env.LOGIN_RATE_LIMIT_MAX = '0';

    assert.throws(
        () => validarConfiguracion(),
        (error: unknown) => {
            assert.ok(error instanceof ErrorConfiguracion);
            assert.match(
                (error as Error).message,
                /LOGIN_RATE_LIMIT_MAX/
            );

            return true;
        }
    );
});

test('respeta los valores configurados por entorno', () => {
    configurarEntornoValido();

    process.env.PORT = '4100';
    process.env.LOGIN_RATE_LIMIT_MAX = '3';
    process.env.LOGIN_RATE_LIMIT_WINDOW_MS = '60000';
    process.env.ZONA_HORARIA = 'America/Argentina/Cordoba';

    const configuracion = validarConfiguracion();

    assert.equal(configuracion.puerto, 4100);
    assert.equal(configuracion.limiteIntentosLogin, 3);
    assert.equal(configuracion.ventanaLimiteLoginMs, 60000);
    assert.equal(
        configuracion.zonaHoraria,
        'America/Argentina/Cordoba'
    );
});

test('falla si la zona horaria configurada no es válida', () => {
    configurarEntornoValido();

    process.env.ZONA_HORARIA = 'Zona/Inexistente';

    assert.throws(
        () => validarConfiguracion(),
        (error: unknown) => {
            assert.ok(error instanceof ErrorConfiguracion);
            assert.match(
                (error as Error).message,
                /ZONA_HORARIA/
            );

            return true;
        }
    );
});
