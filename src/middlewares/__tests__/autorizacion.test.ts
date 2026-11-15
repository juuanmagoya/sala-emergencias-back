import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, afterEach, test } from 'node:test';

import express from 'express';
import jwt from 'jsonwebtoken';

import authMiddleware from '../auth.middleware';
import autorizarRoles from '../autorizarRoles.middleware';
import PacienteModel from '../../modules/pacientes/models/Paciente';
import type { RolUsuario } from '../../modules/usuario/types/usuario.types';

// ============================================================
// SERVIDOR DE PRUEBA
// ============================================================

const JWT_SECRET_PRUEBA = 'secreto-de-prueba-autorizacion';

process.env.JWT_SECRET = JWT_SECRET_PRUEBA;

const app = express();

app.use(express.json());

// Ruta de prueba: solo administración.
app.get(
    '/solo-admin',
    authMiddleware,
    autorizarRoles('admin'),
    (_req, res) => res.status(200).json({ success: true })
);

// Ruta de prueba: personal médico (la administración también accede).
app.get(
    '/clinico',
    authMiddleware,
    autorizarRoles('medico', 'admin'),
    (_req, res) => res.status(200).json({ success: true })
);

// Ruta de prueba: exclusiva de pacientes autenticados.
app.get(
    '/solo-paciente',
    authMiddleware,
    autorizarRoles('paciente'),
    (_req, res) => res.status(200).json({ success: true })
);

// Autorización montada sin autenticación previa.
app.get(
    '/sin-autenticacion',
    autorizarRoles('admin'),
    (_req, res) => res.status(200).json({ success: true })
);

const servidor = app.listen(0);
const { port } = servidor.address() as AddressInfo;
const urlBase = `http://127.0.0.1:${port}`;

after(() => {
    servidor.close();
});

// ============================================================
// HELPERS
// ============================================================

const crearToken = (
    rol: RolUsuario,
    secreto: string = JWT_SECRET_PRUEBA
) =>
    jwt.sign(
        {
            id: '507f1f77bcf86cd799439011',
            email: 'prueba@sala.com',
            rol,
        },
        secreto,
        { expiresIn: '1h' }
    );

const crearTokenInternoConTipo = (rol: RolUsuario) =>
    jwt.sign(
        {
            tipo: 'usuario',
            id: '507f1f77bcf86cd799439011',
            email: 'prueba@sala.com',
            rol,
        },
        JWT_SECRET_PRUEBA,
        { expiresIn: '1h' }
    );

const crearTokenPaciente = (
    rol: string = 'paciente',
    id: string = '507f1f77bcf86cd799439012'
) =>
    jwt.sign(
        {
            tipo: 'paciente',
            id,
            rol,
        },
        JWT_SECRET_PRUEBA,
        { expiresIn: '1h' }
    );

type ModeloPacienteSuplantado = {
    exists: (filtro: unknown) => Promise<unknown>;
};

const modeloPaciente = PacienteModel as unknown as ModeloPacienteSuplantado;
const existsOriginal = modeloPaciente.exists;

afterEach(() => {
    modeloPaciente.exists = existsOriginal;
});

const habilitarPacienteExistente = () => {
    modeloPaciente.exists = async () => ({
        _id: '507f1f77bcf86cd799439012',
    });
};

const solicitar = (ruta: string, token?: string) =>
    fetch(`${urlBase}${ruta}`, {
        headers: token
            ? { authorization: `Bearer ${token}` }
            : {},
    });

const verificarFormatoEstandar = (cuerpo: Record<string, unknown>) => {
    assert.equal(typeof cuerpo.success, 'boolean');
    assert.equal(typeof cuerpo.timestamp, 'string');
    assert.equal(typeof cuerpo.message, 'string');
    assert.ok('total' in cuerpo);
    assert.ok('data' in cuerpo);
};

// ============================================================
// AUTENTICACIÓN
// ============================================================

test('rechaza con 401 una ruta protegida sin token', async () => {
    const respuesta = await solicitar('/solo-admin');
    const cuerpo = await respuesta.json() as Record<string, unknown>;

    assert.equal(respuesta.status, 401);
    assert.equal(cuerpo.success, false);
    assert.equal(cuerpo.data, null);
    verificarFormatoEstandar(cuerpo);
});

