import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import PacienteModel from '../models/Paciente';
import ErrorImportacion from '../services/importacion/ErrorImportacion';
import importacionPacientesService from '../services/importacionPacientes.service';

import type { ArchivoExcelImportacion } from '../types/importacionPacientes.types';
import type { ValorXlsxPrueba } from './helpers/xlsxPrueba';
import { crearXlsxPrueba } from './helpers/xlsxPrueba';

// ============================================================
// HELPERS
// ============================================================

const TIPO_MIME_XLSX =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const ENCABEZADOS: ValorXlsxPrueba[] = [
    'Nombre',
    'DNI',
    'Codigo Area',
    'Numero',
    'Email',
];

interface DatosFila {
    nombre?: ValorXlsxPrueba;
    dni?: ValorXlsxPrueba;
    numero?: ValorXlsxPrueba;
    email?: ValorXlsxPrueba;
}

const crearFila = (datos: DatosFila = {}): ValorXlsxPrueba[] => [
    datos.nombre === undefined ? 'Juan Pérez' : datos.nombre,
    datos.dni === undefined ? '12345678' : datos.dni,
    '3777',
    datos.numero === undefined ? '1234567' : datos.numero,
    datos.email === undefined ? null : datos.email,
];

const crearArchivo = (
    filas: ValorXlsxPrueba[][]
): ArchivoExcelImportacion => {
    const buffer = crearXlsxPrueba([
        {
            nombre: 'Pacientes',
            filas: [ENCABEZADOS, ...filas],
        },
    ]);

    return {
        buffer,
        nombreOriginal: 'pacientes.xlsx',
        tipoMime: TIPO_MIME_XLSX,
        tamano: buffer.length,
    };
};

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
};

const modelo = PacienteModel as unknown as ModeloPacienteSuplantado;
const findOriginal = modelo.find;
const insertManyOriginal = modelo.insertMany;

afterEach(() => {
    modelo.find = findOriginal;
    modelo.insertMany = insertManyOriginal;
});

const configurarFind = (
    opciones: { dnis?: string[]; emails?: string[] } = {}
) => {
    const dnis = opciones.dnis ?? [];
    const emails = opciones.emails ?? [];

    modelo.find = (filtro: unknown) => {
        const consulta = filtro as {
            dni?: { $in?: unknown };
            email?: { $in?: unknown };
        };

        if (consulta.dni?.$in) {
            return crearConsulta(dnis.map((dni) => ({ dni })));
        }

        if (consulta.email?.$in) {
            return crearConsulta(emails.map((email) => ({ email })));
        }

        return crearConsulta([]);
    };
};

const configurarInsercionExitosa = () => {
    const documentosRecibidos: unknown[][] = [];

    modelo.insertMany = async (documentos: unknown[]) => {
        documentosRecibidos.push(documentos);

        return {
            insertedCount: documentos.length,
            mongoose: { results: documentos },
        };
    };

    return documentosRecibidos;
};

const errorDuplicado = (
    campo: 'dni' | 'email'
): Record<string, unknown> => ({
    code: 11000,
    keyPattern: { [campo]: 1 },
    keyValue: { [campo]: 'valor-duplicado' },
    message: 'E11000 duplicate key error',
});

// ============================================================
// PREVISUALIZACIÓN
// ============================================================

test('la previsualización no inserta ni actualiza pacientes', async () => {
    configurarFind();

    let inserto = false;

    modelo.insertMany = async () => {
        inserto = true;
        return { insertedCount: 0, mongoose: { results: [] } };
    };

    const resultado = await importacionPacientesService.previsualizar(
        crearArchivo([
            crearFila({ dni: '12345678' }),
            crearFila({
                dni: '87654321',
                email: 'ana@example.com',
            }),
        ])
    );

    assert.equal(resultado.resumen.totalFilas, 2);
    assert.equal(resultado.resumen.validas, 2);
    assert.equal(resultado.resumen.importadas, undefined);
    assert.equal(inserto, false);
});

// ============================================================
// CONFIRMACIÓN
// ============================================================

test('confirma e inserta todas las filas válidas', async () => {
    configurarFind();
    const documentosRecibidos = configurarInsercionExitosa();

    const resultado = await importacionPacientesService.confirmar(
        crearArchivo([
            crearFila({ dni: '12345678' }),
            crearFila({
                dni: '87654321',
                email: 'ana@example.com',
            }),
        ])
    );

    assert.equal(resultado.resumen.candidatas, 2);
    assert.equal(resultado.resumen.importadas, 2);
    assert.equal(resultado.resumen.noImportadas, 0);
    assert.deepEqual(
        resultado.filas.map((fila) => fila.estado),
        ['importada', 'importada']
    );
    assert.equal(documentosRecibidos[0]?.length, 2);
});

test('omite las filas inválidas y solo inserta las válidas', async () => {
    configurarFind();
    const documentosRecibidos = configurarInsercionExitosa();

    const resultado = await importacionPacientesService.confirmar(
        crearArchivo([
            crearFila({ dni: '12345678' }),
            crearFila({
                nombre: null,
                dni: '87654321',
            }),
        ])
    );

    assert.equal(resultado.resumen.candidatas, 1);
    assert.equal(resultado.resumen.importadas, 1);
    assert.equal(resultado.resumen.invalidas, 1);
    assert.equal(documentosRecibidos[0]?.length, 1);
    assert.equal(resultado.filas[0].estado, 'importada');
    assert.equal(resultado.filas[1].estado, 'invalida');
});

