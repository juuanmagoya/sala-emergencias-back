import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, test } from 'node:test';

import PacienteModel from '../../modules/pacientes/models/Paciente';

// ============================================================
// SERVIDOR REAL CON EL LIMITADOR DE LOGIN
// ============================================================

const JWT_SECRET_PRUEBA = 'secreto-de-prueba-paciente-limite';

process.env.JWT_SECRET = JWT_SECRET_PRUEBA;
process.env.LOGIN_RATE_LIMIT_MAX = '5';
process.env.LOGIN_RATE_LIMIT_WINDOW_MS = '60000';

// Importación diferida: el limitador lee el entorno al cargarse.
const app = require('../../app').default as typeof import('../../app').default;

const servidor = app.listen(0);
const { port } = servidor.address() as AddressInfo;
const urlBase = `http://127.0.0.1:${port}`;

after(() => {
    servidor.close();
});

// ============================================================
// HELPERS
// ============================================================

type ConsultaPacientes = Promise<unknown[]> & {
    select: () => ConsultaPacientes;
    limit: () => ConsultaPacientes;
};

const crearConsulta = (resultado: unknown[]): ConsultaPacientes => {
    const consulta = Promise.resolve(resultado) as ConsultaPacientes;

    consulta.select = () => consulta;
    consulta.limit = () => consulta;

    return consulta;
};

const modeloPaciente = PacienteModel as unknown as {
    find: (filtro: unknown) => ConsultaPacientes;
};

modeloPaciente.find = () => crearConsulta([]);

const intentarLoginPaciente = () =>
    fetch(`${urlBase}/api/v1/auth/paciente/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            dni: '30123456',
            telefono: '3777-1234567',
        }),
    });

// ============================================================
// LÍMITE DE INTENTOS
// ============================================================

test('el login de pacientes aplica el limitador de intentos', async () => {
    const estados: number[] = [];

    for (let intento = 0; intento < 6; intento += 1) {
        const respuesta = await intentarLoginPaciente();

        estados.push(respuesta.status);

        if (intento === 5) {
            const cuerpo = (await respuesta.json()) as Record<
                string,
                unknown
            >;

            assert.equal(cuerpo.success, false);
            assert.equal(cuerpo.data, null);
            assert.equal(typeof cuerpo.timestamp, 'string');
            assert.match(
                String(cuerpo.message),
                /Demasiados intentos/
            );
        }
    }

    assert.deepEqual(estados, [401, 401, 401, 401, 401, 429]);
});
