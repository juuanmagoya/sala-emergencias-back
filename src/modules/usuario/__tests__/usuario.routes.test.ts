import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, afterEach, test, mock } from 'node:test';

import jwt from 'jsonwebtoken';

import app from '../../../app';
import usuarioService from '../services/usuario.service';
import type { RolUsuario } from '../types/usuario.types';

// ============================================================
// SERVIDOR DE PRUEBA
// ============================================================

const JWT_SECRET_PRUEBA = 'secreto-de-prueba-usuarios';

process.env.JWT_SECRET = JWT_SECRET_PRUEBA;

const servidor = app.listen(0);
const { port } = servidor.address() as AddressInfo;
const urlBase = `http://127.0.0.1:${port}`;

after(() => {
    servidor.close();
});

afterEach(() => {
    mock.restoreAll();
});

// ============================================================
// HELPERS
// ============================================================

const crearToken = (rol: RolUsuario) =>
    jwt.sign(
        {
            id: '507f1f77bcf86cd799439011',
            email: 'prueba@sala.com',
            rol,
        },
        JWT_SECRET_PRUEBA,
        { expiresIn: '1h' }
    );

const solicitar = (
    metodo: string,
    ruta: string,
    opciones: {
        token?: string;
        cuerpo?: unknown;
    } = {}
) => {
    const headers: Record<string, string> = {};

    if (opciones.token) {
        headers.authorization = `Bearer ${opciones.token}`;
    }

    if (opciones.cuerpo !== undefined) {
        headers['content-type'] = 'application/json';
    }

    return fetch(`${urlBase}${ruta}`, {
        method: metodo,
        headers,
        body:
            opciones.cuerpo === undefined
                ? undefined
                : JSON.stringify(opciones.cuerpo),
    });
};

// ============================================================
// AUTENTICACIÓN Y AUTORIZACIÓN
// ============================================================

test('el CRUD de usuarios exige autenticación', async () => {
    const respuesta = await solicitar('GET', '/api/v1/usuarios');

    assert.equal(respuesta.status, 401);
});

test('el CRUD de usuarios está reservado a administración', async () => {
    const respuestaMedico = await solicitar(
        'POST',
        '/api/v1/usuarios',
        {
            token: crearToken('medico'),
            cuerpo: {},
        }
    );

    const respuestaRecepcion = await solicitar(
        'GET',
        '/api/v1/usuarios',
        { token: crearToken('recepcionista') }
    );

    assert.equal(respuestaMedico.status, 403);
    assert.equal(respuestaRecepcion.status, 403);
});

// ============================================================
// OPERACIONES ADMINISTRATIVAS
// ============================================================

test('un administrador puede crear y listar usuarios', async () => {
    const crearUsuarioMock = mock.method(
        usuarioService,
        'createUsuario',
        async () => ({ id: 'usuario-de-prueba' })
    );

    mock.method(
        usuarioService,
        'getUsuarios',
        async () => []
    );

    const respuestaCreacion = await solicitar(
        'POST',
        '/api/v1/usuarios',
        {
            token: crearToken('admin'),
            cuerpo: {
                nombre: 'Recepción',
                email: 'recepcion@prueba.com',
                password: 'secreto123',
                rol: 'recepcionista',
            },
        }
    );

    const respuestaListado = await solicitar(
        'GET',
        '/api/v1/usuarios',
        { token: crearToken('admin') }
    );

    assert.equal(respuestaCreacion.status, 201);
    assert.equal(respuestaListado.status, 200);
    assert.equal(crearUsuarioMock.mock.callCount(), 1);
});

test('un administrador puede consultar y desactivar un usuario', async () => {
    const id = '507f1f77bcf86cd799439012';
    let idConsultado: string | undefined;
    let idDesactivado: string | undefined;

    mock.method(
        usuarioService,
        'getUsuarioById',
        async (usuarioId: string) => {
            idConsultado = usuarioId;

            return { id: usuarioId };
        }
    );

    mock.method(
        usuarioService,
        'desactivarUsuario',
        async (usuarioId: string) => {
            idDesactivado = usuarioId;

            return { id: usuarioId, activo: false };
        }
    );

    const respuestaConsulta = await solicitar(
        'GET',
        `/api/v1/usuarios/${id}`,
        { token: crearToken('admin') }
    );

    const respuestaBaja = await solicitar(
        'DELETE',
        `/api/v1/usuarios/${id}`,
        { token: crearToken('admin') }
    );

    assert.equal(respuestaConsulta.status, 200);
    assert.equal(respuestaBaja.status, 200);
    assert.equal(idConsultado, id);
    assert.equal(idDesactivado, id);
});