test('una falla individual no detiene las demás inserciones', async () => {
    configurarFind();

    modelo.insertMany = async (documentos: unknown[]) => ({
        insertedCount: 2,
        mongoose: {
            results: [
                documentos[0],
                errorDuplicado('dni'),
                documentos[2],
            ],
        },
    });

    const resultado = await importacionPacientesService.confirmar(
        crearArchivo([
            crearFila({ dni: '12345678' }),
            crearFila({
                dni: '87654321',
                email: 'ana@example.com',
            }),
            crearFila({
                dni: '11223344',
                email: 'luis@example.com',
            }),
        ])
    );

    assert.equal(resultado.resumen.importadas, 2);
    assert.equal(resultado.resumen.existentes, 1);
    assert.equal(resultado.resumen.noImportadas, 1);
    assert.deepEqual(
        resultado.filas.map((fila) => fila.estado),
        ['importada', 'existente', 'importada']
    );
});

test('informa un E11000 de email como conflicto_email', async () => {
    configurarFind();

    modelo.insertMany = async () => ({
        insertedCount: 0,
        mongoose: { results: [errorDuplicado('email')] },
    });

    const resultado = await importacionPacientesService.confirmar(
        crearArchivo([
            crearFila({
                dni: '12345678',
                email: 'ana@example.com',
            }),
        ])
    );

    assert.equal(resultado.resumen.importadas, 0);
    assert.equal(resultado.resumen.conflictosEmail, 1);
    assert.equal(resultado.filas[0].estado, 'conflicto_email');
});

test('los totales finales reflejan las inserciones reales', async () => {
    configurarFind();

    modelo.insertMany = async (documentos: unknown[]) => ({
        insertedCount: 1,
        mongoose: {
            results: [documentos[0], errorDuplicado('dni')],
        },
    });

    const resultado = await importacionPacientesService.confirmar(
        crearArchivo([
            crearFila({ dni: '12345678' }),
            crearFila({
                dni: '87654321',
                email: 'ana@example.com',
            }),
        ])
    );

    assert.equal(resultado.resumen.totalFilas, 2);
    assert.equal(resultado.resumen.importadas, 1);
    assert.equal(resultado.resumen.noImportadas, 1);
    assert.equal(resultado.resumen.existentes, 1);
});

test('una fila válida en la previsualización puede conflictuar al confirmar', async () => {
    configurarFind();

    const archivo = crearArchivo([crearFila({ dni: '12345678' })]);
    const previsualizacion =
        await importacionPacientesService.previsualizar(archivo);

    assert.equal(previsualizacion.filas[0].estado, 'valida');

    configurarFind({ dnis: ['12345678'] });

    let inserto = false;

    modelo.insertMany = async () => {
        inserto = true;
        return { insertedCount: 0, mongoose: { results: [] } };
    };

    const confirmacion = await importacionPacientesService.confirmar(
        archivo
    );

    assert.equal(confirmacion.filas[0].estado, 'existente');
    assert.equal(confirmacion.resumen.importadas, 0);
    assert.equal(inserto, false);
});

test('no actualiza un paciente existente', async () => {
    configurarFind({ dnis: ['12345678'] });

    let inserto = false;

    modelo.insertMany = async () => {
        inserto = true;
        return { insertedCount: 0, mongoose: { results: [] } };
    };

    const resultado = await importacionPacientesService.confirmar(
        crearArchivo([crearFila({ dni: '12345678' })])
    );

    assert.equal(resultado.filas[0].estado, 'existente');
    assert.equal(resultado.resumen.importadas, 0);
    assert.equal(inserto, false);
});

test('si no hay resultados de inserción, no marca filas como importadas', async () => {
    configurarFind();

    modelo.insertMany = async () => ({
        insertedCount: 1,
        mongoose: { results: [undefined] },
    });

    const resultado = await importacionPacientesService.confirmar(
        crearArchivo([crearFila({ dni: '12345678' })])
    );

    assert.equal(resultado.filas[0].estado, 'invalida');
    assert.equal(resultado.resumen.importadas, 0);
});

test('un error de validación individual se informa en la fila', async () => {
    configurarFind();

    modelo.insertMany = async () => ({
        insertedCount: 0,
        mongoose: {
            results: [
                {
                    name: 'ValidationError',
                    errors: {
                        email: {
                            message:
                                'El correo electrónico no es válido',
                        },
                    },
                },
            ],
        },
    });

    const resultado = await importacionPacientesService.confirmar(
        crearArchivo([
            crearFila({
                dni: '12345678',
                email: 'ana@example.com',
            }),
        ])
    );

    assert.equal(resultado.filas[0].estado, 'invalida');
    assert.ok(
        resultado.filas[0].motivos.some(
            (motivo) => motivo.campo === 'email'
        )
    );
});

test('si la inserción completa falla, devuelve un error controlado', async () => {
    configurarFind();

    modelo.insertMany = async () => {
        throw new Error('fallo de conexión');
    };

    await assert.rejects(
        importacionPacientesService.confirmar(
            crearArchivo([crearFila({ dni: '12345678' })])
        ),
        (error: unknown) => {
            assert.ok(error instanceof ErrorImportacion);
            assert.equal(error.status, 500);

            return true;
        }
    );
});
