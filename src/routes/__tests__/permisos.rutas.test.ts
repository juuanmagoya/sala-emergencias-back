import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, afterEach, test } from 'node:test';

import jwt from 'jsonwebtoken';

import app from '../../app';
import historiaClinicaService from '../../modules/historiaclinica/services/historiaclinica.service';
import recepcionService from '../../modules/recepcion/services/recepcion.service';
import turnoService from '../../modules/turnos/services/turno.service';
import type { RolUsuario } from '../../modules/usuario/types/usuario.types';

// ============================================================
// SERVIDOR REAL CON TODAS LAS RUTAS MONTADAS
// ============================================================

const JWT_SECRET_PRUEBA = 'secreto-de-prueba-permisos';

// auth.middleware lee el secreto en cada request, por lo que alcanza con
// definirlo después de importar la app.
process.env.JWT_SECRET = JWT_SECRET_PRUEBA;

const servidor = app.listen(0);
const { port } = servidor.address() as AddressInfo;
const urlBase = `http://127.0.0.1:${port}`;

after(() => {
    servidor.close();
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

interface OpcionesSolicitud {
    token?: string;
    encabezadoAuthorization?: string;
    cuerpo?: unknown;
}

const solicitar = (
    metodo: string,
    ruta: string,
    opciones: OpcionesSolicitud = {}
) => {
    const headers: Record<string, string> = {};

    if (opciones.token) {
        headers.authorization = `Bearer ${opciones.token}`;
    }

    if (opciones.encabezadoAuthorization) {
        headers.authorization = opciones.encabezadoAuthorization;
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

const leerCuerpo = async (respuesta: Response) =>
    (await respuesta.json()) as Record<string, unknown>;

const verificarFormatoEstandar = (cuerpo: Record<string, unknown>) => {
    assert.equal(typeof cuerpo.success, 'boolean');
    assert.equal(typeof cuerpo.timestamp, 'string');
    assert.equal(typeof cuerpo.message, 'string');
    assert.ok('total' in cuerpo);
    assert.ok('data' in cuerpo);
};

// ============================================================
// SUPLANTACIÓN DE SERVICIOS (evita depender de MongoDB)
// ============================================================

type ServicioTurnos = {
    createTurno: (datos: unknown) => Promise<unknown>;
    deleteTurno: (id: string) => Promise<unknown>;
    getDisponibilidad: (
        medicoId: string,
        fecha: string
    ) => Promise<unknown>;
    getTurnosDelMedico: (idUsuario: string) => Promise<unknown>;
};

type ServicioRecepcion = {
    registrarIngreso: (datos: unknown) => Promise<unknown>;
};

type ServicioHistoriaClinica = {
    getHistoriasClinicas: (filtro: unknown) => Promise<unknown>;
};

const turnos = turnoService as unknown as ServicioTurnos;
const recepcion = recepcionService as unknown as ServicioRecepcion;
const historias = historiaClinicaService as unknown as ServicioHistoriaClinica;

const turnosOriginal = {
    createTurno: turnos.createTurno,
    deleteTurno: turnos.deleteTurno,
    getDisponibilidad: turnos.getDisponibilidad,
    getTurnosDelMedico: turnos.getTurnosDelMedico,
};

const recepcionOriginal = {
    registrarIngreso: recepcion.registrarIngreso,
};

const historiasOriginal = {
    getHistoriasClinicas: historias.getHistoriasClinicas,
};

afterEach(() => {
    turnos.createTurno = turnosOriginal.createTurno;
    turnos.deleteTurno = turnosOriginal.deleteTurno;
    turnos.getDisponibilidad = turnosOriginal.getDisponibilidad;
    turnos.getTurnosDelMedico = turnosOriginal.getTurnosDelMedico;
    recepcion.registrarIngreso = recepcionOriginal.registrarIngreso;
    historias.getHistoriasClinicas =
        historiasOriginal.getHistoriasClinicas;
});

// ============================================================
// AUTENTICACIÓN Y RUTAS PÚBLICAS
// ============================================================

test('una ruta protegida rechaza solicitudes sin token', async () => {
    const respuesta = await solicitar('GET', '/api/v1/medicos');
    const cuerpo = await leerCuerpo(respuesta);

    assert.equal(respuesta.status, 401);
    assert.equal(cuerpo.success, false);
    verificarFormatoEstandar(cuerpo);
});

test('una ruta protegida rechaza un JWT inválido', async () => {
    const respuesta = await solicitar('GET', '/api/v1/medicos', {
        token: 'token-invalido',
    });

    assert.equal(respuesta.status, 401);
});

test('las rutas públicas de autenticación siguen funcionando', async () => {
    const loginSinPassword = await solicitar('POST', '/api/v1/auth/login', {
        cuerpo: { email: 'prueba@sala.com' },
    });

    const registroSinDatos = await solicitar(
        'POST',
        '/api/v1/auth/register',
        { cuerpo: {} }
    );

    // Llegan al controller (400 de validación), no al middleware de auth (401).
    assert.equal(loginSinPassword.status, 400);
    assert.equal(registroSinDatos.status, 400);

    verificarFormatoEstandar(await leerCuerpo(loginSinPassword));
    verificarFormatoEstandar(await leerCuerpo(registroSinDatos));
});

// ============================================================
// RUTAS ADMINISTRATIVAS
// ============================================================

test('una ruta administrativa rechaza a médicos y recepcionistas', async () => {
    const respuestaMedico = await solicitar(
        'POST',
        '/api/v1/medicos',
        { token: crearToken('medico'), cuerpo: {} }
    );

    const respuestaRecepcion = await solicitar(
        'POST',
        '/api/v1/medicos',
        { token: crearToken('recepcionista'), cuerpo: {} }
    );

    assert.equal(respuestaMedico.status, 403);
    assert.equal(respuestaRecepcion.status, 403);

    const cuerpo = await leerCuerpo(respuestaMedico);

    assert.equal(cuerpo.success, false);
    assert.equal(cuerpo.data, null);
    verificarFormatoEstandar(cuerpo);
});

// ============================================================
// RECEPCIÓN
// ============================================================

test('las operaciones de recepción aplican los permisos definidos', async () => {
    let ingresos = 0;

    recepcion.registrarIngreso = async () => {
        ingresos += 1;

        return { id: 'turno-de-prueba' };
    };

    const respuestaRecepcion = await solicitar(
        'POST',
        '/api/v1/recepcion',
        { token: crearToken('recepcionista'), cuerpo: {} }
    );

    const respuestaAdmin = await solicitar(
        'POST',
        '/api/v1/recepcion',
        { token: crearToken('admin'), cuerpo: {} }
    );

    const respuestaMedico = await solicitar(
        'POST',
        '/api/v1/recepcion',
        { token: crearToken('medico'), cuerpo: {} }
    );

    assert.equal(respuestaRecepcion.status, 201);
    assert.equal(respuestaAdmin.status, 201);
    assert.equal(respuestaMedico.status, 403);
    assert.equal(ingresos, 2);
});

// ============================================================
// HISTORIAS CLÍNICAS
// ============================================================

test('las historias clínicas no son accesibles para recepción', async () => {
    historias.getHistoriasClinicas = async () => [];

    const respuestaRecepcion = await solicitar(
        'GET',
        '/api/v1/historias-clinicas',
        { token: crearToken('recepcionista') }
    );

    const respuestaMedico = await solicitar(
        'GET',
        '/api/v1/historias-clinicas',
        { token: crearToken('medico') }
    );

    assert.equal(respuestaRecepcion.status, 403);
    assert.equal(respuestaMedico.status, 200);
});

// ============================================================
// TURNOS Y MECANISMO HEREDADO token123
// ============================================================

test('la credencial heredada token123 no permite eludir la autorización', async () => {
    const respuesta = await solicitar('POST', '/api/v1/turnos', {
        encabezadoAuthorization: 'token123',
        cuerpo: {},
    });

    assert.equal(respuesta.status, 401);

    const cuerpo = await leerCuerpo(respuesta);

    assert.equal(cuerpo.success, false);
    verificarFormatoEstandar(cuerpo);
});

test('crear turnos exige JWT y el rol de recepción o administración', async () => {
    let turnosCreados = 0;

    turnos.createTurno = async () => {
        turnosCreados += 1;

        return { id: 'turno-de-prueba' };
    };

    const respuestaMedico = await solicitar(
        'POST',
        '/api/v1/turnos',
        { token: crearToken('medico'), cuerpo: {} }
    );

    const respuestaRecepcion = await solicitar(
        'POST',
        '/api/v1/turnos',
        { token: crearToken('recepcionista'), cuerpo: {} }
    );

    const respuestaAdmin = await solicitar(
        'POST',
        '/api/v1/turnos',
        { token: crearToken('admin'), cuerpo: {} }
    );

    assert.equal(respuestaMedico.status, 403);
    assert.equal(respuestaRecepcion.status, 201);
    assert.equal(respuestaAdmin.status, 201);
    assert.equal(turnosCreados, 2);
});

test('cancelar turnos está reservado a recepción y administración', async () => {
    turnos.deleteTurno = async (id: string) => ({ id });

    const ruta = '/api/v1/turnos/507f1f77bcf86cd799439011';

    const respuestaMedico = await solicitar('DELETE', ruta, {
        token: crearToken('medico'),
    });

    const respuestaRecepcion = await solicitar('DELETE', ruta, {
        token: crearToken('recepcionista'),
    });

    assert.equal(respuestaMedico.status, 403);
    assert.equal(respuestaRecepcion.status, 200);
});

test('la consulta de disponibilidad está disponible para los roles asistenciales', async () => {
    let consultas = 0;

    turnos.getDisponibilidad = async () => {
        consultas += 1;

        return { horarios: [] };
    };

    const ruta =
        '/api/v1/turnos/disponibilidad?medicoId=507f1f77bcf86cd799439013&fecha=2026-11-02';

    for (const rol of [
        'admin',
        'medico',
        'recepcionista',
    ] as const) {
        const respuesta = await solicitar('GET', ruta, {
            token: crearToken(rol),
        });

        assert.equal(respuesta.status, 200);
    }

    assert.equal(consultas, 3);
});

test('mis-turnos solo permite el rol médico y resuelve el perfil del token', async () => {
    let consultas = 0;

    turnos.getTurnosDelMedico = async (idUsuario: string) => {
        consultas += 1;
        assert.equal(idUsuario, '507f1f77bcf86cd799439011');

        return [];
    };

    const respuestaRecepcion = await solicitar(
        'GET',
        '/api/v1/turnos/mis-turnos',
        { token: crearToken('recepcionista') }
    );

    const respuestaAdmin = await solicitar(
        'GET',
        '/api/v1/turnos/mis-turnos',
        { token: crearToken('admin') }
    );

    const respuestaMedico = await solicitar(
        'GET',
        '/api/v1/turnos/mis-turnos',
        { token: crearToken('medico') }
    );

    assert.equal(respuestaRecepcion.status, 403);
    assert.equal(respuestaAdmin.status, 403);
    assert.equal(respuestaMedico.status, 200);
    assert.equal(consultas, 1);
});
