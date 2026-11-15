import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, afterEach, beforeEach, test, mock } from 'node:test';

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import app from '../../../app';

import MedicoModel from '../../medico/models/Medico';
import PacienteModel from '../../pacientes/models/Paciente';
import UsuarioModel from '../../usuario/models/Usuario';
import TurnoModel from '../models/Turno';
import turnoService from '../services/turno.service';

import { MENSAJES_TURNO } from '../constants/turno.messages';

import type { RolUsuario } from '../../usuario/types/usuario.types';

// ============================================================
// CONFIGURACIÓN
// ============================================================

const JWT_SECRET_PRUEBA = 'secreto-de-prueba-historial-turnos';

const PACIENTE_ID = '507f1f77bcf86cd799439011';
const OTRO_PACIENTE_ID = '507f1f77bcf86cd799439099';
const ESPECIALIDAD_ID = '507f1f77bcf86cd799439012';
const MEDICO_ID = '507f1f77bcf86cd799439013';
const TURNO_ID = '507f1f77bcf86cd799439015';
const OTRO_TURNO_ID = '507f1f77bcf86cd799439016';

process.env.JWT_SECRET = JWT_SECRET_PRUEBA;

const servidor = app.listen(0);
const { port } = servidor.address() as AddressInfo;
const urlBase = `http://127.0.0.1:${port}`;

after(() => {
    servidor.close();
});

// ============================================================
// HELPERS DE CONSULTA SIMULADA
//
// Reproducen la cadena de Mongoose y aplican la proyección y los
// populate declarados por el servicio, para que las pruebas del
// endpoint verifiquen la forma real de la respuesta.
// ============================================================

interface RegistroConsulta {
    filtro?: unknown;
    seleccion?: string;
    orden?: unknown;
    populates: Array<{ ruta: string; campos?: string }>;
}

type ConsultaSimulada = Promise<unknown[]> & {
    select: (campos: string) => ConsultaSimulada;
    sort: (orden: unknown) => ConsultaSimulada;
    populate: (ruta: string, campos?: string) => ConsultaSimulada;
};

const proyectarDocumento = (
    documento: Record<string, unknown>,
    campos: string
): Record<string, unknown> => {
    const resultado: Record<string, unknown> = {};

    for (const campo of campos.split(/\s+/)) {
        if (campo === 'id') {
            continue;
        }

        // Una proyección por inclusión no agrega claves ausentes.
        if (campo in documento) {
            resultado[campo] = documento[campo];
        }
    }

    if ('id' in documento) {
        resultado.id = documento.id;
    }

    return resultado;
};

const crearConsulta = (
    documentos: Array<Record<string, unknown>>,
    registro: RegistroConsulta
): ConsultaSimulada => {
    const resolver = () =>
        documentos.map((documento) => {
            const resultado: Record<string, unknown> = {
                ...documento,
            };

            for (const populate of registro.populates) {
                const valor = resultado[populate.ruta];

                if (
                    valor &&
                    typeof valor === 'object' &&
                    typeof populate.campos === 'string'
                ) {
                    resultado[populate.ruta] = proyectarDocumento(
                        valor as Record<string, unknown>,
                        populate.campos
                    );
                }
            }

            if (registro.seleccion) {
                return proyectarDocumento(
                    resultado,
                    registro.seleccion
                );
            }

            return resultado;
        });

    // La resolución ocurre en un microtask: para entonces el servicio
    // ya ejecutó select, populate y sort de forma sincrónica.
    const consulta = Promise.resolve().then(
        resolver
    ) as ConsultaSimulada;

    consulta.select = (campos) => {
        registro.seleccion = campos;
        return consulta;
    };
    consulta.sort = (orden) => {
        registro.orden = orden;
        return consulta;
    };
    consulta.populate = (ruta, campos) => {
        registro.populates.push({ ruta, campos });
        return consulta;
    };

    return consulta;
};

// ============================================================
// HELPERS DE DATOS
// ============================================================

let registro: RegistroConsulta;

