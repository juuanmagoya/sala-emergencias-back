import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, test } from 'node:test';

import express from 'express';

import { crearLimitadorLogin } from '../limitadorLogin.middleware';

// ============================================================
// HELPERS
// ============================================================

interface ServidorPrueba {
    urlBase: string;
    cerrar: () => void;
}

const crearServidor = (estado: number, limite: number): ServidorPrueba => {
    const app = express();

    app.use(express.json());

    app.post(
        '/login',
        crearLimitadorLogin({ limite, ventanaMs: 60_000 }),
        (_req, res) => res.status(estado).json({ success: estado < 400 })
    );

    const servidor = app.listen(0);
    const { port } = servidor.address() as AddressInfo;

    return {
        urlBase: `http://127.0.0.1:${port}`,
        cerrar: () => servidor.close(),
    };
};

const intentarLogin = (urlBase: string) =>
    fetch(`${urlBase}/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            email: 'prueba@sala.com',
            password: 'incorrecta',
        }),
    });

// ============================================================
// LÍMITE DE INTENTOS
// ============================================================

test('bloquea con 429 cuando se superan los intentos fallidos', async () => {
    const servidor = crearServidor(401, 3);

    try {
        const estados: number[] = [];

        for (let intento = 0; intento < 4; intento += 1) {
            const respuesta = await intentarLogin(servidor.urlBase);

            estados.push(respuesta.status);

            if (intento === 3) {
                const cuerpo = (await respuesta.json()) as Record<
                    string,
                    unknown
                >;

                assert.equal(cuerpo.success, false);
                assert.equal(cuerpo.data, null);
                assert.equal(typeof cuerpo.timestamp, 'string');
                assert.equal(typeof cuerpo.message, 'string');
                assert.match(
                    String(cuerpo.message),
                    /Demasiados intentos/
                );
            }
        }

        assert.deepEqual(estados, [401, 401, 401, 429]);

    } finally {
        servidor.cerrar();
    }
});

test('los inicios de sesión exitosos no consumen el límite', async () => {
    const servidor = crearServidor(200, 2);

    try {
        const estados: number[] = [];

        for (let intento = 0; intento < 5; intento += 1) {
            const respuesta = await intentarLogin(servidor.urlBase);

            estados.push(respuesta.status);

            // Deja que el limitador procese el decremento del éxito.
            await new Promise((resolver) => setTimeout(resolver, 10));
        }

        assert.deepEqual(estados, [200, 200, 200, 200, 200]);

    } finally {
        servidor.cerrar();
    }
});
