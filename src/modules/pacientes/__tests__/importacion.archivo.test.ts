import assert from 'node:assert/strict';
import test from 'node:test';

import ErrorImportacion from '../services/importacion/ErrorImportacion';
import {
    FIRMA_XLSX,
    TAMANO_MAXIMO_ARCHIVO_BYTES,
} from '../services/importacion/constantes';
import { leerArchivoExcel } from '../services/importacion/leerArchivoExcel';

import type { ArchivoExcelImportacion } from '../types/importacionPacientes.types';
import type { HojaXlsxPrueba } from './helpers/xlsxPrueba';
import { crearXlsxPrueba } from './helpers/xlsxPrueba';

// ============================================================
// HELPERS
// ============================================================

const TIPO_MIME_XLSX =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const FILAS_VALIDAS = [
    ['Nombre', 'DNI', 'Codigo Area', 'Numero'],
    ['Juan Pérez', '12345678', '3777', '1234567'],
    ['Ana Gómez', '87654321', '11', '87654321'],
];

const crearArchivo = (
    buffer: Buffer,
    cambios: Partial<ArchivoExcelImportacion> = {}
): ArchivoExcelImportacion => ({
    buffer,
    nombreOriginal: 'pacientes.xlsx',
    tipoMime: TIPO_MIME_XLSX,
    tamano: buffer.length,
    ...cambios,
});

const crearArchivoConHojas = (hojas: HojaXlsxPrueba[]) =>
    crearArchivo(crearXlsxPrueba(hojas));

const verificarError = async (
    promesa: Promise<unknown>,
    status: number
) => {
    await assert.rejects(promesa, (error: unknown) => {
        assert.ok(error instanceof ErrorImportacion);
        assert.equal(error.status, status);

        return true;
    });
};

// ============================================================
// LECTURA
// ============================================================

test('lee un XLSX válido e informa la hoja procesada', async () => {
    const archivo = crearArchivoConHojas([
        { nombre: 'Pacientes', filas: FILAS_VALIDAS },
    ]);

    const resultado = await leerArchivoExcel(archivo);

    assert.equal(resultado.hojaProcesada, 'Pacientes');
    assert.deepEqual(resultado.hojasDisponibles, ['Pacientes']);
    assert.equal(resultado.filas.length, 3);
    assert.equal(resultado.filas[0][0], 'Nombre');
    assert.equal(resultado.filas[1][1], '12345678');
});

test('rechaza un archivo vacío', async () => {
    await verificarError(
        leerArchivoExcel(crearArchivo(Buffer.alloc(0))),
        400
    );
});

test('rechaza una extensión que no sea .xlsx', async () => {
    const buffer = crearXlsxPrueba([
        { nombre: 'Pacientes', filas: FILAS_VALIDAS },
    ]);

    await verificarError(
        leerArchivoExcel(
            crearArchivo(buffer, { nombreOriginal: 'pacientes.csv' })
        ),
        400
    );
});

test('rechaza un tipo MIME incompatible', async () => {
    const buffer = crearXlsxPrueba([
        { nombre: 'Pacientes', filas: FILAS_VALIDAS },
    ]);

    await verificarError(
        leerArchivoExcel(
            crearArchivo(buffer, { tipoMime: 'text/csv' })
        ),
        400
    );
});

test('rechaza un archivo corrupto aunque tenga firma ZIP', async () => {
    const buffer = Buffer.concat([
        FIRMA_XLSX,
        Buffer.from('esto no es un libro XLSX', 'utf8'),
    ]);

    await verificarError(
        leerArchivoExcel(crearArchivo(buffer)),
        400
    );
});

test('rechaza un archivo que supera los 5 MB', async () => {
    const buffer = Buffer.alloc(TAMANO_MAXIMO_ARCHIVO_BYTES + 1);

    await verificarError(
        leerArchivoExcel(crearArchivo(buffer)),
        413
    );
});

test('rechaza más de 1000 filas de pacientes', async () => {
    const filas: Array<Array<string | number>> = [
        ['Nombre', 'DNI', 'Codigo Area', 'Numero'],
    ];

    for (let indice = 0; indice < 1001; indice += 1) {
        filas.push([
            `Paciente ${indice}`,
            String(10000000 + indice),
            '11',
            String(10000000 + indice),
        ]);
    }

    const archivo = crearArchivoConHojas([
        { nombre: 'Pacientes', filas },
    ]);

    await assert.rejects(
        leerArchivoExcel(archivo),
        (error: unknown) => {
            assert.ok(error instanceof ErrorImportacion);
            assert.equal(error.status, 400);
            assert.match(error.message, /1001 filas/);
            assert.match(error.message, /máximo permitido es 1000/);

            return true;
        }
    );
});

// ============================================================
// HOJAS
// ============================================================

test('exige indicar la hoja cuando el libro tiene varias', async () => {
    const archivo = crearArchivoConHojas([
        { nombre: 'Pacientes', filas: FILAS_VALIDAS },
        { nombre: 'Instrucciones', filas: [['Leer antes de importar']] },
    ]);

    await assert.rejects(
        leerArchivoExcel(archivo),
        (error: unknown) => {
            assert.ok(error instanceof ErrorImportacion);
            assert.equal(error.status, 400);
            assert.match(error.message, /varias hojas/);
            assert.deepEqual(
                (error.detalles as { hojasDisponibles: string[] })
                    .hojasDisponibles,
                ['Pacientes', 'Instrucciones']
            );

            return true;
        }
    );
});

test('procesa únicamente la hoja indicada', async () => {
    const archivo = crearArchivoConHojas([
        { nombre: 'Instrucciones', filas: [['Leer antes de importar']] },
        { nombre: 'Pacientes', filas: FILAS_VALIDAS },
    ]);

    const resultado = await leerArchivoExcel(archivo, 'Pacientes');

    assert.equal(resultado.hojaProcesada, 'Pacientes');
    assert.equal(resultado.filas.length, 3);
    assert.equal(resultado.filas[0][0], 'Nombre');
});

test('rechaza una hoja inexistente', async () => {
    const archivo = crearArchivoConHojas([
        { nombre: 'Pacientes', filas: FILAS_VALIDAS },
        { nombre: 'Otra', filas: [['Dato']] },
    ]);

    await verificarError(
        leerArchivoExcel(archivo, 'No existe'),
        400
    );
});
