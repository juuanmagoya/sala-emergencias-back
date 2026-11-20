"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const historiaclinica_service_1 = __importDefault(require("../services/historiaclinica.service"));
// ============================================================
// VALIDACIONES DE IDENTIFICADORES (sin acceso a la base)
// ============================================================
(0, node_test_1.default)('rechaza un ID inválido al buscar una historia clínica', async () => {
    await strict_1.default.rejects(historiaclinica_service_1.default.getHistoriaClinicaById('id-invalido'), /El ID de la historia clínica no es válido/);
});
(0, node_test_1.default)('rechaza un ID inválido al buscar el historial de un paciente', async () => {
    await strict_1.default.rejects(historiaclinica_service_1.default.getHistorialPaciente('id-invalido'), /El ID del paciente no es válido/);
});
(0, node_test_1.default)('rechaza un ID inválido al actualizar una historia clínica', async () => {
    await strict_1.default.rejects(historiaclinica_service_1.default.updateHistoriaClinica('id-invalido', {}), /El ID de la historia clínica no es válido/);
});
(0, node_test_1.default)('rechaza IDs inválidos al crear una historia clínica', async () => {
    await strict_1.default.rejects(historiaclinica_service_1.default.createHistoriaClinica({
        paciente: 'id-invalido',
        medico: 'id-invalido',
        observaciones: 'Observaciones de prueba',
    }), /El ID del paciente no es válido|El ID del médico no es válido/);
});
(0, node_test_1.default)('rechaza un filtro con ID de paciente inválido', async () => {
    await strict_1.default.rejects(historiaclinica_service_1.default.getHistoriasClinicas({
        paciente: 'id-invalido',
    }), /El ID del paciente no es válido/);
});
(0, node_test_1.default)('rechaza un filtro con ID de médico inválido', async () => {
    await strict_1.default.rejects(historiaclinica_service_1.default.getHistoriasClinicas({
        medico: 'id-invalido',
    }), /El ID del médico no es válido/);
});