const prepararConsulta = (
    documentos: Array<Record<string, unknown>>
) => {
    mock.method(
        TurnoModel as any,
        'find',
        (filtro: unknown) => {
            registro.filtro = filtro;
            return crearConsulta(documentos, registro);
        }
    );
};

const crearTokenPaciente = (id: string): string =>
    jwt.sign(
        { tipo: 'paciente', id, rol: 'paciente' },
        JWT_SECRET_PRUEBA,
        { expiresIn: '1h' }
    );

const crearTokenInterno = (rol: RolUsuario): string =>
    jwt.sign(
        {
            tipo: 'usuario',
            id: new mongoose.Types.ObjectId().toString(),
            email: 'prueba@sala.com',
            rol,
        },
        JWT_SECRET_PRUEBA,
        { expiresIn: '1h' }
    );

const solicitar = (
    metodo: string,
    ruta: string,
    opciones: { token?: string } = {}
): Promise<Response> => {
    const headers: Record<string, string> = {};

    if (opciones.token) {
        headers.authorization = `Bearer ${opciones.token}`;
    }

    return fetch(`${urlBase}${ruta}`, { method: metodo, headers });
};

const leerCuerpo = async (
    respuesta: Response
): Promise<Record<string, any>> =>
    (await respuesta.json()) as Record<string, any>;

const RUTA_HISTORIAL = '/api/v1/turnos/mi-historial';

beforeEach(() => {
    registro = { populates: [] };

    // El middleware de autenticación de pacientes valida que exista.
    mock.method(PacienteModel, 'exists', async () => ({
        _id: PACIENTE_ID,
    }));
});

afterEach(() => {
    mock.restoreAll();
});

// ============================================================
// SERVICIO: CONSULTA DEL HISTORIAL
// ============================================================

test('getHistorialDelPaciente filtra exclusivamente por el paciente autenticado', async () => {
    prepararConsulta([]);

    await turnoService.getHistorialDelPaciente(PACIENTE_ID);

    assert.deepEqual(registro.filtro, { paciente: PACIENTE_ID });
    assert.equal(
        'activo' in (registro.filtro as Record<string, unknown>),
        false
    );
    assert.equal(
        'estado' in (registro.filtro as Record<string, unknown>),
        false
    );
});

test('getHistorialDelPaciente ordena por fecha descendente y usa una proyección por lista blanca', async () => {
    prepararConsulta([]);

    await turnoService.getHistorialDelPaciente(PACIENTE_ID);

    assert.deepEqual(registro.orden, { fechaTurno: -1 });
    assert.equal(
        registro.seleccion,
        'fechaTurno fechaFin estado observaciones especialidad medico'
    );
});

test('getHistorialDelPaciente popula solo datos públicos de especialidad y médico', async () => {
    prepararConsulta([]);

    await turnoService.getHistorialDelPaciente(PACIENTE_ID);

    assert.deepEqual(registro.populates, [
        { ruta: 'especialidad', campos: 'nombre' },
        {
            ruta: 'medico',
            campos: 'nombre apellido matricula',
        },
    ]);
    assert.equal(
        registro.populates.some(
            (populate) => populate.ruta === 'paciente'
        ),
        false
    );
});

test('getHistorialDelPaciente devuelve pendientes, atendidos y cancelados', async () => {
    prepararConsulta([
        {
            id: TURNO_ID,
            fechaTurno: '2035-01-01T12:00:00.000Z',
            estado: 'pendiente',
        },
        {
            id: OTRO_TURNO_ID,
            fechaTurno: '2034-06-10T13:00:00.000Z',
            estado: 'atendido',
        },
        {
            id: '507f1f77bcf86cd799439017',
            fechaTurno: '2033-03-10T13:00:00.000Z',
            estado: 'cancelado',
        },
    ]);

    const resultado = (await turnoService.getHistorialDelPaciente(
        PACIENTE_ID
    )) as unknown as Array<Record<string, unknown>>;

    assert.equal(resultado.length, 3);
    assert.deepEqual(
        resultado.map((turno) => turno.estado),
        ['pendiente', 'atendido', 'cancelado']
    );
});

