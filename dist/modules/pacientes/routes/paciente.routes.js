"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const autorizarRoles_middleware_1 = __importDefault(require("../../../middlewares/autorizarRoles.middleware"));
const paciente_controller_1 = require("../controllers/paciente.controller");
const router = (0, express_1.Router)();
// Consulta de pacientes: recepción los administra y el personal médico
// necesita los datos para la atención.
router.get('/', (0, autorizarRoles_middleware_1.default)('admin', 'medico', 'recepcionista'), paciente_controller_1.getPacientes);
// Registro y actualización de datos demográficos: administración y recepción.
router.post('/', (0, autorizarRoles_middleware_1.default)('admin', 'recepcionista'), paciente_controller_1.createPaciente);
router.put('/:id', (0, autorizarRoles_middleware_1.default)('admin', 'recepcionista'), paciente_controller_1.updatePaciente);
// El borrado es físico y está condicionado a que no existan turnos activos.
// Se reserva a administración.
router.delete('/:id', (0, autorizarRoles_middleware_1.default)('admin'), paciente_controller_1.deletePaciente);
exports.default = router;
