"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const autorizarRoles_middleware_1 = __importDefault(require("../../../middlewares/autorizarRoles.middleware"));
const consultorio_controller_js_1 = require("../controllers/consultorio.controller.js");
const router = (0, express_1.Router)();
// Consulta de consultorios: información operativa necesaria para recepción
// y para el personal médico.
router.get('/', (0, autorizarRoles_middleware_1.default)('admin', 'recepcionista'), consultorio_controller_js_1.getConsultorios);
// Altas, cambios y bajas de consultorios: solo administración.
router.post('/', (0, autorizarRoles_middleware_1.default)('admin'), consultorio_controller_js_1.createConsultorio);
router.put('/:id', (0, autorizarRoles_middleware_1.default)('admin'), consultorio_controller_js_1.updateConsultorio);
router.delete('/:id', (0, autorizarRoles_middleware_1.default)('admin'), consultorio_controller_js_1.deleteConsultorio);
exports.default = router;