test('rechaza con 401 un token inválido', async () => {
    const respuesta = await solicitar('/solo-admin', 'token-invalido');
    const cuerpo = await respuesta.json() as Record<string, unknown>;

    assert.equal(respuesta.status, 401);
    assert.equal(cuerpo.success, false);
    verificarFormatoEstandar(cuerpo);
});

test('rechaza con 401 un token firmado con otro secreto', async () => {
    const tokenFalso = crearToken('admin', 'otro-secreto');

    const respuesta = await solicitar('/solo-admin', tokenFalso);

    assert.equal(respuesta.status, 401);
});

test('rechaza con 401 un token sin rol en el payload', async () => {
    const tokenSinRol = jwt.sign(
        {
            id: '507f1f77bcf86cd799439011',
            email: 'prueba@sala.com',
        },
        JWT_SECRET_PRUEBA,
        { expiresIn: '1h' }
    );

    const respuesta = await solicitar('/solo-admin', tokenSinRol);

    assert.equal(respuesta.status, 401);
});

// ============================================================
// AUTORIZACIÓN
// ============================================================

test('permite el acceso a un usuario con el rol autorizado', async () => {
    const respuesta = await solicitar('/solo-admin', crearToken('admin'));

    assert.equal(respuesta.status, 200);
});

test('rechaza con 403 a un usuario autenticado sin el rol requerido', async () => {
    const respuesta = await solicitar(
        '/solo-admin',
        crearToken('recepcionista')
    );
    const cuerpo = await respuesta.json() as Record<string, unknown>;

    assert.equal(respuesta.status, 403);
    assert.equal(cuerpo.success, false);
    assert.equal(cuerpo.data, null);
    verificarFormatoEstandar(cuerpo);
});

test('admite varios roles permitidos en una misma ruta', async () => {
    const respuestaMedico = await solicitar(
        '/clinico',
        crearToken('medico')
    );
    const respuestaAdmin = await solicitar(
        '/clinico',
        crearToken('admin')
    );
    const respuestaRecepcion = await solicitar(
        '/clinico',
        crearToken('recepcionista')
    );

    assert.equal(respuestaMedico.status, 200);
    assert.equal(respuestaAdmin.status, 200);
    assert.equal(respuestaRecepcion.status, 403);
});

test('responde 401 si la autorización corre sin autenticación previa', async () => {
    const respuesta = await solicitar(
        '/sin-autenticacion',
        crearToken('admin')
    );

    assert.equal(respuesta.status, 401);
});

// ============================================================
// IDENTIDAD DE PACIENTE
// ============================================================

test('permite el acceso a un paciente autenticado', async () => {
    habilitarPacienteExistente();

    const respuesta = await solicitar(
        '/solo-paciente',
        crearTokenPaciente()
    );

    assert.equal(respuesta.status, 200);
});

test('rechaza a un paciente si el documento ya no existe', async () => {
    modeloPaciente.exists = async () => null;

    const respuesta = await solicitar(
        '/solo-paciente',
        crearTokenPaciente()
    );

    assert.equal(respuesta.status, 401);
});

test('rechaza a un paciente en una ruta de administración', async () => {
    habilitarPacienteExistente();

    const respuesta = await solicitar(
        '/solo-admin',
        crearTokenPaciente()
    );

    assert.equal(respuesta.status, 403);
});

test('rechaza a un usuario interno en una ruta de paciente', async () => {
    const respuesta = await solicitar(
        '/solo-paciente',
        crearToken('admin')
    );

    assert.equal(respuesta.status, 403);
});

test('rechaza un token de paciente con un rol elevado', async () => {
    habilitarPacienteExistente();

    const respuesta = await solicitar(
        '/solo-admin',
        crearTokenPaciente('admin')
    );

    assert.equal(respuesta.status, 401);
});

test('rechaza un token interno que se declara paciente', async () => {
    const token = jwt.sign(
        {
            tipo: 'usuario',
            id: '507f1f77bcf86cd799439011',
            email: 'prueba@sala.com',
            rol: 'paciente',
        },
        JWT_SECRET_PRUEBA,
        { expiresIn: '1h' }
    );

    const respuesta = await solicitar('/solo-paciente', token);

    assert.equal(respuesta.status, 401);
});

test('sigue aceptando tokens internos nuevos con tipo usuario', async () => {
    const respuesta = await solicitar(
        '/solo-admin',
        crearTokenInternoConTipo('admin')
    );

    assert.equal(respuesta.status, 200);
});