test('getHistorialDelPaciente incluye los turnos cancelados con activo false', async () => {
    prepararConsulta([
        {
            id: TURNO_ID,
            fechaTurno: '2034-06-10T13:00:00.000Z',
            estado: 'cancelado',
            activo: false,
        },
    ]);

    const resultado = (await turnoService.getHistorialDelPaciente(
        PACIENTE_ID
    )) as unknown as Array<Record<string, unknown>>;

    // El filtro no restringe `activo`: la baja lógica no oculta el turno.
    assert.deepEqual(registro.filtro, { paciente: PACIENTE_ID });
    assert.equal(resultado.length, 1);
    assert.equal(resultado[0].estado, 'cancelado');
});

test('getHistorialDelPaciente devuelve un arreglo vacío si el paciente no tiene turnos', async () => {
    prepararConsulta([]);

    const resultado = await turnoService.getHistorialDelPaciente(
        PACIENTE_ID
    );

    assert.deepEqual(resultado, []);
});

test('getHistorialDelPaciente rechaza un identificador inválido', async () => {
    await assert.rejects(
        turnoService.getHistorialDelPaciente(
            'no-es-un-object-id'
        ),
        (error: unknown) =>
            error instanceof Error &&
            error.message ===
                MENSAJES_TURNO.PACIENTE_ID_INVALIDO
    );
});

test('getHistorialDelPaciente tolera referencias que ya no pueden resolverse', async () => {
    prepararConsulta([
        {
            id: TURNO_ID,
            fechaTurno: '2034-06-10T13:00:00.000Z',
            estado: 'atendido',
            especialidad: null,
            medico: null,
        },
    ]);

    const resultado = (await turnoService.getHistorialDelPaciente(
        PACIENTE_ID
    )) as unknown as Array<Record<string, unknown>>;

    assert.equal(resultado.length, 1);
    assert.equal(resultado[0].especialidad, null);
    assert.equal(resultado[0].medico, null);
});

test('getHistorialDelPaciente tolera documentos legacy con campos ausentes', async () => {
    prepararConsulta([
        {
            id: TURNO_ID,
            fechaTurno: '2020-01-06T12:00:00.000Z',
        },
    ]);

    const resultado = (await turnoService.getHistorialDelPaciente(
        PACIENTE_ID
    )) as unknown as Array<Record<string, unknown>>;

    assert.equal(resultado.length, 1);
    assert.equal('estado' in resultado[0], false);
    assert.equal('fechaFin' in resultado[0], false);
    assert.equal('medico' in resultado[0], false);
    assert.equal('especialidad' in resultado[0], false);
});

// ============================================================
// ENDPOINT: AUTORIZACIÓN
// ============================================================

test('GET /turnos/mi-historial rechaza solicitudes sin token', async () => {
    const respuesta = await solicitar('GET', RUTA_HISTORIAL);

    assert.equal(respuesta.status, 401);
});

test('GET /turnos/mi-historial rechaza un token inválido', async () => {
    const respuesta = await solicitar('GET', RUTA_HISTORIAL, {
        token: 'token-invalido',
    });

    assert.equal(respuesta.status, 401);
});

test('GET /turnos/mi-historial rechaza un token expirado', async () => {
    const tokenExpirado = jwt.sign(
        { tipo: 'paciente', id: PACIENTE_ID, rol: 'paciente' },
        JWT_SECRET_PRUEBA,
        { expiresIn: '-1s' }
    );

    const respuesta = await solicitar('GET', RUTA_HISTORIAL, {
        token: tokenExpirado,
    });

    assert.equal(respuesta.status, 401);
});

test('GET /turnos/mi-historial rechaza un token de paciente inexistente', async () => {
    mock.method(PacienteModel, 'exists', async () => null);

    const respuesta = await solicitar('GET', RUTA_HISTORIAL, {
        token: crearTokenPaciente(PACIENTE_ID),
    });

    assert.equal(respuesta.status, 401);
});

