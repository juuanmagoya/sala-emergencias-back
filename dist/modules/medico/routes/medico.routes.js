"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const autorizarRoles_middleware_1 = __importDefault(require("../../../middlewares/autorizarRoles.middleware"));
const medico_controller_1 = require("../controllers/medico.controller");
const router = (0, express_1.Router)();
// Lectura: directorio interno de profesionales (sin datos clínicos).
// Recepción lo necesita para orientar turnos; el personal médico, para consultar
// el plantel. La administración conserva el acceso completo.
router.get('/', (0, autorizarRoles_middleware_1.default)('admin', 'medico', 'recepcionista'), medico_controller_1.getMedicos);
// Alta y modificaciones del plantel: solo administración.
router.post('/', (0, autorizarRoles_middleware_1.default)('admin'), medico_controller_1.createMedico);
router.put('/:id', (0, autorizarRoles_middleware_1.default)('admin'), medico_controller_1.updateMedico);
router.patch('/:id/toggle-estado', (0, autorizarRoles_middleware_1.default)('admin'), medico_controller_1.toggleActivoMedico);
router.delete('/:id/permanente', (0, autorizarRoles_middleware_1.default)('admin'), medico_controller_1.deleteMedicoPermanente);
exports.default = router;
