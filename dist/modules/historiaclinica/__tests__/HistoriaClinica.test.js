"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const mongoose_1 = __importDefault(require("mongoose"));
const HistoriaClinica_1 = __importDefault(require("../models/HistoriaClinica"));
// ============================================================
// HELPERS
// ============================================================
const pacienteId = new mongoose_1.default.Types.ObjectId();
const medicoId = new mongoose_1.default.Types.ObjectId();
const crearHistoria = (datos = {}) => new HistoriaClinica_1.default({
    paciente: pacienteId,
    medico: medicoId,
    observaciones: 'Paciente con dolor de cabeza y fiebre leve',
    ...datos,
});
const crearMedicamento = (datos = {}) => ({
    nombre: 'Ibuprofeno',
    dosis: '400 mg',
    frecuencia: 'Cada 8 horas',
    ...datos,
});
// ============================================================
// VALORES PREDETERMINADOS
// ============================================================
(0, node_test_1.default)('aplica fecha de atención y recetario vacío por defecto', async () => {
    const antes = Date.now();
    const historia = crearHistoria();
    await historia.validate();
    strict_1.default.ok(historia.fechaAtencion instanceof Date);
    strict_1.default.ok(historia.fechaAtencion.getTime() >= antes);
    strict_1.default.deepEqual(historia.recetario, []);
});
(0, node_test_1.default)('acepta una fecha de atención explícita', async () => {
    const fechaAtencion = new Date('2026-01-15T10:30:00.000Z');
    const historia = crearHistoria({ fechaAtencion });
    await historia.validate();
    strict_1.default.equal(historia.fechaAtencion.toISOString(), fechaAtencion.toISOString());
});
// ============================================================
// REFERENCIAS OBLIGATORIAS
// ============================================================
(0, node_test_1.default)('exige el paciente', async () => {
    const historia = crearHistoria({ paciente: undefined });
    await strict_1.default.rejects(historia.validate(), /El paciente es obligatorio/);
});
(0, node_test_1.default)('exige el médico responsable', async () => {
    const historia = crearHistoria({ medico: undefined });
    await strict_1.default.rejects(historia.validate(), /El médico es obligatorio/);
});
// ============================================================
// OBSERVACIONES
// ============================================================
(0, node_test_1.default)('normaliza las observaciones con trim', async () => {
    const historia = crearHistoria({
        observaciones: '  Control de rutina  ',
    });
    await historia.validate();
    strict_1.default.equal(historia.observaciones, 'Control de rutina');
});
(0, node_test_1.default)('rechaza observaciones vacías', async () => {
    const historia = crearHistoria({ observaciones: '   ' });
    await strict_1.default.rejects(historia.validate(), /Las observaciones son obligatorias/);
});
(0, node_test_1.default)('rechaza observaciones de más de 2000 caracteres', async () => {
    const historia = crearHistoria({
        observaciones: 'a'.repeat(2001),
    });
    await strict_1.default.rejects(historia.validate(), /no pueden superar los 2000 caracteres/);
});
// ============================================================
// RECETARIO
// ============================================================
(0, node_test_1.default)('acepta un recetario vacío', async () => {
    const historia = crearHistoria({ recetario: [] });
    await historia.validate();
    strict_1.default.deepEqual(historia.recetario, []);
});
(0, node_test_1.default)('acepta medicamentos sin campos opcionales', async () => {
    const historia = crearHistoria({
        recetario: [crearMedicamento()],
    });
    await historia.validate();
    strict_1.default.equal(historia.recetario.length, 1);
    strict_1.default.equal(historia.recetario[0].duracion, undefined);
    strict_1.default.equal(historia.recetario[0].indicaciones, undefined);
});
(0, node_test_1.default)('acepta medicamentos con duración e indicaciones', async () => {
    const historia = crearHistoria({
        recetario: [
            crearMedicamento({
                duracion: '5 días',
                indicaciones: 'Tomar después de las comidas',
            }),
        ],
    });
    await historia.validate();
    strict_1.default.equal(historia.recetario[0].duracion, '5 días');
    strict_1.default.equal(historia.recetario[0].indicaciones, 'Tomar después de las comidas');
});
(0, node_test_1.default)('exige el nombre del medicamento', async () => {
    const historia = crearHistoria({
        recetario: [crearMedicamento({ nombre: undefined })],
    });
    await strict_1.default.rejects(historia.validate(), /El nombre del medicamento es obligatorio/);
});
(0, node_test_1.default)('exige la dosis del medicamento', async () => {
    const historia = crearHistoria({
        recetario: [crearMedicamento({ dosis: undefined })],
    });
    await strict_1.default.rejects(historia.validate(), /La dosis del medicamento es obligatoria/);
});
(0, node_test_1.default)('exige la frecuencia del medicamento', async () => {
    const historia = crearHistoria({
        recetario: [crearMedicamento({ frecuencia: undefined })],
    });
    await strict_1.default.rejects(historia.validate(), /La frecuencia del medicamento es obligatoria/);
});
// ============================================================
// SERIALIZACIÓN
// ============================================================
(0, node_test_1.default)('serializa _id como id y elimina __v', async () => {
    const historia = crearHistoria({
        recetario: [crearMedicamento()],
    });
    await historia.validate();
    const json = historia.toJSON();
    strict_1.default.equal(json.id.toString(), historia._id.toString());
    strict_1.default.equal(json._id, undefined);
    strict_1.default.equal(json.__v, undefined);
    strict_1.default.equal(json.recetario[0]._id, undefined);
});
