"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const autorizarRoles_middleware_1 = __importDefault(require("../../../middlewares/autorizarRoles.middleware"));
const recepcion_controller_1 = require("../controllers/recepcion.controller");
const router = (0, express_1.Router)();
// Registrar ingreso de un paciente nuevo por recepción
// (crea el paciente y su turno dentro de una transacción).
// Solo recepción y administración.
router.post('/', (0, autorizarRoles_middleware_1.default)('admin', 'recepcionista'), recepcion_controller_1.registrarIngreso);
exports.default = router;
