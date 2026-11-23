import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizarDni } from '../../../utils/credencialesPaciente';

import ErrorImportacion from '../services/importacion/ErrorImportacion';
import { analizarFilas } from '../services/importacion/analizarFilas';
import { mapearColumnas } from '../services/importacion/mapeoColumnas';

import type { ConsultasImportacion } from '../services/importacion/analizarFilas';
import type { ValorXlsxPrueba } from './helpers/xlsxPrueba';

// ============================================================
// HELPERS
// ============================================================

const ENCABEZADOS: ValorXlsxPrueba[] = [
    'Nombre',
    'DNI',
    'Codigo Area',
    'Numero',
    'Email',
    'Obra Social',
    'Nro Afiliado',
    'Tipo Telefono',
    'Calle',
    'Numero Calle',
    'Barrio',
    'Observaciones',
];

interface DatosFila {
    nombre?: ValorXlsxPrueba;
    dni?: ValorXlsxPrueba;
    area?: ValorXlsxPrueba;
    numero?: ValorXlsxPrueba;
    email?: ValorXlsxPrueba;
    obraSocial?: ValorXlsxPrueba;
    afiliado?: ValorXlsxPrueba;
    tipo?: ValorXlsxPrueba;
    calle?: ValorXlsxPrueba;
    numeroCalle?: ValorXlsxPrueba;
    barrio?: ValorXlsxPrueba;
    observaciones?: ValorXlsxPrueba;
}

const valor = (
    ingresado: ValorXlsxPrueba | undefined,
    porDefecto: ValorXlsxPrueba
): ValorXlsxPrueba =>
    ingresado === undefined ? porDefecto : ingresado;

const crearFila = (datos: DatosFila = {}): ValorXlsxPrueba[] => [
    valor(datos.nombre, 'Juan Pérez'),
    valor(datos.dni, '12345678'),
    valor(datos.area, '3777'),
    valor(datos.numero, '1234567'),
    valor(datos.email, null),
    valor(datos.obraSocial, null),
    valor(datos.afiliado, null),
    valor(datos.tipo, null),
    valor(datos.calle, null),
    valor(datos.numeroCalle, null),
    valor(datos.barrio, null),
    valor(datos.observaciones, null),
];

const consultasVacias: ConsultasImportacion = {
    buscarDnisExistentes: async () => new Set(),
    buscarEmailsExistentes: async () => new Set(),
};

const consultasConDnis = (dnis: string[]): ConsultasImportacion => ({
    ...consultasVacias,
    buscarDnisExistentes: async () =>
        new Set(dnis.flatMap((dni) => normalizarDni(dni))),
});

const consultasConEmails = (emails: string[]): ConsultasImportacion => ({
    ...consultasVacias,
    buscarEmailsExistentes: async () =>
        new Set(emails.map((email) => email.trim().toLowerCase())),
});

const analizar = async (
    filasDatos: ValorXlsxPrueba[][],
    consultas: ConsultasImportacion = consultasVacias
) => {
    const mapeo = mapearColumnas(ENCABEZADOS);

    return analizarFilas(
        [ENCABEZADOS, ...filasDatos],
        mapeo,
        consultas
    );
};

const verificarErrorColumnas = (
    encabezados: ValorXlsxPrueba[],
    mensaje: RegExp
) => {
    assert.throws(
        () => mapearColumnas(encabezados),
        (error: unknown) => {
            assert.ok(error instanceof ErrorImportacion);
            assert.equal(error.status, 400);
            assert.match(error.message, mensaje);

            return true;
        }
    );
};

// ============================================================
// CAMPOS OBLIGATORIOS Y DNI
// ============================================================

test('marca inválida una fila sin nombre', async () => {
    const [fila] = await analizar([crearFila({ nombre: null })]);

    assert.equal(fila.estado, 'invalida');
    assert.ok(fila.motivos.some((motivo) => motivo.campo === 'nombre'));
});

test('aplica el modelo a una fila que ya tenía errores de normalización', async () => {
    const [fila] = await analizar([
        crearFila({ nombre: '', email: 'no-es-un-email' }),
    ]);

    assert.equal(fila.estado, 'invalida');
    assert.ok(
        fila.motivos.some((motivo) => motivo.campo === 'nombre')
    );
    assert.ok(
        fila.motivos.some((motivo) => motivo.campo === 'email')
    );
});

test('rechaza un DNI con texto aunque contenga dígitos', async () => {
    const [fila] = await analizar([
        crearFila({ dni: 'DNI12345678' }),
    ]);

    assert.equal(fila.estado, 'invalida');
    assert.ok(
        fila.motivos.some(
            (motivo) =>
                motivo.campo === 'dni' &&
                /separadores/.test(motivo.mensaje)
        )
    );
});

