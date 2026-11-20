"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const Turno_1 = __importDefault(require("../models/Turno"));
// ============================================================
// ESQUEMA
// ============================================================
(0, node_test_1.test)('el turno exige médico y fecha de fin para los registros nuevos', () => {
    const medico = Turno_1.default.schema.path('medico');
    const fechaFin = Turno_1.default.schema.path('fechaFin');
    strict_1.default.equal(medico?.isRequired, true);
    strict_1.default.equal(fechaFin?.isRequired, true);
    strict_1.default.equal(medico
        .options.ref, 'Medico');
});
(0, node_test_1.test)('el estado inicial por defecto es pendiente', () => {
    const estado = Turno_1.default.schema.path('estado');
    strict_1.default.equal(estado.defaultValue, 'pendiente');
});
const obtenerIndices = () => Turno_1.default.schema.indexes();
(0, node_test_1.test)('existe un índice único parcial para reservas activas', () => {
    const indices = obtenerIndices();
    const indiceUnico = indices.find((indice) => indice[1].name ===
        'turnos_activos_unicos_por_medico_fecha');
    strict_1.default.ok(indiceUnico);
    const [campos, opciones] = indiceUnico;
    strict_1.default.deepEqual(campos, {
        medico: 1,
        fechaTurno: 1,
    });
    strict_1.default.equal(opciones.unique, true);
    const filtro = opciones.partialFilterExpression;
    strict_1.default.deepEqual(filtro.$or, [
        { estado: 'pendiente' },
        { estado: 'atendido' },
    ]);
});
(0, node_test_1.test)('existe un índice de consulta por médico y fecha', () => {
    const indices = obtenerIndices();
    const indiceConsulta = indices.find((indice) => indice[1].name === 'turnos_por_medico_fecha');
    strict_1.default.ok(indiceConsulta);
    strict_1.default.equal(indiceConsulta[1]?.unique, undefined);
});
(0, node_test_1.test)('existe un índice de historial por paciente y fecha', () => {
    const indices = obtenerIndices();
    const indiceHistorial = indices.find((indice) => indice[1].name === 'turnos_por_paciente_fecha');
    strict_1.default.ok(indiceHistorial);
    const [campos, opciones] = indiceHistorial;
    strict_1.default.deepEqual(campos, {
        paciente: 1,
        fechaTurno: -1,
    });
    strict_1.default.equal(opciones.unique, undefined);
});
