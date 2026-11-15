import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, afterEach, beforeEach, test, mock } from 'node:test';

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import app from '../../../app';

import historiaClinicaService from '../services/historiaclinica.service';

import HistoriaClinicaModel from '../models/HistoriaClinica';
import PacienteModel from '../../pacientes/models/Paciente';
import type { RolUsuario } from '../../usuario/types/usuario.types';

// ============================================================
// SERVIDOR DE PRUEBA
// ============================================================

const JWT_SECRET_PRUEBA = 'secreto-de-prueba-mi-historial';

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

interface RegistroConsulta {
    filtro?: unknown;
    populates: Array<{ ruta: string; campos: unknown }>;
    orden?: unknown;
    seleccion?: unknown;
}

type ConsultaSimulada = Promise<unknown[]> & {
    populate: (ruta: string, campos: unknown) => ConsultaSimulada;
    sort: (orden: unknown) => ConsultaSimulada;
    select: (campos: unknown) => ConsultaSimulada;
};

const crearConsulta = (
    documentos: unknown[],
    registro: RegistroConsulta
): ConsultaSimulada => {
    const consulta = Promise.resolve(documentos) as ConsultaSimulada;

    consulta.populate = (ruta, campos) => {
        registro.populates.push({ ruta, campos });
        return consulta;
    };

    consulta.sort = (orden) => {
        registro.orden = orden;
        return consulta;
    };

    consulta.select = (campos) => {
        registro.seleccion = campos;
        return consulta;
    };

    return consulta;
};

let idPaciente: string;
let pacienteExiste: unknown;
let registro: RegistroConsulta;
let historias: unknown[];

beforeEach(() => {
    idPaciente = new mongoose.Types.ObjectId().toString();
    pacienteExiste = { _id: idPaciente };
    registro = { populates: [] };
    historias = [];

    mock.method(
        PacienteModel as any,
        'exists',
        async () => pacienteExiste
    );

    mock.method(
        HistoriaClinicaModel as any,
        'find',
        (filtro: unknown) => {
            registro.filtro = filtro;
            return crearConsulta(historias, registro);
        }
    );
});

afterEach(() => {
    mock.restoreAll();
});

const crearTokenPaciente = (id: string) =>
    jwt.sign(
        { tipo: 'paciente', id, rol: 'paciente' },
        JWT_SECRET_PRUEBA,
        { expiresIn: '1h' }
    );

const crearTokenInterno = (rol: RolUsuario) =>
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

const solicitar = (metodo: string, ruta: string, token?: string) => {
    const headers: Record<string, string> = {};

    if (token) {
        headers.authorization = `Bearer ${token}`;
    }

    return fetch(`${urlBase}${ruta}`, { method: metodo, headers });
};

const leerCuerpo = async (respuesta: Response) =>
    (await respuesta.json()) as Record<string, unknown>;

const crearHistoriaSimulada = () => ({
    id: 'historia-1',
    fechaAtencion: '2026-11-01T13:30:00.000Z',
    observaciones: 'Control de presión arterial',
    recetario: [
        {
            nombre: 'Enalapril',
            dosis: '10 mg',
            frecuencia: 'Cada 12 horas',
        },
    ],
    medico: {
        id: 'medico-1',
        nombre: 'ANA',
        apellido: 'PEREZ',
        matricula: '123456',
    },
});

// ============================================================
// SERVICIO: CONSULTA COMPARTIDA Y PROYECCIÓN
// ============================================================

test('getMiHistorial usa la consulta compartida y limita los campos', async () => {
    await historiaClinicaService.getMiHistorial(idPaciente);

    assert.deepEqual(registro.filtro, { paciente: idPaciente });
    assert.deepEqual(registro.populates, [
        { ruta: 'medico', campos: 'nombre apellido matricula' },
    ]);
    assert.deepEqual(registro.orden, { fechaAtencion: -1 });
    assert.equal(
        registro.seleccion,
        'fechaAtencion observaciones recetario medico'
    );
});

test('getMiHistorial no popula el documento del paciente', async () => {
    await historiaClinicaService.getMiHistorial(idPaciente);

    assert.equal(
        registro.populates.some((populate) => populate.ruta === 'paciente'),
        false
    );
});

test('getHistorialPaciente conserva su proyección administrativa', async () => {
    await historiaClinicaService.getHistorialPaciente(idPaciente);

    assert.deepEqual(registro.populates, [
        { ruta: 'medico', campos: 'nombre apellido matricula' },
        { ruta: 'paciente', campos: 'nombre dni' },
    ]);
    assert.equal(registro.seleccion, undefined);
});

test('getMiHistorial rechaza un ID de paciente inválido', async () => {
    await assert.rejects(
        historiaClinicaService.getMiHistorial('id-invalido'),
        /El ID del paciente no es válido/
    );
});

test('getMiHistorial rechaza un paciente inexistente', async () => {
    pacienteExiste = null;

    await assert.rejects(
        historiaClinicaService.getMiHistorial(idPaciente),
        /Paciente no encontrado/
    );
});

// ============================================================
// ENDPOINT: PACIENTE AUTENTICADO
// ============================================================