test('acepta un DNI numérico entero y rechaza uno decimal', async () => {
    const [entero] = await analizar([crearFila({ dni: 12345678 })]);
    const [decimal] = await analizar([crearFila({ dni: 12345678.5 })]);

    assert.equal(entero.estado, 'valida');
    assert.equal(decimal.estado, 'invalida');
});

test('rechaza un DNI escrito como decimal', async () => {
    const [fila] = await analizar([crearFila({ dni: '1234567.0' })]);

    assert.equal(fila.estado, 'invalida');
    assert.ok(
        fila.motivos.some(
            (motivo) =>
                motivo.campo === 'dni' &&
                /no se aceptan decimales/.test(motivo.mensaje)
        )
    );
});

test('acepta puntos únicamente como separadores de miles', async () => {
    const [valido] = await analizar([crearFila({ dni: '12.345.678' })]);
    const [invalido] = await analizar([crearFila({ dni: '1234.5678' })]);

    assert.equal(valido.estado, 'valida');
    assert.equal(valido.datos.dni, '12345678');
    assert.equal(invalido.estado, 'invalida');
});

test('considera equivalentes los DNI de 7 y 8 dígitos', async () => {
    const filas = await analizar([
        crearFila({ dni: '1234567' }),
        crearFila({
            dni: '01234567',
            email: 'otro@example.com',
        }),
    ]);

    assert.equal(filas[0].estado, 'valida');
    assert.equal(filas[1].estado, 'duplicada_en_archivo');
});

test('marca duplicada la segunda aparición del mismo DNI', async () => {
    const filas = await analizar([
        crearFila({ dni: '12345678' }),
        crearFila({
            dni: '12345678',
            email: 'otro@example.com',
        }),
    ]);

    assert.equal(filas[0].estado, 'valida');
    assert.equal(filas[1].estado, 'duplicada_en_archivo');
});

test('una fila inválida no reserva el DNI para las siguientes', async () => {
    const filas = await analizar([
        crearFila({ nombre: null, dni: '12345678' }),
        crearFila({ dni: '12345678' }),
    ]);

    assert.equal(filas[0].estado, 'invalida');
    assert.equal(filas[1].estado, 'valida');
});

test('detecta un DNI existente en MongoDB con las variantes del login', async () => {
    const [fila] = await analizar(
        [crearFila({ dni: '1234567' })],
        consultasConDnis(['01234567'])
    );

    assert.equal(fila.estado, 'existente');
});

// ============================================================
// TELÉFONO
// ============================================================

test('acepta código de área y número separados', async () => {
    const [fila] = await analizar([crearFila()]);

    assert.equal(fila.estado, 'valida');
    assert.equal(fila.datos.telefono?.codigoArea, '3777');
    assert.equal(fila.datos.telefono?.numero, '1234567');
});

test('rechaza un archivo con una sola columna de teléfono completo', () => {
    verificarErrorColumnas(
        ['Nombre', 'DNI', 'Telefono'],
        /columnas separadas para el código de área/
    );
});

test('marca inválida una fila sin código de área', async () => {
    const [fila] = await analizar([crearFila({ area: null })]);

    assert.equal(fila.estado, 'invalida');
    assert.ok(
        fila.motivos.some(
            (motivo) => motivo.campo === 'telefono.codigoArea'
        )
    );
});

test('marca inválida una fila sin número de teléfono', async () => {
    const [fila] = await analizar([crearFila({ numero: null })]);

    assert.equal(fila.estado, 'invalida');
    assert.ok(
        fila.motivos.some(
            (motivo) => motivo.campo === 'telefono.numero'
        )
    );
});

test('un tipo de teléfono desconocido solo genera una advertencia', async () => {
    const [fila] = await analizar([crearFila({ tipo: 'fax' })]);

    assert.equal(fila.estado, 'valida');
    assert.ok(fila.advertencias.length > 0);
    assert.equal(fila.datos.telefono?.tipo, 'CELULAR');
});

// ============================================================
// OBRA SOCIAL Y AFILIADO
// ============================================================

test('reconoce una obra social con puntos y acentos', async () => {
    const [fila] = await analizar([
        crearFila({ obraSocial: 'Swiss Médical' }),
    ]);

    assert.equal(fila.estado, 'valida');
    assert.equal(fila.datos.obraSocial?.nombre, 'SWISS MEDICAL');
});

test('rechaza una obra social desconocida sin convertirla a OTRAS', async () => {
    const [fila] = await analizar([
        crearFila({ obraSocial: 'IOMA' }),
    ]);

    assert.equal(fila.estado, 'invalida');
    assert.ok(
        fila.motivos.some(
            (motivo) =>
                motivo.campo === 'obraSocial.nombre' &&
                /Valores admitidos/.test(motivo.mensaje)
        )
    );
});

