import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, test } from 'node:test';

import express from 'express';
import jwt from 'jsonwebtoken';

import authMiddleware from '../../../middlewares/auth.middleware';

import PacienteModel from '../models/Paciente';
import pacientesRoutes from '../routes/paciente.routes';
import {
    FIRMA_XLSX,
    TAMANO_MAXIMO_ARCHIVO_BYTES,
} from '../services/importacion/constantes';

import type { RolUsuario } from '../../usuario/types/usuario.types';
import { crearXlsxPrueba } from './helpers/xlsxPrueba';

// ============================================================
// SERVIDOR DE PRUEBA
// ============================================================

const JWT_SECRET_PRUEBA = 'secreto-de-prueba-importacion-pacientes';

process.env.JWT_SECRET = JWT_SECRET_PRUEBA;

const TIPO_MIME_XLSX =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const app = express();

app.use(authMiddleware);
app.use('/api/v1/pacientes', pacientesRoutes);

const servidor = app.listen(0);
const { port } = servidor.address() as AddressInfo;
const urlBase = `http://127.0.0.1:${port}`;

// ============================================================
// HELPERS
// ============================================================

type Consulta = Promise<unknown[]> & {
    select: () => Consulta;
    lean: () => Consulta;
};

const crearConsulta = (resultado: unknown[]): Consulta => {
    const consulta = Promise.resolve(resultado) as Consulta;

    consulta.select = () => consulta;
    consulta.lean = () => consulta;

    return consulta;
};

type ModeloPacienteSuplantado = {
    find: (filtro: unknown) => Consulta;
    insertMany: (
        documentos: unknown[],
        opciones?: unknown
    ) => Promise<unknown>;
    exists: (filtro: unknown) => Promise<unknown>;
};

const modelo = PacienteModel as unknown as ModeloPacienteSuplantado;
const findOriginal = modelo.find;
const insertManyOriginal = modelo.insertMany;
const existsOriginal = modelo.exists;

modelo.find = () => crearConsulta([]);
modelo.insertMany = async (documentos: unknown[]) => ({
    insertedCount: documentos.length,
    mongoose: { results: documentos },
});
modelo.exists = async () => ({
    _id: '507f1f77bcf86cd799439012',
});

after(() => {
    modelo.find = findOriginal;
    modelo.insertMany = insertManyOriginal;
    modelo.exists = existsOriginal;
    servidor.close();
});

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

const crearTokenPaciente = () =>
    jwt.sign(
        {
            tipo: 'paciente',
            id: '507f1f77bcf86cd799439012',
            rol: 'paciente',
        },
        JWT_SECRET_PRUEBA,
        { expiresIn: '1h' }
    );

const FILAS_VALIDAS = [
    ['Nombre', 'DNI', 'Codigo Area', 'Numero'],
    ['Juan Pérez', '12345678', '3777', '1234567'],
];

const bufferValido = crearXlsxPrueba([
    { nombre: 'Pacientes', filas: FILAS_VALIDAS },
]);

const crearFormulario = (
    buffer: Buffer,
    nombreArchivo = 'pacientes.xlsx',
    tipoMime = TIPO_MIME_XLSX,
    hoja?: string
): FormData => {
    const formulario = new FormData();

    formulario.append(
        'archivo',
        new Blob([new Uint8Array(buffer)], { type: tipoMime }),
        nombreArchivo
    );

    if (hoja) {
        formulario.append('hoja', hoja);
    }

    return formulario;
};