test('GET /turnos/mi-historial rechaza a los roles internos', async () => {
    for (const rol of [
        'admin',
        'medico',
        'recepcionista',
    ] as const) {
        const respuesta = await solicitar('GET', RUTA_HISTORIAL, {
            token: crearTokenInterno(rol),
        });

        assert.equal(
            respuesta.status,
            403,
            `El rol ${rol} no debería acceder`
        );
    }
});

// ============================================================
// ENDPOINT: CONTRATO DE RESPUESTA
// ============================================================

test('GET /turnos/mi-historial devuelve el historial del paciente autenticado', async () => {
    prepararConsulta([
        {
            id: TURNO_ID,
            paciente: {
                id: PACIENTE_ID,
                dni: '12345678',
                email: 'paciente@sala.com',
                telefono: { codigoArea: '11', numero: '12345678' },
                obraSocial: { nombre: 'OSDE' },
            },
            especialidad: {
                id: ESPECIALIDAD_ID,
                nombre: 'CARDIOLOGIA',
                descripcion: 'Corazón',
                codigo: 'CARD',
                activo: true,
                createdAt: '2024-01-01T00:00:00.000Z',
            },
            medico: {
                id: MEDICO_ID,
                nombre: 'ANA',
                apellido: 'PEREZ',
                matricula: '123456',
                email: 'ana@sala.com',
                telefono: { codigoArea: '11', numero: '87654321' },
                consultorios: ['consultorio-1'],
                horariosAtencion: [],
                activo: true,
            },
            fechaTurno: '2035-01-01T12:00:00.000Z',
            fechaFin: '2035-01-01T12:30:00.000Z',
            estado: 'pendiente',
            observaciones: 'control',
            activo: false,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
            __v: 0,
        },
        {
            id: OTRO_TURNO_ID,
            paciente: { id: PACIENTE_ID, dni: '12345678' },
            especialidad: {
                id: ESPECIALIDAD_ID,
                nombre: 'CARDIOLOGIA',
                activo: true,
            },
            medico: null,
            fechaTurno: '2034-06-10T13:00:00.000Z',
            fechaFin: '2034-06-10T13:30:00.000Z',
            estado: 'cancelado',
            activo: false,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
            __v: 0,
        },
    ]);

    const respuesta = await solicitar(
        'GET',
        `${RUTA_HISTORIAL}?pacienteId=${OTRO_PACIENTE_ID}&paciente=${OTRO_PACIENTE_ID}`,
        { token: crearTokenPaciente(PACIENTE_ID) }
    );
    const body = await leerCuerpo(respuesta);

    assert.equal(respuesta.status, 200);
    assert.equal(body.success, true);
    assert.equal(
        body.message,
        'Historial de turnos obtenido exitosamente'
    );
    assert.equal(body.total, 2);
    assert.equal(body.data.length, 2);

    // El identificador sale del JWT, no de los query params.
    assert.deepEqual(registro.filtro, { paciente: PACIENTE_ID });
});

test('GET /turnos/mi-historial ignora el identificador enviado por query', async () => {
    prepararConsulta([]);

    for (const query of [
        '',
        `?pacienteId=${OTRO_PACIENTE_ID}`,
        `?paciente=${OTRO_PACIENTE_ID}`,
    ]) {
        const respuesta = await solicitar(
            'GET',
            `${RUTA_HISTORIAL}${query}`,
            { token: crearTokenPaciente(PACIENTE_ID) }
        );

        assert.equal(respuesta.status, 200);
        assert.deepEqual(
            registro.filtro,
            { paciente: PACIENTE_ID },
            `El query "${query}" no debería alterar el paciente`
        );
    }
});

test('GET /turnos/mi-historial responde un arreglo vacío sin turnos', async () => {
    prepararConsulta([]);

    const respuesta = await solicitar('GET', RUTA_HISTORIAL, {
        token: crearTokenPaciente(PACIENTE_ID),
    });
    const body = await leerCuerpo(respuesta);

    assert.equal(respuesta.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.total, 0);
    assert.deepEqual(body.data, []);
});