test('descarta el número de afiliado si la obra social no se reconoce', async () => {
    const [fila] = await analizar([
        crearFila({ obraSocial: 'IOMA', afiliado: 'A-123' }),
    ]);

    assert.equal(fila.estado, 'invalida');
    assert.equal(fila.datos.obraSocial?.numeroAfiliado, undefined);
    assert.ok(
        fila.advertencias.some(
            (advertencia) =>
                advertencia.campo === 'obraSocial.numeroAfiliado'
        )
    );
});

test('una obra social vacía usa el default NINGUNA', async () => {
    const [fila] = await analizar([crearFila()]);

    assert.equal(fila.estado, 'valida');
    assert.equal(fila.datos.obraSocial?.nombre, 'NINGUNA');
});

test('descarta el número de afiliado si no hay obra social', async () => {
    const [fila] = await analizar([
        crearFila({ afiliado: 'A-123' }),
    ]);

    assert.equal(fila.estado, 'valida');
    assert.ok(fila.advertencias.length > 0);
    assert.equal(fila.datos.obraSocial?.nombre, 'NINGUNA');
    assert.equal(fila.datos.obraSocial?.numeroAfiliado, undefined);
});

test('conserva el número de afiliado con una obra social reconocida', async () => {
    const [fila] = await analizar([
        crearFila({ obraSocial: 'OSDE', afiliado: 'A-123' }),
    ]);

    assert.equal(fila.estado, 'valida');
    assert.equal(fila.datos.obraSocial?.nombre, 'OSDE');
    assert.equal(fila.datos.obraSocial?.numeroAfiliado, 'A-123');
});

// ============================================================
// EMAIL
// ============================================================

test('rechaza un email con formato inválido', async () => {
    const [fila] = await analizar([
        crearFila({ email: 'no-es-un-email' }),
    ]);

    assert.equal(fila.estado, 'invalida');
    assert.ok(
        fila.motivos.some((motivo) => motivo.campo === 'email')
    );
});

test('marca conflicto de email si está repetido en el archivo', async () => {
    const filas = await analizar([
        crearFila({ email: 'repetido@example.com' }),
        crearFila({
            dni: '87654321',
            email: 'repetido@example.com',
        }),
    ]);

    assert.equal(filas[0].estado, 'valida');
    assert.equal(filas[1].estado, 'conflicto_email');
});

test('marca conflicto de email si ya existe en MongoDB', async () => {
    const [fila] = await analizar(
        [crearFila({ email: 'existente@example.com' })],
        consultasConEmails(['existente@example.com'])
    );

    assert.equal(fila.estado, 'conflicto_email');
});

test('un email vacío se omite y no invalida la fila', async () => {
    const [fila] = await analizar([crearFila({ email: '' })]);

    assert.equal(fila.estado, 'valida');
    assert.equal(fila.datos.email, undefined);
});

// ============================================================
// DOMICILIO
// ============================================================

test('conserva un domicilio completo', async () => {
    const [fila] = await analizar([
        crearFila({
            calle: 'San Martín',
            numeroCalle: 123,
            barrio: 'Centro',
        }),
    ]);

    assert.equal(fila.estado, 'valida');
    assert.equal(fila.datos.direccion?.calle, 'San Martín');
    assert.equal(fila.datos.direccion?.numero, '123');
    assert.equal(fila.datos.direccion?.barrio, 'Centro');
});

test('omite un domicilio vacío', async () => {
    const [fila] = await analizar([crearFila()]);

    assert.equal(fila.estado, 'valida');
    assert.equal(fila.datos.direccion, undefined);
});

test('descarta un domicilio parcial con advertencia', async () => {
    const [fila] = await analizar([
        crearFila({ calle: 'San Martín' }),
    ]);

    assert.equal(fila.estado, 'valida');
    assert.equal(fila.datos.direccion, undefined);
    assert.ok(
        fila.advertencias.some(
            (advertencia) => advertencia.campo === 'direccion'
        )
    );
});

// ============================================================
// FILAS VACÍAS, ENCABEZADOS Y COLUMNAS
// ============================================================

test('marca vacía una fila sin datos en columnas reconocidas', async () => {
    const [fila] = await analizar([
        Array(ENCABEZADOS.length).fill(null),
    ]);

    assert.equal(fila.estado, 'vacia');
});

test('rechaza encabezados duplicados', () => {
    verificarErrorColumnas(
        ['Nombre', 'DNI', 'Nombre', 'Codigo Area', 'Numero'],
        /encabezados duplicados/
    );
});

test('enumera las columnas desconocidas como ignoradas', () => {
    const mapeo = mapearColumnas(ENCABEZADOS);

    assert.ok(mapeo.ignoradas.includes('Observaciones'));
});
