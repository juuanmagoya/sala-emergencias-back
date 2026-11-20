"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const autorizarRoles_middleware_1 = __importDefault(require("../../../middlewares/autorizarRoles.middleware"));
const historiaclinica_controller_1 = require("../controllers/historiaclinica.controller");
const router = (0, express_1.Router)();
// Lectura de historias clínicas: información sensible. Solo personal médico
// (autor del registro) y administración con fines de supervisión.
router.get('/', (0, autorizarRoles_middleware_1.default)('admin', 'medico'), historiaclinica_controller_1.getHistoriasClinicas);
// Historial propio del paciente autenticado: solo lectura y resuelto
// exclusivamente desde la identidad del JWT. Debe declararse antes de
// `/:id` para que la ruta estática no sea capturada como identificador.
router.get('/mi-historial', (0, autorizarRoles_middleware_1.default)('paciente'), historiaclinica_controller_1.getMiHistorial);
router.get('/paciente/:pacienteId', (0, autorizarRoles_middleware_1.default)('admin', 'medico'), historiaclinica_controller_1.getHistorialPaciente);
router.get('/:id', (0, autorizarRoles_middleware_1.default)('admin', 'medico'), historiaclinica_controller_1.getHistoriaClinicaById);
// Escritura clínica: personal médico y administración (superusuario).
// Recepción no accede a registros clínicos. La autoría clínica por perfil
// médico se resolverá en la etapa de atención médica.
router.post('/', (0, autorizarRoles_middleware_1.default)('admin', 'medico'), historiaclinica_controller_1.createHistoriaClinica);
router.put('/:id', (0, autorizarRoles_middleware_1.default)('admin', 'medico'), historiaclinica_controller_1.updateHistoriaClinica);
// No se expone DELETE: los registros clínicos no se eliminan.
exports.default = router;
