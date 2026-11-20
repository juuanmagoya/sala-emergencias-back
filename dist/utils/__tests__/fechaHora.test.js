"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const fechaHora_1 = require("../fechaHora");
const ZONA_ARGENTINA = 'America/Argentina/Buenos_Aires';
// ============================================================
// PARSEO DE FECHA Y HORA LOCAL
// ============================================================
(0, node_test_1.test)('interpreta una fecha sin zona en la zona del centro médico', () => {
    const fecha = (0, fechaHora_1.parsearFechaHoraLocal)('2026-11-02T09:00', ZONA_ARGENTINA);
    strict_1.default.ok(fecha);
    strict_1.default.equal(fecha.toISOString(), '2026-11-02T12:00:00.000Z');
});
(0, node_test_1.test)('respeta un desplazamiento explícito enviado por el cliente', () => {
    const fecha = (0, fechaHora_1.parsearFechaHoraLocal)('2026-11-02T09:00:00-03:00', ZONA_ARGENTINA);
    strict_1.default.ok(fecha);
    strict_1.default.equal(fecha.toISOString(), '2026-11-02T12:00:00.000Z');
});
(0, node_test_1.test)('no cambia el día local en horarios cercanos a la medianoche', () => {
    const fecha = (0, fechaHora_1.parsearFechaHoraLocal)('2026-11-02T00:30', ZONA_ARGENTINA);
    strict_1.default.ok(fecha);
    strict_1.default.equal(fecha.toISOString(), '2026-11-02T03:30:00.000Z');
    const partes = (0, fechaHora_1.obtenerPartesEnZona)(fecha, ZONA_ARGENTINA);
    strict_1.default.deepEqual(partes, {
        anio: 2026,
        mes: 11,
        dia: 2,
        hora: 0,
        minuto: 30,
        segundo: 0,
    });
});
(0, node_test_1.test)('un instante UTC puede pertenecer al día local anterior', () => {
    const partes = (0, fechaHora_1.obtenerPartesEnZona)(new Date('2026-11-02T02:30:00.000Z'), ZONA_ARGENTINA);
    strict_1.default.deepEqual(partes, {
        anio: 2026,
        mes: 11,
        dia: 1,
        hora: 23,
        minuto: 30,
        segundo: 0,
    });
    strict_1.default.equal((0, fechaHora_1.obtenerDiaSemanaLocal)(partes), 0);
});
(0, node_test_1.test)('rechaza fechas y horas inválidas', () => {
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
        strict_1.default.equal((0, fechaHora_1.parsearFechaHoraLocal)(valor, ZONA_ARGENTINA), null, `Debería rechazar ${valor}`);
    }
});
// ============================================================
// FECHAS DE CALENDARIO
// ============================================================
(0, node_test_1.test)('parsea una fecha de calendario y calcula el día de semana', () => {
    const lunes = (0, fechaHora_1.parsearFechaLocal)('2026-11-02');
    const domingo = (0, fechaHora_1.parsearFechaLocal)('2026-11-01');
    strict_1.default.ok(lunes);
    strict_1.default.ok(domingo);
    strict_1.default.equal((0, fechaHora_1.obtenerDiaSemanaLocal)(lunes), 1);
    strict_1.default.equal((0, fechaHora_1.obtenerDiaSemanaLocal)(domingo), 0);
});
(0, node_test_1.test)('rechaza fechas de calendario inválidas', () => {
    strict_1.default.equal((0, fechaHora_1.parsearFechaLocal)('2026-02-30'), null);
    strict_1.default.equal((0, fechaHora_1.parsearFechaLocal)('2026-11-02T09:00'), null);
    strict_1.default.equal((0, fechaHora_1.parsearFechaLocal)(''), null);
});
(0, node_test_1.test)('avanza al día siguiente contemplando fin de mes', () => {
    strict_1.default.deepEqual((0, fechaHora_1.siguienteDiaLocal)({ anio: 2026, mes: 11, dia: 30 }), { anio: 2026, mes: 12, dia: 1 });
});
// ============================================================
// CONVERSIONES
// ============================================================
(0, node_test_1.test)('convierte la medianoche local al instante UTC correcto', () => {
    const fecha = (0, fechaHora_1.convertirAHoraUtc)(2026, 11, 2, 0, 0, 0, ZONA_ARGENTINA);
    strict_1.default.equal(fecha.toISOString(), '2026-11-02T03:00:00.000Z');
});
(0, node_test_1.test)('valida zonas horarias IANA', () => {
    strict_1.default.equal((0, fechaHora_1.esZonaHorariaValida)(ZONA_ARGENTINA), true);
    strict_1.default.equal((0, fechaHora_1.esZonaHorariaValida)('Zona/Inexistente'), false);
    strict_1.default.equal((0, fechaHora_1.esZonaHorariaValida)(''), false);
});
(0, node_test_1.test)('formatea minutos desde medianoche como HH:mm', () => {
    strict_1.default.equal((0, fechaHora_1.formatearHora)(0), '00:00');
    strict_1.default.equal((0, fechaHora_1.formatearHora)(8 * 60 + 5), '08:05');
    strict_1.default.equal((0, fechaHora_1.formatearHora)(23 * 60 + 59), '23:59');
});