test('GET /turnos/mi-historial no expone datos sensibles ni administrativos', async () => {
    prepararConsulta([
        {
            id: TURNO_ID,
            paciente: { id: PACIENTE_ID, dni: '12345678' },
            especialidad: {
                id: ESPECIALIDAD_ID,
                nombre: 'CARDIOLOGIA',
                descripcion: 'Corazón',
                codigo: 'CARD',
                activo: true,
            },
            medico: {
                id: MEDICO_ID,
                nombre: 'ANA',
                apellido: 'PEREZ',
                matricula: '123456',
                email: 'ana@sala.com',
                telefono: { codigoArea: '11', numero: '87654321' },
                consultorios: [],
                horariosAtencion: [],
            },
            fechaTurno: '2035-01-01T12:00:00.000Z',
            fechaFin: '2035-01-01T12:30:00.000Z',
            estado: 'pendiente',
            observaciones: 'control',
            activo: true,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
            __v: 0,
        },
    ]);

    const respuesta = await solicitar('GET', RUTA_HISTORIAL, {
        token: crearTokenPaciente(PACIENTE_ID),
    });
    const body = await leerCuerpo(respuesta);

    assert.equal(respuesta.status, 200);

    const [turno] = body.data;

    assert.deepEqual(
        Object.keys(turno).sort(),
        [
            'especialidad',
            'estado',
            'fechaFin',
            'fechaTurno',
            'id',
            'medico',
            'observaciones',
        ].sort()
    );
    assert.deepEqual(
        Object.keys(turno.especialidad).sort(),
        ['id', 'nombre']
    );
    assert.deepEqual(
        Object.keys(turno.medico).sort(),
        ['apellido', 'id', 'matricula', 'nombre']
    );

    const serializado = JSON.stringify(body.data);

    for (const campo of [
        'paciente',
        'activo',
        'createdAt',
        'updatedAt',
        '__v',
        'email',
        'telefono',
        'consultorios',
        'horariosAtencion',
        'dni',
        'obraSocial',
        'descripcion',
        'codigo',
    ]) {
        assert.equal(
            serializado.includes(`"${campo}"`),
            false,
            `La respuesta no debería exponer "${campo}"`
        );
    }
});

test('GET /turnos/mi-historial no permite almacenar la respuesta en caché', async () => {
    prepararConsulta([]);

    const respuesta = await solicitar('GET', RUTA_HISTORIAL, {
        token: crearTokenPaciente(PACIENTE_ID),
    });

    assert.equal(respuesta.status, 200);
    assert.equal(
        respuesta.headers.get('cache-control'),
        'no-store'
    );
});

// ============================================================
// REGRESIÓN: AGENDA DEL MÉDICO
// ============================================================

test('GET /turnos/mis-turnos sigue disponible para el médico', async () => {
    mock.method(UsuarioModel as any, 'findById', async () => ({
        rol: 'medico',
        medico: new mongoose.Types.ObjectId(MEDICO_ID),
    }));
    mock.method(MedicoModel as any, 'findById', async () => ({
        _id: new mongoose.Types.ObjectId(MEDICO_ID),
        nombre: 'ANA',
        apellido: 'PEREZ',
        matricula: '123456',
        especialidad: new mongoose.Types.ObjectId(
            ESPECIALIDAD_ID
        ),
        duracionTurno: 30,
        activo: true,
        horariosAtencion: [],
    }));
    prepararConsulta([]);

    const respuesta = await solicitar(
        'GET',
        '/api/v1/turnos/mis-turnos',
        { token: crearTokenInterno('medico') }
    );

    assert.equal(respuesta.status, 200);
});

test('GET /turnos/mis-turnos sigue restringido a los demás roles', async () => {
    for (const rol of [
        'admin',
        'recepcionista',
    ] as const) {
        const respuesta = await solicitar(
            'GET',
            '/api/v1/turnos/mis-turnos',
            { token: crearTokenInterno(rol) }
        );

        assert.equal(
            respuesta.status,
            403,
            `El rol ${rol} no debería acceder`
        );
    }

    const respuestaPaciente = await solicitar(
        'GET',
        '/api/v1/turnos/mis-turnos',
        { token: crearTokenPaciente(PACIENTE_ID) }
    );

    assert.equal(respuestaPaciente.status, 403);
});