test('un paciente autenticado consulta su propio historial', async () => {
    const historia = crearHistoriaSimulada();
    historias = [historia];

    const respuesta = await solicitar(
        'GET',
        '/api/v1/historias-clinicas/mi-historial',
        crearTokenPaciente(idPaciente)
    );
    const cuerpo = await leerCuerpo(respuesta);
    const datos = cuerpo.data as Array<Record<string, unknown>>;

    assert.equal(respuesta.status, 200);
    assert.equal(cuerpo.success, true);
    assert.equal(cuerpo.message, 'Historial clínico obtenido exitosamente');
    assert.equal(cuerpo.total, 1);
    assert.equal(datos.length, 1);

    const devuelta = datos[0];

    assert.deepEqual(Object.keys(devuelta).sort(), [
        'fechaAtencion',
        'id',
        'medico',
        'observaciones',
        'recetario',
    ].sort());
    assert.equal(devuelta.id, historia.id);
    assert.equal(devuelta.fechaAtencion, historia.fechaAtencion);
    assert.equal(devuelta.observaciones, historia.observaciones);
    assert.deepEqual(devuelta.recetario, historia.recetario);
    assert.deepEqual(devuelta.medico, historia.medico);
    assert.equal('paciente' in devuelta, false);
    assert.equal('dni' in devuelta, false);
    assert.equal('telefono' in devuelta, false);
    assert.equal('email' in devuelta, false);
    assert.equal('createdAt' in devuelta, false);
    assert.equal('updatedAt' in devuelta, false);
    assert.equal('__v' in devuelta, false);

    // La consulta se resuelve con el ID del token y la proyección segura.
    assert.deepEqual(registro.filtro, { paciente: idPaciente });
    assert.deepEqual(registro.populates, [
        { ruta: 'medico', campos: 'nombre apellido matricula' },
    ]);
    assert.deepEqual(registro.orden, { fechaAtencion: -1 });
    assert.equal(
        registro.seleccion,
        'fechaAtencion observaciones recetario medico'
    );
});

test('el paciente no puede elegir otro paciente desde query', async () => {
    const otroPaciente = new mongoose.Types.ObjectId().toString();

    const respuesta = await solicitar(
        'GET',
        `/api/v1/historias-clinicas/mi-historial?pacienteId=${otroPaciente}&paciente=${otroPaciente}`,
        crearTokenPaciente(idPaciente)
    );

    assert.equal(respuesta.status, 200);
    assert.deepEqual(registro.filtro, { paciente: idPaciente });
});

test('una solicitud sin token no accede al historial', async () => {
    const respuesta = await solicitar(
        'GET',
        '/api/v1/historias-clinicas/mi-historial'
    );

    assert.equal(respuesta.status, 401);
});

test('los roles internos no acceden al historial del paciente', async () => {
    for (const rol of ['admin', 'medico', 'recepcionista'] as const) {
        const respuesta = await solicitar(
            'GET',
            '/api/v1/historias-clinicas/mi-historial',
            crearTokenInterno(rol)
        );

        assert.equal(respuesta.status, 403, `Rol inesperado: ${rol}`);
    }
});

test('devuelve una colección vacía si el paciente no tiene historias', async () => {
    historias = [];

    const respuesta = await solicitar(
        'GET',
        '/api/v1/historias-clinicas/mi-historial',
        crearTokenPaciente(idPaciente)
    );
    const cuerpo = await leerCuerpo(respuesta);

    assert.equal(respuesta.status, 200);
    assert.equal(cuerpo.success, true);
    assert.equal(cuerpo.total, 0);
    assert.deepEqual(cuerpo.data, []);
});

test('la ruta estática no es capturada por GET /:id', async () => {
    const respuestaPaciente = await solicitar(
        'GET',
        '/api/v1/historias-clinicas/mi-historial',
        crearTokenPaciente(idPaciente)
    );
    const respuestaDinamica = await solicitar(
        'GET',
        `/api/v1/historias-clinicas/${new mongoose.Types.ObjectId().toString()}`,
        crearTokenPaciente(idPaciente)
    );

    assert.equal(respuestaPaciente.status, 200);
    assert.equal(respuestaDinamica.status, 403);
});

test('el paciente no accede a las rutas clínicas administrativas', async () => {
    const token = crearTokenPaciente(idPaciente);
    const otroPaciente = new mongoose.Types.ObjectId().toString();
    const historiaId = new mongoose.Types.ObjectId().toString();

    const rutas = [
        '/api/v1/historias-clinicas',
        `/api/v1/historias-clinicas/paciente/${otroPaciente}`,
        `/api/v1/historias-clinicas/${historiaId}`,
    ];

    for (const ruta of rutas) {
        const respuesta = await solicitar('GET', ruta, token);

        assert.equal(respuesta.status, 403, `Ruta inesperada: ${ruta}`);
    }
});

test('el paciente no puede crear ni modificar historias clínicas', async () => {
    const token = crearTokenPaciente(idPaciente);
    const headers = {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
    };

    const respuestaPost = await fetch(
        `${urlBase}/api/v1/historias-clinicas`,
        {
            method: 'POST',
            headers,
            body: JSON.stringify({}),
        }
    );

    const respuestaPut = await fetch(
        `${urlBase}/api/v1/historias-clinicas/${new mongoose.Types.ObjectId().toString()}`,
        {
            method: 'PUT',
            headers,
            body: JSON.stringify({}),
        }
    );

    assert.equal(respuestaPost.status, 403);
    assert.equal(respuestaPut.status, 403);
});

// ============================================================
// REGRESIONES
// ============================================================

test('las rutas existentes de lectura siguen disponibles para admin y médico', async () => {
    const respuestaAdmin = await solicitar(
        'GET',
        '/api/v1/historias-clinicas',
        crearTokenInterno('admin')
    );
    const respuestaMedico = await solicitar(
        'GET',
        '/api/v1/historias-clinicas',
        crearTokenInterno('medico')
    );
    const respuestaRecepcion = await solicitar(
        'GET',
        '/api/v1/historias-clinicas',
        crearTokenInterno('recepcionista')
    );

    assert.equal(respuestaAdmin.status, 200);
    assert.equal(respuestaMedico.status, 200);
    assert.equal(respuestaRecepcion.status, 403);
});
