import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
    convertirAHoraUtc,
    esZonaHorariaValida,
    formatearHora,
    obtenerDiaSemanaLocal,
    obtenerPartesEnZona,
    parsearFechaHoraLocal,
    parsearFechaLocal,
    siguienteDiaLocal,
} from '../fechaHora';

const ZONA_ARGENTINA = 'America/Argentina/Buenos_Aires';

// ============================================================
// PARSEO DE FECHA Y HORA LOCAL
// ============================================================

test('interpreta una fecha sin zona en la zona del centro médico', () => {
    const fecha = parsearFechaHoraLocal(
        '2026-11-02T09:00',
        ZONA_ARGENTINA
    );

    assert.ok(fecha);
    assert.equal(
        fecha.toISOString(),
        '2026-11-02T12:00:00.000Z'
    );
});

test('respeta un desplazamiento explícito enviado por el cliente', () => {
    const fecha = parsearFechaHoraLocal(
        '2026-11-02T09:00:00-03:00',
        ZONA_ARGENTINA
    );

    assert.ok(fecha);
    assert.equal(
        fecha.toISOString(),
        '2026-11-02T12:00:00.000Z'
    );
});

test('no cambia el día local en horarios cercanos a la medianoche', () => {
    const fecha = parsearFechaHoraLocal(
        '2026-11-02T00:30',
        ZONA_ARGENTINA
    );

    assert.ok(fecha);
    assert.equal(
        fecha.toISOString(),
        '2026-11-02T03:30:00.000Z'
    );

    const partes = obtenerPartesEnZona(fecha, ZONA_ARGENTINA);

    assert.deepEqual(partes, {
        anio: 2026,
        mes: 11,
        dia: 2,
        hora: 0,
        minuto: 30,
        segundo: 0,
    });
});

test('un instante UTC puede pertenecer al día local anterior', () => {
    const partes = obtenerPartesEnZona(
        new Date('2026-11-02T02:30:00.000Z'),
        ZONA_ARGENTINA
    );

    assert.deepEqual(partes, {
        anio: 2026,
        mes: 11,
        dia: 1,
        hora: 23,
        minuto: 30,
        segundo: 0,
    });
    assert.equal(obtenerDiaSemanaLocal(partes), 0);
});

test('rechaza fechas y horas inválidas', () => {
    const invalidas = [
        '2026-02-30T09:00',
        '2026-13-01T09:00',
        '2026-11-02T25:00',
        '2026-11-02T09:60',
        '2026-11-02',
        '02/11/2026 09:00',
        '',
    ];

    for (const valor of invalidas) {
        assert.equal(
            parsearFechaHoraLocal(valor, ZONA_ARGENTINA),
            null,
            `Debería rechazar ${valor}`
        );
    }
});

// ============================================================
// FECHAS DE CALENDARIO
// ============================================================

test('parsea una fecha de calendario y calcula el día de semana', () => {
    const lunes = parsearFechaLocal('2026-11-02');
    const domingo = parsearFechaLocal('2026-11-01');

    assert.ok(lunes);
    assert.ok(domingo);
    assert.equal(obtenerDiaSemanaLocal(lunes), 1);
    assert.equal(obtenerDiaSemanaLocal(domingo), 0);
});

test('rechaza fechas de calendario inválidas', () => {
    assert.equal(parsearFechaLocal('2026-02-30'), null);
    assert.equal(parsearFechaLocal('2026-11-02T09:00'), null);
    assert.equal(parsearFechaLocal(''), null);
});

test('avanza al día siguiente contemplando fin de mes', () => {
    assert.deepEqual(
        siguienteDiaLocal({ anio: 2026, mes: 11, dia: 30 }),
        { anio: 2026, mes: 12, dia: 1 }
    );
});

// ============================================================
// CONVERSIONES
// ============================================================

test('convierte la medianoche local al instante UTC correcto', () => {
    const fecha = convertirAHoraUtc(
        2026,
        11,
        2,
        0,
        0,
        0,
        ZONA_ARGENTINA
    );

    assert.equal(
        fecha.toISOString(),
        '2026-11-02T03:00:00.000Z'
    );
});

test('valida zonas horarias IANA', () => {
    assert.equal(esZonaHorariaValida(ZONA_ARGENTINA), true);
    assert.equal(esZonaHorariaValida('Zona/Inexistente'), false);
    assert.equal(esZonaHorariaValida(''), false);
});

test('formatea minutos desde medianoche como HH:mm', () => {
    assert.equal(formatearHora(0), '00:00');
    assert.equal(formatearHora(8 * 60 + 5), '08:05');
    assert.equal(formatearHora(23 * 60 + 59), '23:59');
});
