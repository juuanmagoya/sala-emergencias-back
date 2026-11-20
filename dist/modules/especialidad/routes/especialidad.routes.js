"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const autorizarRoles_middleware_1 = __importDefault(require("../../../middlewares/autorizarRoles.middleware"));
const especialidad_controller_1 = require("../controllers/especialidad.controller");
const router = (0, express_1.Router)();
// Catálogo del portal de pacientes: solo especialidades activas y con
// proyección mínima. Se declara antes de las rutas con parámetros.
router.get('/disponibles', (0, autorizarRoles_middleware_1.default)('paciente'), especialidad_controller_1.getEspecialidadesDisponibles);
// Catálogo de especialidades: lectura para todo el personal autenticado
// (recepción asigna turnos por especialidad).
router.get('/', (0, autorizarRoles_middleware_1.default)('admin', 'medico', 'recepcionista'), especialidad_controller_1.getEspecialidades);
// Mantenimiento del catálogo: solo administración.
router.post('/', (0, autorizarRoles_middleware_1.default)('admin'), especialidad_controller_1.createEspecialidad);
router.put('/:id', (0, autorizarRoles_middleware_1.default)('admin'), especialidad_controller_1.updateEspecialidad);
router.patch('/:id/toggle-estado', (0, autorizarRoles_middleware_1.default)('admin'), especialidad_controller_1.toggleActivoEspecialidad);
router.delete('/:id/permanente', (0, autorizarRoles_middleware_1.default)('admin'), especialidad_controller_1.deleteEspecialidadPermanente);
exports.default = router;