const solicitar = (
    ruta: string,
    token: string,
    formulario?: FormData
) =>
    fetch(`${urlBase}${ruta}`, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${token}`,
        },
        ...(formulario ? { body: formulario } : {}),
    });

const rutaPrevisualizar =
    '/api/v1/pacientes/importar/previsualizar';
const rutaConfirmar = '/api/v1/pacientes/importar';

// ============================================================
// AUTORIZACIÓN
// ============================================================

test('permite la previsualización a administración', async () => {
    const respuesta = await solicitar(
        rutaPrevisualizar,
        crearToken('admin'),
        crearFormulario(bufferValido)
    );
    const cuerpo = (await respuesta.json()) as Record<string, unknown>;
    const data = cuerpo.data as {
        resumen: { totalFilas: number; validas: number };
    };

    assert.equal(respuesta.status, 200);
    assert.equal(cuerpo.success, true);
    assert.equal(data.resumen.totalFilas, 1);
    assert.equal(data.resumen.validas, 1);
    assert.equal(respuesta.headers.get('cache-control'), 'no-store');
});

test('permite la previsualización a recepción', async () => {
    const respuesta = await solicitar(
        rutaPrevisualizar,
        crearToken('recepcionista'),
        crearFormulario(bufferValido)
    );

    assert.equal(respuesta.status, 200);
});

test('rechaza con 403 a un usuario médico', async () => {
    const respuesta = await solicitar(
        rutaPrevisualizar,
        crearToken('medico')
    );

    assert.equal(respuesta.status, 403);
});

test('rechaza con 403 a un paciente autenticado', async () => {
    const respuesta = await solicitar(
        rutaPrevisualizar,
        crearTokenPaciente()
    );

    assert.equal(respuesta.status, 403);
});

// ============================================================
// ARCHIVO
// ============================================================

test('rechaza una solicitud sin archivo', async () => {
    const respuesta = await solicitar(
        rutaPrevisualizar,
        crearToken('admin'),
        new FormData()
    );

    assert.equal(respuesta.status, 400);
});

test('rechaza un archivo que supera el límite de tamaño', async () => {
    const respuesta = await solicitar(
        rutaPrevisualizar,
        crearToken('admin'),
        crearFormulario(
            Buffer.alloc(TAMANO_MAXIMO_ARCHIVO_BYTES + 1, 1)
        )
    );

    assert.equal(respuesta.status, 413);
});

test('rechaza una extensión no permitida', async () => {
    const respuesta = await solicitar(
        rutaPrevisualizar,
        crearToken('admin'),
        crearFormulario(bufferValido, 'pacientes.csv')
    );

    assert.equal(respuesta.status, 400);
});

test('rechaza un XLSX corrupto', async () => {
    const corrupto = Buffer.concat([
        FIRMA_XLSX,
        Buffer.from('contenido inválido', 'utf8'),
    ]);

    const respuesta = await solicitar(
        rutaPrevisualizar,
        crearToken('admin'),
        crearFormulario(corrupto)
    );

    assert.equal(respuesta.status, 400);
});

// ============================================================
// HOJAS
// ============================================================

test('exige elegir hoja cuando hay varias', async () => {
    const buffer = crearXlsxPrueba([
        { nombre: 'Pacientes', filas: FILAS_VALIDAS },
        { nombre: 'Instrucciones', filas: [['Leer antes de importar']] },
    ]);

    const respuesta = await solicitar(
        rutaPrevisualizar,
        crearToken('admin'),
        crearFormulario(buffer)
    );

    assert.equal(respuesta.status, 400);
});

test('procesa la hoja elegida', async () => {
    const buffer = crearXlsxPrueba([
        { nombre: 'Instrucciones', filas: [['Leer antes de importar']] },
        { nombre: 'Pacientes', filas: FILAS_VALIDAS },
    ]);

    const respuesta = await solicitar(
        rutaPrevisualizar,
        crearToken('admin'),
        crearFormulario(buffer, 'pacientes.xlsx', TIPO_MIME_XLSX, 'Pacientes')
    );
    const cuerpo = (await respuesta.json()) as Record<string, unknown>;
    const data = cuerpo.data as { hojaProcesada: string };

    assert.equal(respuesta.status, 200);
    assert.equal(data.hojaProcesada, 'Pacientes');
});

// ============================================================
// CONFIRMACIÓN
// ============================================================

test('confirma la importación y devuelve el resultado real', async () => {
    const respuesta = await solicitar(
        rutaConfirmar,
        crearToken('admin'),
        crearFormulario(bufferValido)
    );
    const cuerpo = (await respuesta.json()) as Record<string, unknown>;
    const data = cuerpo.data as {
        resumen: { importadas: number; totalFilas: number };
        filas: Array<{ estado: string }>;
    };

    assert.equal(respuesta.status, 200);
    assert.equal(data.resumen.totalFilas, 1);
    assert.equal(data.resumen.importadas, 1);
    assert.equal(data.filas[0].estado, 'importada');
    assert.equal(respuesta.headers.get('cache-control'), 'no-store');
});
